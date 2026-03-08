import type { GameTeamKey } from "@prisma/client";

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

  // The concrete provider client is added when the room routes are wired.
}
