import crypto from "node:crypto";

export function computeEventId(provider: string, rawBody: string): string {
  return crypto.createHash("sha256").update(`${provider}:${rawBody}`).digest("hex");
}

export function verifyOptionalWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.UPAYMENTS_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest);
  const actual = Buffer.from(signatureHeader);

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}
