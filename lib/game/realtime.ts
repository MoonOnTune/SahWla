import type { GameTeamKey } from "@prisma/client";
import Pusher from "pusher";

export interface RealtimeProviderConfig {
  provider: "pusher";
  appId: string;
  key: string;
  secret: string;
  cluster: string;
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

export function getRealtimeConfig(): RealtimeProviderConfig | null {
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
    cluster,
  };
}

export function getHostRoomChannel(roomCode: string): string {
  return `private-room-${roomCode}-host`;
}

export function getTeamRoomChannel(roomCode: string, team: GameTeamKey): string {
  return `private-room-${roomCode}-team-${team}`;
}

export async function publishRealtimeEvent(_event: RealtimeEvent): Promise<void> {
  const config = getRealtimeConfig();

  if (!config) {
    return;
  }

  if (cachedServerClient === undefined) {
    cachedServerClient = new Pusher({
      appId: config.appId,
      key: config.key,
      secret: config.secret,
      cluster: config.cluster,
      useTLS: true,
    });
  }

  if (!cachedServerClient) {
    return;
  }

  await cachedServerClient.trigger(_event.channel, _event.event, _event.payload);
}
