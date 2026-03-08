"use client";

import { useEffect } from "react";
import { getRealtimeClient } from "@/lib/game/realtime-client";

export function useRoomRealtime({
  channelName,
  enabled,
  onRoomUpdated,
}: {
  channelName: string | null;
  enabled: boolean;
  onRoomUpdated: () => void | Promise<void>;
}) {
  useEffect(() => {
    if (!enabled || !channelName) {
      return;
    }

    const client = getRealtimeClient();
    if (!client) {
      return;
    }

    const channel = client.subscribe(channelName);
    const handler = () => {
      void onRoomUpdated();
    };

    channel.bind("room.updated", handler);

    return () => {
      channel.unbind("room.updated", handler);
      client.unsubscribe(channelName);
    };
  }, [channelName, enabled, onRoomUpdated]);
}
