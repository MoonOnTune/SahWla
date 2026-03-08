import type { GameTeamKey } from "@prisma/client";
import Pusher from "pusher";

export interface RealtimeProviderConfig {
  provider: "pusher" | "soketi";
  appId: string;
  key: string;
  secret: string;
  host: string;
  port: number;
  useTLS: boolean;
}

export interface RealtimeEvent {
  channel: string;
  event: string;
  payload: unknown;
}

let cachedServerClient: Pusher | null | undefined;

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function readNumberEnv(name: string): number | null {
  const value = readEnv(name);
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = readEnv(name);
  if (!value) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true";
}

export function getRealtimeConfig(): RealtimeProviderConfig | null {
  const soketiAppId = readEnv("SOKETI_APP_ID");
  const soketiKey = readEnv("SOKETI_APP_KEY") ?? readEnv("NEXT_PUBLIC_SOKETI_APP_KEY");
  const soketiSecret = readEnv("SOKETI_APP_SECRET");
  const soketiHost = readEnv("SOKETI_HOST");
  const soketiPort = readNumberEnv("SOKETI_PORT");
  const soketiUseTLS = readBooleanEnv("SOKETI_USE_TLS", false);

  if (soketiAppId && soketiKey && soketiSecret && soketiHost && soketiPort) {
    return {
      provider: "soketi",
      appId: soketiAppId,
      key: soketiKey,
      secret: soketiSecret,
      host: soketiHost,
      port: soketiPort,
      useTLS: soketiUseTLS,
    };
  }

  const appId = readEnv("PUSHER_APP_ID");
  const key = readEnv("NEXT_PUBLIC_PUSHER_KEY");
  const secret = readEnv("PUSHER_SECRET");
  const cluster = readEnv("NEXT_PUBLIC_PUSHER_CLUSTER");

  if (!appId || !key || !secret || !cluster) {
    return null;
  }

  return {
    provider: "pusher",
    appId,
    key,
    secret,
    host: `api-${cluster}.pusher.com`,
    port: 443,
    useTLS: true,
  };
}

export function getRealtimeServerClient(): Pusher | null {
  const config = getRealtimeConfig();

  if (!config) {
    return null;
  }

  if (cachedServerClient === undefined) {
    cachedServerClient = new Pusher({
      appId: config.appId,
      key: config.key,
      secret: config.secret,
      host: config.host,
      port: String(config.port),
      useTLS: config.useTLS,
    });
  }

  return cachedServerClient ?? null;
}

export function getHostRoomChannel(roomCode: string): string {
  return `private-room-${roomCode}-host`;
}

export function getTeamRoomChannel(roomCode: string, team: GameTeamKey): string {
  return `private-room-${roomCode}-team-${team}`;
}

export async function publishRealtimeEvent(_event: RealtimeEvent): Promise<void> {
  const client = getRealtimeServerClient();
  if (!client) {
    return;
  }

  await client.trigger(_event.channel, _event.event, _event.payload);
}
