import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from './GameContext';
import { Plus, Minus, Play, ChevronDown, Users, Shuffle, X, UserPlus } from 'lucide-react';

export function TeamSetup() {
  const { setScreen, teams, setTeams } = useGame();
  const [dividerOpen, setDividerOpen] = useState(false);
  const [playerInput, setPlayerInput] = useState('');
  const [distributed, setDistributed] = useState<[string[], string[]] | null>(null);

  const cairoFont = { fontFamily: 'Cairo, sans-serif' };

  const playerNames = useMemo(() =>
    playerInput.split('\n').map(n => n.trim()).filter(Boolean),
    [playerInput]
  );

  const updateTeam = (index: number, updates: Partial<typeof teams[0]>) => {
    setTeams(prev => {
      const next = [...prev] as typeof prev;
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const distributeRandomly = () => {
    if (playerNames.length < 2) return;
    const shuffled = [...playerNames].sort(() => Math.random() - 0.5);
    const team1: string[] = [];
    const team2: string[] = [];
    shuffled.forEach((name, i) => {
      if (i % 2 === 0) team1.push(name);
      else team2.push(name);
    });
    setDistributed([team1, team2]);
    // Update player counts on the teams
    updateTeam(0, { playerCount: team1.length });
    updateTeam(1, { playerCount: team2.length });
  };

  const clearDistribution = () => {
    setDistributed(null);
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col relative"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl text-white mb-10 text-center"
          style={{ ...cairoFont, fontWeight: 800 }}
        >
          إعداد الفرق
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8">
          {teams.map((team, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="rounded-3xl p-6 border-2"
              style={{
                background: `linear-gradient(135deg, ${team.color}15, ${team.color}08)`,
                borderColor: `${team.color}40`,
                boxShadow: `0 0 40px ${team.color}15`,
              }}
            >
              {/* Team header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-4 h-4 rounded-full" style={{ background: team.color, boxShadow: `0 0 12px ${team.color}` }} />
                <span className="text-white/50 text-lg" style={{ ...cairoFont, fontWeight: 600 }}>
                  {team.nameAr}
                </span>
              </div>

              {/* Team name input */}
              <div className="mb-5">
                <label className="text-white/40 text-sm mb-1 block" style={cairoFont}>
                  اسم الفريق
                </label>
                <input
                  type="text"
                  value={team.nameAr}
                  onChange={e => updateTeam(i, { nameAr: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  style={{ ...cairoFont, fontSize: '1.1rem' }}
                  placeholder="أدخل اسم الفريق"
                />
              </div>

              {/* Player count stepper */}
              <div>
                <label className="text-white/40 text-sm mb-2 block" style={cairoFont}>
                  عدد اللاعبين
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => team.playerCount > 1 && updateTeam(i, { playerCount: team.playerCount - 1 })}
                    className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-3xl text-white min-w-[3rem] text-center" style={{ ...cairoFont, fontWeight: 700 }}>
                    {team.playerCount}
                  </span>
                  <button
                    onClick={() => team.playerCount < 10 && updateTeam(i, { playerCount: team.playerCount + 1 })}
                    className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Distributed players list */}
              <AnimatePresence>
                {distributed && distributed[i].length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t" style={{ borderColor: `${team.color}25` }}>
                      <label className="text-white/40 text-sm mb-2 block flex items-center gap-1.5" style={cairoFont}>
                        <Users className="w-3.5 h-3.5" />
                        اللاعبون
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {distributed[i].map((name, j) => (
                          <motion.span
                            key={j}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: j * 0.05 }}
                            className="px-3 py-1.5 rounded-lg text-sm text-white/80"
                            style={{
                              background: `${team.color}20`,
                              border: `1px solid ${team.color}30`,
                              ...cairoFont, fontWeight: 600,
                            }}
                          >
                            {name}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ─── Collapsible Player Divider Section ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full mb-8"
        >
          <button
            onClick={() => setDividerOpen(!dividerOpen)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8b5cf620, #d946ef20)', border: '1px solid #8b5cf630' }}>
                <UserPlus className="w-4.5 h-4.5 text-purple-400" />
              </div>
              <div className="text-right">
                <span className="text-white text-base block" style={{ ...cairoFont, fontWeight: 700 }}>
                  قسم الفريق
                </span>
                <span className="text-white/30 text-xs" style={cairoFont}>
                  أدخل أسماء اللاعبين ووزّعهم عشوائياً
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: dividerOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" />
            </motion.div>
          </button>

          <AnimatePresence>
            {dividerOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6"
                  style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                  <div className="mb-4">
                    <label className="text-white/50 text-sm mb-2 block flex items-center gap-1.5" style={{ ...cairoFont, fontWeight: 600 }}>
                      <Users className="w-3.5 h-3.5" />
                      أسماء اللاعبين
                      <span className="text-white/25 text-xs mr-1">(اسم في كل سطر)</span>
                    </label>
                    <textarea
                      value={playerInput}
                      onChange={e => { setPlayerInput(e.target.value); setDistributed(null); }}
                      placeholder={"أحمد\nسارة\nمحمد\nنورة\nعلي\nفاطمة"}
                      rows={6}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-purple-500/50 transition-colors resize-none"
                      style={{ ...cairoFont, fontWeight: 600, lineHeight: 2 }}
                    />
                    {playerNames.length > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white/30 text-xs" style={cairoFont}>
                          {playerNames.length} لاعب
                        </span>
                        {playerNames.length < 2 && (
                          <span className="text-amber-400/60 text-xs" style={cairoFont}>
                            أدخل لاعبين على الأقل
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={distributeRandomly}
                      disabled={playerNames.length < 2}
                      className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: playerNames.length >= 2
                          ? 'linear-gradient(135deg, #8b5cf6, #d946ef)'
                          : 'rgba(255,255,255,0.1)',
                        boxShadow: playerNames.length >= 2 ? '0 0 25px rgba(139,92,246,0.3)' : 'none',
                        ...cairoFont, fontWeight: 700,
                      }}
                    >
                      <Shuffle className="w-5 h-5" />
                      {distributed ? 'أعد التوزيع' : 'وزّع اللاعبين'}
                    </button>
                    {distributed && (
                      <button
                        onClick={clearDistribution}
                        className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white/50 hover:text-white/70 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                        title="مسح التوزيع"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => setScreen('board')}
          className="flex items-center gap-3 px-10 py-5 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)',
            ...cairoFont,
            fontSize: '1.4rem',
            fontWeight: 700,
          }}
        >
          <Play className="w-6 h-6" />
          <span>ابدأ الجولة</span>
        </motion.button>
      </div>
    </div>
  );
}
