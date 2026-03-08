import { afterEach, describe, expect, it } from "vitest";
import { getRealtimeConfig } from "@/lib/game/realtime";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("realtime config", () => {
  it("prefers self-hosted soketi when configured", () => {
    process.env.SOKETI_APP_ID = "sahwla";
    process.env.SOKETI_APP_KEY = "key";
    process.env.SOKETI_APP_SECRET = "secret";
    process.env.SOKETI_HOST = "soketi";
    process.env.SOKETI_PORT = "6001";
    process.env.SOKETI_USE_TLS = "false";

    expect(getRealtimeConfig()).toEqual({
      provider: "soketi",
      appId: "sahwla",
      key: "key",
      secret: "secret",
      host: "soketi",
      port: 6001,
      useTLS: false,
    });
  });

  it("falls back to hosted pusher config", () => {
    delete process.env.SOKETI_APP_ID;
    delete process.env.SOKETI_APP_KEY;
    delete process.env.SOKETI_APP_SECRET;
    delete process.env.SOKETI_HOST;
    delete process.env.SOKETI_PORT;
    process.env.PUSHER_APP_ID = "123";
    process.env.NEXT_PUBLIC_PUSHER_KEY = "public";
    process.env.PUSHER_SECRET = "secret";
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER = "eu";

    expect(getRealtimeConfig()).toEqual({
      provider: "pusher",
      appId: "123",
      key: "public",
      secret: "secret",
      host: "api-eu.pusher.com",
      port: 443,
      useTLS: true,
    });
  });
});
