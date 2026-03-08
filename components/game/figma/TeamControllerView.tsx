"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Smartphone, Users } from "lucide-react";
import { TeamChatPanel } from "./TeamChatPanel";
import { AbilityPanel } from "./AbilityPanel";
import { TeamBoardView } from "./TeamBoardView";
import { useRoomRealtime } from "./use-room-realtime";
import { getTeamRoomChannel } from "@/lib/game/realtime";
import type { TeamRoomSnapshot } from "@/lib/game/room-types";

const SNAPSHOT_POLL_INTERVAL_MS = 10_000;
const PRESENCE_HEARTBEAT_INTERVAL_MS = 15_000;

export function TeamControllerView({
  initialRoomCode,
  initialTeam,
  initialSnapshot,
}: {
  initialRoomCode: string;
  initialTeam: "A" | "B";
  initialSnapshot?: TeamRoomSnapshot | null;
}) {
  const [nickname, setNickname] = useState("");
  const [snapshot, setSnapshot] = useState<TeamRoomSnapshot | null>(initialSnapshot ?? null);
  const [error, setError] = useState("");

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch(`/api/game/rooms/${initialRoomCode}/snapshot`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      return;
    }

    setSnapshot(payload);
  }, [initialRoomCode]);

  const sendPresenceHeartbeat = useCallback(async () => {
    await fetch(`/api/game/rooms/${initialRoomCode}/presence`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    }).catch(() => null);
  }, [initialRoomCode]);

  const sendLeaveSignal = useCallback(() => {
    void fetch(`/api/game/rooms/${initialRoomCode}/leave`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    }).catch(() => null);
  }, [initialRoomCode]);

  useRoomRealtime({
    channelName: snapshot ? getTeamRoomChannel(initialRoomCode, snapshot.self.team) : null,
    enabled: Boolean(snapshot),
    onRoomUpdated: refreshSnapshot,
  });

  const team = useMemo(
    () => snapshot?.teams.find((entry) => entry.key === snapshot.self.team) ?? null,
    [snapshot],
  );

  useEffect(() => {
    if (initialSnapshot !== undefined) {
      return;
    }

    void (async () => {
      const response = await fetch(`/api/game/rooms/${initialRoomCode}/reconnect`, {
        method: "POST",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (response.ok && payload) {
        setSnapshot(payload);
      }
    })();
  }, [initialRoomCode, initialSnapshot]);

  useEffect(() => {
    if (!snapshot?.self.id) {
      return;
    }

    void sendPresenceHeartbeat();

    const refreshTimer = window.setInterval(() => {
      void refreshSnapshot();
    }, SNAPSHOT_POLL_INTERVAL_MS);
    const heartbeatTimer = window.setInterval(() => {
      void sendPresenceHeartbeat();
    }, PRESENCE_HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendPresenceHeartbeat();
        void refreshSnapshot();
        return;
      }

      sendLeaveSignal();
    };

    const handlePageLeave = () => {
      sendLeaveSignal();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageLeave);
    window.addEventListener("beforeunload", handlePageLeave);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(heartbeatTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageLeave);
      window.removeEventListener("beforeunload", handlePageLeave);
      handlePageLeave();
    };
  }, [refreshSnapshot, sendLeaveSignal, sendPresenceHeartbeat, snapshot?.self.id]);

  const handleJoin = async () => {
    setError("");

    const response = await fetch(`/api/game/rooms/${initialRoomCode}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        team: initialTeam,
        nickname,
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      setError(payload?.error ?? "تعذر الانضمام إلى الفريق");
      return;
    }

    setSnapshot(payload);
  };

  const handleSendChat = async (message: string) => {
    const response = await fetch(`/api/game/rooms/${initialRoomCode}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ message }),
    });
    const payload = await response.json().catch(() => null);

    if (response.ok && payload) {
      setSnapshot(payload);
    }
  };

  const handleSuggest = async (input: { categoryIndex: number; questionIndex: number; pickId: string }) => {
    const response = await fetch(`/api/game/rooms/${initialRoomCode}/suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => null);

    if (response.ok && payload) {
      setSnapshot(payload);
    }
  };

  const handleUseAbility = async (abilityType: string) => {
    const response = await fetch(`/api/game/rooms/${initialRoomCode}/ability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ abilityType }),
    });
    const payload = await response.json().catch(() => null);

    if (response.ok && payload) {
      setSnapshot(payload);
    }
  };

  if (!snapshot) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-5"
        style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)" }}
      >
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/6 p-6">
          <h1 className="text-white text-3xl mb-3" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900 }}>
            الانضمام إلى الفريق
          </h1>
          <p className="text-white/50 mb-5">الغرفة {initialRoomCode} • فريق {initialTeam}</p>
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="اكتب اسمك"
            className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-white placeholder:text-white/25 outline-none"
            style={{ fontFamily: "Cairo, sans-serif" }}
          />
          <button
            type="button"
            onClick={() => {
              void handleJoin();
            }}
            className="w-full mt-4 px-4 py-4 rounded-2xl text-white cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              fontFamily: "Cairo, sans-serif",
              fontWeight: 900,
            }}
          >
            انضم الآن
          </button>
          {error ? <p className="text-red-400 text-sm mt-3">{error}</p> : null}
        </div>
      </div>
    );
  }

  const isCaptain = snapshot.self.role === "CAPTAIN";

  return (
    <div
      dir="rtl"
      className="min-h-screen px-4 py-6"
      style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)" }}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        <div
          className="rounded-[32px] border p-5"
          style={{
            background: `linear-gradient(135deg, ${team?.color ?? "#06b6d4"}22, rgba(255,255,255,0.05))`,
            borderColor: `${team?.color ?? "#06b6d4"}45`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-3xl" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900 }}>
                {team?.name}
              </h1>
              <p className="text-white/50 mt-1">الغرفة {snapshot.roomCode}</p>
            </div>
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-white/80">
                <Smartphone className="w-4 h-4" />
                <span>{snapshot.self.nickname}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Users className="w-4 h-4" />
                <span>{team?.connectedCount ?? 0} أعضاء متصلون</span>
              </div>
              {isCaptain ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/25 text-amber-200">
                  <Crown className="w-4 h-4" />
                  <span>القائد</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <TeamBoardView snapshot={snapshot} canSuggest={isCaptain} onSuggest={handleSuggest} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <TeamChatPanel snapshot={snapshot} onSend={handleSendChat} />
          <AbilityPanel snapshot={snapshot} onUseAbility={handleUseAbility} />
        </div>
      </div>
    </div>
  );
}
