import { extractPaymentStatus, extractPaymentUrl, extractTrackId } from "@/lib/upayments/parse";

const SANDBOX_BASE_URL = "https://sandboxapi.upayments.com";
const LIVE_BASE_URL = "https://api.upayments.com";

export type UpaymentsMode = "sandbox" | "live";

export function getUpaymentsMode(): UpaymentsMode {
  const rawMode = (process.env.UPAYMENTS_MODE ?? "sandbox").trim().toLowerCase();
  return rawMode === "live" ? "live" : "sandbox";
}

export type CreateChargeInput = {
  externalOrderId: string;
  amountKwd: string;
  description: string;
  customerName: string;
  customerEmail: string;
  metadata?: Record<string, unknown>;
};

function getBaseUrl(): string {
  const mode = getUpaymentsMode();
  const defaultBaseUrl = mode === "live" ? LIVE_BASE_URL : SANDBOX_BASE_URL;
  return (process.env.UPAYMENTS_BASE_URL ?? defaultBaseUrl).replace(/\/$/, "");
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAuthHeaders(): HeadersInit {
  const apiKey = getRequiredEnv("UPAYMENTS_API_KEY");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function getTimeoutMs(): number {
  const raw = Number(process.env.UPAYMENTS_TIMEOUT_MS ?? 20000);
  if (!Number.isFinite(raw) || raw < 1000) return 20000;
  return Math.floor(raw);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const rawText = await response.text();
  if (!rawText) return {};
  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

export async function createUpaymentsCharge(input: CreateChargeInput): Promise<{
  raw: unknown;
  trackId: string;
  paymentUrl: string;
}> {
  const timeoutMs = getTimeoutMs();
  const payload = {
    order: {
      id: input.externalOrderId,
      currency: "KWD",
      amount: input.amountKwd,
      description: input.description,
    },
    customer: {
      name: input.customerName,
      email: input.customerEmail,
    },
    language: process.env.UPAYMENTS_LANGUAGE ?? "ar",
    return_url: getRequiredEnv("UPAYMENTS_RETURN_URL"),
    cancel_url: getRequiredEnv("UPAYMENTS_CANCEL_URL"),
    notification_url: getRequiredEnv("UPAYMENTS_WEBHOOK_URL"),
    reference: {
      id: input.externalOrderId,
    },
    metadata: input.metadata ?? {},
  };

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/v1/charge`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      throw new Error(`UPayments charge request timed out after ${timeoutMs}ms`);
    }
    throw new Error(
      `UPayments charge request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  const raw = await parseResponseBody(response);

  if (!response.ok) {
    const details = typeof raw === "string" ? raw : JSON.stringify(raw);
    throw new Error(
      `UPayments charge creation failed with status ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  const trackId = extractTrackId(raw);
  const paymentUrl = extractPaymentUrl(raw);

  if (!trackId || !paymentUrl) {
    throw new Error("UPayments charge response is missing track_id or payment URL");
  }

  return { raw, trackId, paymentUrl };
}

export async function getUpaymentsPaymentStatus(trackId: string): Promise<{
  raw: unknown;
  status: string;
}> {
  const timeoutMs = getTimeoutMs();
  let response: Response;
  try {
    response = await fetch(
      `${getBaseUrl()}/api/v1/get-payment-status/${encodeURIComponent(trackId)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      throw new Error(`UPayments status request timed out after ${timeoutMs}ms`);
    }
    throw new Error(
      `UPayments status request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  const raw = await parseResponseBody(response);

  if (!response.ok) {
    const details = typeof raw === "string" ? raw : JSON.stringify(raw);
    throw new Error(
      `UPayments status verification failed with status ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  return {
    raw,
    status: extractPaymentStatus(raw),
  };
}
