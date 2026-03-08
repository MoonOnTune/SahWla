"use client";

import Pusher from "pusher-js";

let client: Pusher | null | undefined;

function readPort(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getRealtimeClient(): Pusher | null {
  const soketiKey = process.env.NEXT_PUBLIC_SOKETI_APP_KEY;
  const soketiHost = process.env.NEXT_PUBLIC_SOKETI_HOST;
  const soketiPort = readPort(process.env.NEXT_PUBLIC_SOKETI_PORT);
  const soketiTLS = process.env.NEXT_PUBLIC_SOKETI_TLS === "true";

  if (soketiKey && soketiHost && soketiPort) {
    if (client === undefined) {
      client = new Pusher(soketiKey, {
        cluster: "mt1",
        wsHost: soketiHost,
        wsPort: soketiPort,
        wssPort: soketiPort,
        forceTLS: soketiTLS,
        enabledTransports: soketiTLS ? ["ws", "wss"] : ["ws"],
        channelAuthorization: {
          endpoint: "/api/game/realtime/auth",
          transport: "ajax",
        },
      });
    }

    return client;
  }

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
