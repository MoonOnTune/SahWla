import React from "react";
import type { TeamRoomSnapshot } from "@/lib/game/room-types";

export function TeamBoardView({
  snapshot,
  canSuggest,
  onSuggest,
}: {
  snapshot: TeamRoomSnapshot;
  canSuggest: boolean;
  onSuggest: (input: { categoryIndex: number; questionIndex: number; pickId: string }) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xl" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 800 }}>
          لوحة الأسئلة
        </h3>
        <span className="text-white/40 text-sm">الجولة {snapshot.currentRound}</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-3 min-w-max"
          style={{ gridTemplateColumns: `repeat(${snapshot.board.length}, minmax(104px, 1fr))` }}
          aria-label="لوحة الفريق"
        >
          {snapshot.board.map((category, categoryIndex) => (
            <div key={category.name} className="flex flex-col gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-4 text-center min-h-[72px] flex items-center justify-center">
                <p className="text-white text-sm leading-6" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 800 }}>
                  {category.name}
                </p>
              </div>

              {category.tiles.map((tile, questionIndex) => (
                <button
                  key={tile.pickId}
                  type="button"
                  aria-label={canSuggest ? `اقتراح السؤال ${tile.value}` : undefined}
                  disabled={!canSuggest || tile.used}
                  onClick={() => onSuggest({ categoryIndex, questionIndex, pickId: tile.pickId })}
                  className={`rounded-2xl border px-3 py-4 text-center min-h-[68px] transition-all ${
                    tile.used
                      ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                      : canSuggest
                        ? "bg-cyan-500/10 border-cyan-400/20 text-white hover:scale-[1.02] cursor-pointer"
                        : "bg-white/5 border-white/10 text-white/70 cursor-default"
                  }`}
                >
                  <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 800 }}>{tile.used ? "✓" : tile.value}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
