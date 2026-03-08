"use client";

import Pusher from "pusher-js";

let client: Pusher | null | undefined;

export function getRealtimeClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    return null;
  }

  if (client === undefined) {
    client = new Pusher(key, {
      cluster,
      channelAuthorization: {
        endpoint: "/api/game/realtime/auth",
        transport: "ajax",
      },
    });
  }

  return client;
}
