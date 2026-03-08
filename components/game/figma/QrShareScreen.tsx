import React from "react";
import { motion } from "motion/react";
import { Copy, QrCode, Smartphone } from "lucide-react";
import { useGame } from "./GameContext";
import { useSpecialMode } from "./SpecialModeContext";

function buildTeamLink(roomCode: string, team: "A" | "B") {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/play/team?room=${encodeURIComponent(roomCode)}&team=${team}`;
}

function buildQrUrl(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=0a0a2e&format=svg`;
}

export function QrShareScreen() {
  const { teams, setScreen } = useGame();
  const { roomCode } = useSpecialMode();

  if (!roomCode) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)" }}
    >
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/8 border border-white/10 mb-4">
            <QrCode className="w-5 h-5 text-cyan-300" />
            <span className="text-white/80" style={{ fontWeight: 700 }}>امسح رمز الفريق للانضمام</span>
          </div>
          <h1 className="text-4xl md:text-5xl text-white mb-3" style={{ fontWeight: 900 }}>
            مشاركة الوضع الخاص
          </h1>
          <p className="text-white/50 text-lg">
            رمز الغرفة: <span className="text-cyan-300 font-extrabold tracking-[0.3em]">{roomCode}</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(["A", "B"] as const).map((teamKey, index) => {
            const team = teams[index];
            const teamLink = buildTeamLink(roomCode, teamKey);

            return (
              <motion.div
                key={teamKey}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-[28px] border p-6"
                style={{
                  background: `linear-gradient(135deg, ${team.color}18, rgba(255,255,255,0.04))`,
                  borderColor: `${team.color}45`,
                  boxShadow: `0 18px 50px ${team.color}18`,
                }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ background: team.color, boxShadow: `0 0 18px ${team.color}` }} />
                  <div>
                    <p className="text-white text-2xl" style={{ fontWeight: 800 }}>{team.nameAr}</p>
                    <p className="text-white/40 text-sm">فريق {teamKey}</p>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white p-4 mb-5">
                  <img src={buildQrUrl(teamLink)} alt={`QR ${team.nameAr}`} className="w-full max-w-[260px] mx-auto rounded-2xl" />
                </div>

                <div className="rounded-2xl bg-black/20 border border-white/10 p-4 mb-4">
                  <p className="text-white/40 text-sm mb-2">رابط الانضمام</p>
                  <p className="text-white/80 text-sm break-all leading-7">{teamLink}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(teamLink);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  <span style={{ fontWeight: 700 }}>نسخ الرابط</span>
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-cyan-300" />
            </div>
            <p className="leading-7">
              يمكن لأكثر من لاعب الانضمام لكل فريق، وأول لاعب يدخل يصبح القائد بشكل تلقائي.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScreen("board")}
            className="px-8 py-4 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              boxShadow: "0 0 30px rgba(6, 182, 212, 0.35)",
              fontWeight: 800,
            }}
          >
            المتابعة إلى اللوحة
          </button>
        </motion.div>
      </div>
    </div>
  );
}
