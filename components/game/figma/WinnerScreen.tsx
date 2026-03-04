import { motion } from 'motion/react';
import { useGame } from './GameContext';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface WinnerScreenProps {
  onNewGame?: () => void;
}

export function WinnerScreen({ onNewGame }: WinnerScreenProps) {
  const { teams, resetGame, rematch } = useGame();

  const winner: 0 | 1 | -1 =
    teams[0].score > teams[1].score ? 0 : teams[1].score > teams[0].score ? 1 : -1;
  const winnerTeam = winner === -1 ? null : teams[winner];

  const handleNewGame = () => {
    if (onNewGame) {
      onNewGame();
    } else {
      resetGame();
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)' }}>
      
      {/* Celebration particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: ['#fbbf24', '#06b6d4', '#d946ef', '#10b981', '#f43f5e'][i % 5],
            left: `${Math.random() * 100}%`,
            top: `-5%`,
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            opacity: [1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeIn',
          }}
        />
      ))}

      {/* Glow effects */}
      {winnerTeam && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${winnerTeam.color}, transparent)` }} />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-center relative z-10"
      >
        {/* Trophy */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <Trophy className="w-24 h-24 text-yellow-400" />
        </motion.div>

        {/* Winner announcement */}
        {winner >= 0 ? (
          <>
            <h1 className="text-5xl md:text-7xl text-white mb-4" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
              الفائز!
            </h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-4xl md:text-6xl mb-2" style={{
                fontFamily: 'Cairo, sans-serif', fontWeight: 900,
                color: winnerTeam!.color,
                textShadow: `0 0 40px ${winnerTeam!.color}60`,
              }}>
                {winnerTeam!.nameAr}
              </h2>
            </motion.div>
          </>
        ) : (
          <h1 className="text-5xl md:text-7xl text-white mb-8" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
            تعادل!
          </h1>
        )}

        {/* Scores */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-8 mb-12"
        >
          {teams.map((team, i) => (
            <div key={i} className={`flex flex-col items-center gap-2 p-6 rounded-3xl border-2 ${
              winner === i ? 'ring-2' : ''
            }`} style={{
              background: `linear-gradient(135deg, ${team.color}20, ${team.color}08)`,
              borderColor: `${team.color}40`,
              ...(winner === i ? { ringColor: `${team.color}60`, boxShadow: `0 0 40px ${team.color}30` } : {}),
            }}>
              <div className="w-4 h-4 rounded-full" style={{ background: team.color }} />
              <span className="text-white/70 text-lg" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                {team.nameAr}
              </span>
              <span className="text-5xl text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                {team.score}
              </span>
              {winner === i && (
                <span className="text-sm px-3 py-1 rounded-full" style={{
                  background: `${team.color}30`, color: team.colorLight,
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                }}>
                  🏆 الفائز
                </span>
              )}
            </div>
          ))}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <button
            onClick={handleNewGame}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '1.2rem',
              fontWeight: 700,
            }}
          >
            <Home className="w-5 h-5" />
            لعبة جديدة
          </button>
          <button
            onClick={rematch}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              fontFamily: 'Cairo, sans-serif',
              fontSize: '1.2rem',
              fontWeight: 700,
            }}
          >
            <RotateCcw className="w-5 h-5" />
            إعادة نفس الفئات
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)' }} />
    </div>
  );
}
