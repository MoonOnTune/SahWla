import { NextResponse } from "next/server";
import { Prisma, type PaymentOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getUpaymentsPaymentStatus } from "@/lib/upayments/client";
import { computeEventId, verifyOptionalWebhookSignature } from "@/lib/upayments/webhook";
import { extractTrackId, isPaidStatus } from "@/lib/upayments/parse";

export const runtime = "nodejs";

function readPath(payload: unknown, path: string[]): unknown {
  let current: unknown = payload;
  for (const segment of path) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractExternalOrderId(payload: unknown): string | null {
  const candidates = [
    ["order_id"],
    ["orderId"],
    ["order", "id"],
    ["reference", "id"],
    ["data", "order_id"],
    ["data", "reference", "id"],
  ];

  for (const candidate of candidates) {
    const value = asString(readPath(payload, candidate));
    if (value) return value;
  }

  return null;
}

function mapOrderStatus(status: string): PaymentOrderStatus {
  const upper = status.toUpperCase();

  if (isPaidStatus(upper)) return "PAID";
  if (["CANCELLED", "CANCELED", "VOIDED"].includes(upper)) return "CANCELLED";
  if (["PENDING", "PROCESSING", "IN_PROGRESS"].includes(upper)) return "PENDING";
  return "FAILED";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeaderName = process.env.UPAYMENTS_WEBHOOK_SIGNATURE_HEADER ?? "x-upayments-signature";
  const signatureHeader = request.headers.get(signatureHeaderName);

  if (!verifyOptionalWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const providerEventId = asString(readPath(payload, ["event_id"])) ?? asString(readPath(payload, ["id"]));
  const eventId = providerEventId ?? computeEventId("U_PAYMENTS", rawBody);
  const extractedTrackId = extractTrackId(payload);
  const externalOrderId = extractExternalOrderId(payload);

  const paymentEvent = await prisma.paymentEvent.upsert({
    where: { event_id: eventId },
    create: {
      provider: "U_PAYMENTS",
      event_id: eventId,
      payload: payload as Prisma.JsonObject,
      track_id: extractedTrackId,
    },
    update: {
      payload: payload as Prisma.JsonObject,
      track_id: extractedTrackId,
    },
  });

  if (paymentEvent.processed_at) {
    return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  }

  let paymentOrder = null;

  if (extractedTrackId) {
    paymentOrder = await prisma.paymentOrder.findUnique({
      where: { track_id: extractedTrackId },
      include: { product: true },
    });
  }

  if (!paymentOrder && externalOrderId) {
    paymentOrder = await prisma.paymentOrder.findUnique({
      where: { external_order_id: externalOrderId },
      include: { product: true },
    });
  }

  const trackIdToVerify = extractedTrackId ?? paymentOrder?.track_id;

  if (!trackIdToVerify) {
    await prisma.paymentEvent.update({
      where: { event_id: eventId },
      data: { processed_at: new Date() },
    });

    return NextResponse.json({ ok: true, ignored: "missing track_id" }, { status: 202 });
  }

  let verification;
  try {
    verification = await getUpaymentsPaymentStatus(trackIdToVerify);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed server-to-server payment verification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }

  if (!paymentOrder) {
    paymentOrder = await prisma.paymentOrder.findUnique({
      where: { track_id: trackIdToVerify },
      include: { product: true },
    });
  }

  if (!paymentOrder) {
    await prisma.paymentEvent.update({
      where: { event_id: eventId },
      data: { processed_at: new Date() },
    });

    return NextResponse.json({ ok: true, ignored: "order not found" }, { status: 202 });
  }

  const providerStatus = verification.status;
  const mappedStatus = mapOrderStatus(providerStatus);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    if (mappedStatus !== "PAID") {
      await tx.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: mappedStatus,
          verified_at: now,
          raw_verify_response: verification.raw as Prisma.JsonObject,
        },
      });

      await tx.paymentEvent.update({
        where: { event_id: eventId },
        data: { processed_at: now },
      });

      return { credited: false, status: mappedStatus };
    }

    const markPaid = await tx.paymentOrder.updateMany({
      where: {
        id: paymentOrder.id,
        status: { not: "PAID" },
      },
      data: {
        status: "PAID",
        track_id: trackIdToVerify,
        paid_at: now,
        verified_at: now,
        raw_verify_response: verification.raw as Prisma.JsonObject,
      },
    });

    if (markPaid.count === 1) {
      const creditsToGrant =
        paymentOrder.requested_credits > 0
          ? paymentOrder.requested_credits
          : paymentOrder.product.credit_amount;

      await tx.creditWallet.upsert({
        where: { user_id: paymentOrder.user_id },
        create: {
          user_id: paymentOrder.user_id,
          balance: creditsToGrant,
        },
        update: {
          balance: { increment: creditsToGrant },
        },
      });

      await tx.creditLedger.create({
        data: {
          user_id: paymentOrder.user_id,
          delta: creditsToGrant,
          reason: "PURCHASE",
          ref_type: "PAYMENT_ORDER",
          ref_id: paymentOrder.id,
        },
      });
    }

    await tx.paymentEvent.update({
      where: { event_id: eventId },
      data: { processed_at: now },
    });

    return { credited: markPaid.count === 1, status: "PAID" as const };
  });

  return NextResponse.json(
    {
      ok: true,
      status: result.status,
      credited: result.credited,
      track_id: trackIdToVerify,
      payment_order_id: paymentOrder.id,
    },
    { status: 200 },
  );
}
