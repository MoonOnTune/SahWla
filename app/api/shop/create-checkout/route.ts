import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { createCheckoutSchema } from "@/lib/validation/api";
import { createUpaymentsCharge, getUpaymentsMode } from "@/lib/upayments/client";

export const runtime = "nodejs";

type CouponRule = { type: "percent" | "fixed"; discount: number };

const COUPONS: Record<string, CouponRule> = {
  WELCOME10: { type: "percent", discount: 10 },
  FREE1: { type: "fixed", discount: 0.2 },
  HALF: { type: "percent", discount: 50 },
};

function roundKwd(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function computeDiscount(subtotal: number, couponCode?: string): { code: string | null; discount: number } {
  if (!couponCode) return { code: null, discount: 0 };
  const code = couponCode.trim().toUpperCase();
  const rule = COUPONS[code];
  if (!rule) return { code: null, discount: 0 };
  if (rule.type === "percent") {
    return { code, discount: roundKwd(subtotal * (rule.discount / 100)) };
  }
  return { code, discount: roundKwd(Math.min(rule.discount, subtotal)) };
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createCheckoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const product = parsed.data.productId
    ? await prisma.product.findFirst({ where: { id: parsed.data.productId, active: true } })
    : await prisma.product.findFirst({ where: { sku: "PLAY_5_KWD_1", active: true } });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const quantity = parsed.data.quantity ?? product.credit_amount;
  const unitPriceKwd = Number(product.price_kwd) / product.credit_amount;
  const subtotalKwd = roundKwd(quantity * unitPriceKwd);
  const { code: appliedCouponCode, discount: discountKwd } = computeDiscount(
    subtotalKwd,
    parsed.data.couponCode,
  );
  const totalKwd = roundKwd(Math.max(0, subtotalKwd - discountKwd));

  const externalOrderId = `PO-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const paymentOrder = await prisma.paymentOrder.create({
    data: {
      provider: "U_PAYMENTS",
      external_order_id: externalOrderId,
      status: "CREATED",
      amount_kwd: new Prisma.Decimal(totalKwd.toFixed(3)),
      currency: "KWD",
      product_id: product.id,
      user_id: userId,
      requested_credits: quantity,
      unit_price_kwd: new Prisma.Decimal(unitPriceKwd.toFixed(3)),
      coupon_code: appliedCouponCode,
      discount_kwd: new Prisma.Decimal(discountKwd.toFixed(3)),
    },
  });

  try {
    const charge = await createUpaymentsCharge({
      externalOrderId,
      amountKwd: totalKwd.toFixed(3),
      description: product.description ?? product.name,
      customerName: user.name ?? "Sah Wala Player",
      customerEmail: user.email ?? "no-email@sahwala.local",
      metadata: {
        userId,
        paymentOrderId: paymentOrder.id,
        productSku: product.sku,
        quantity,
        couponCode: appliedCouponCode,
      },
    });

    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: "PENDING",
        track_id: charge.trackId,
        payment_url: charge.paymentUrl,
        raw_create_response: charge.raw as object,
      },
    });

    return NextResponse.json(
      {
        checkout_url: charge.paymentUrl,
        track_id: charge.trackId,
        payment_order_id: paymentOrder.id,
        upayments_mode: getUpaymentsMode(),
        quantity,
        subtotal_kwd: subtotalKwd.toFixed(3),
        discount_kwd: discountKwd.toFixed(3),
        total_kwd: totalKwd.toFixed(3),
        credits: quantity,
      },
      { status: 200 },
    );
  } catch (error) {
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: "FAILED",
      },
    });

    return NextResponse.json(
      {
        error: "Failed to create checkout",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
