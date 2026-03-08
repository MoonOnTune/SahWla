import React from "react";
import type { TeamRoomSnapshot } from "@/lib/game/room-types";

const ABILITY_LABELS: Record<string, string> = {
  STEAL: "سرقة",
  DOUBLE_POINTS: "مضاعفة النقاط",
  SHIELD: "درع",
  BONUS_PICK: "اختيار إضافي",
  POINT_THEFT: "سرقة النقاط",
};

export function AbilityPanel({
  snapshot,
  onUseAbility,
}: {
  snapshot: TeamRoomSnapshot;
  onUseAbility: (abilityType: string) => Promise<void>;
}) {
  const ownTeam = snapshot.teams.find((team) => team.key === snapshot.self.team);
  const isCaptain = snapshot.self.role === "CAPTAIN";
  const abilities = ownTeam?.abilities ?? [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-white text-xl mb-4" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 800 }}>
        القدرات
      </h3>

      <div className="space-y-3">
        {abilities.length === 0 ? (
          <p className="text-white/35 text-sm">لا توجد قدرات متاحة حالياً</p>
        ) : (
          abilities.map((ability) => (
            <div key={ability.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-white" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 800 }}>
                  {ABILITY_LABELS[ability.type] ?? ability.type}
                </p>
                <p className="text-white/35 text-xs mt-1">متاحة من الجولة {ability.unlockedRound}</p>
              </div>
              {isCaptain ? (
                <button
                  type="button"
                  aria-label={`استخدم ${ability.type}`}
                  onClick={() => {
                    void onUseAbility(ability.type);
                  }}
                  className="px-3 py-2 rounded-2xl text-white cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #d946ef, #8b5cf6)",
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 800,
                  }}
                >
                  تفعيل
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
