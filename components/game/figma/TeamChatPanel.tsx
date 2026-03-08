import React, { useState } from "react";
import type { TeamRoomSnapshot } from "@/lib/game/room-types";

export function TeamChatPanel({
  snapshot,
  onSend,
}: {
  snapshot: TeamRoomSnapshot;
  onSend: (message: string) => Promise<void>;
}) {
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-white text-xl mb-4" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 800 }}>
        دردشة الفريق
      </h3>

      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {snapshot.chat.length === 0 ? (
          <p className="text-white/35 text-sm">ابدأوا النقاش هنا</p>
        ) : (
          snapshot.chat.map((entry) => (
            <div key={entry.id} className="rounded-2xl bg-black/20 border border-white/5 px-3 py-2">
              <p className="text-cyan-300 text-sm" style={{ fontWeight: 800 }}>{entry.nickname}</p>
              <p className="text-white/80 mt-1 break-words">{entry.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="اكتب رسالة للفريق"
          className="flex-1 rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/25 outline-none"
          style={{ fontFamily: "Cairo, sans-serif" }}
        />
        <button
          type="button"
          onClick={() => {
            if (!message.trim()) return;
            void onSend(message.trim()).then(() => setMessage(""));
          }}
          className="px-4 py-3 rounded-2xl text-white cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
            fontFamily: "Cairo, sans-serif",
            fontWeight: 800,
          }}
        >
          إرسال
        </button>
      </div>
    </div>
  );
}
