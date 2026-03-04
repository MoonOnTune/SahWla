type UnknownObject = Record<string, unknown>;

function isObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null;
}

function getByPath(data: unknown, path: string[]): unknown {
  let current: unknown = data;
  for (const segment of path) {
    if (!isObject(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function extractTrackId(data: unknown): string | null {
  const candidates = [
    ["track_id"],
    ["trackId"],
    ["data", "track_id"],
    ["data", "trackId"],
    ["payment", "track_id"],
    ["result", "track_id"],
    ["response", "track_id"],
  ];

  for (const candidate of candidates) {
    const value = asString(getByPath(data, candidate));
    if (value) return value;
  }

  return null;
}

export function extractPaymentUrl(data: unknown): string | null {
  const candidates = [
    ["payment_url"],
    ["paymentUrl"],
    ["link"],
    ["url"],
    ["data", "payment_url"],
    ["data", "paymentUrl"],
    ["data", "link"],
    ["result", "link"],
    ["result", "payment_url"],
  ];

  for (const candidate of candidates) {
    const value = asString(getByPath(data, candidate));
    if (value) return value;
  }

  return null;
}

export function extractPaymentStatus(data: unknown): string {
  const candidates = [
    ["status"],
    ["payment_status"],
    ["data", "status"],
    ["data", "payment_status"],
    ["payment", "status"],
    ["result", "status"],
  ];

  for (const candidate of candidates) {
    const value = asString(getByPath(data, candidate));
    if (value) return value.toUpperCase();
  }

  return "UNKNOWN";
}

export function isPaidStatus(status: string): boolean {
  const paid = new Set(["PAID", "SUCCESS", "CAPTURED", "APPROVED"]);
  return paid.has(status.toUpperCase());
}
