import { motion } from 'motion/react';
import { useGame } from './GameContext';
import { Sparkles, Play } from 'lucide-react';

export function WelcomeScreen() {
  const { setScreen } = useGame();

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)' }}>
      
      {/* Decorative orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 relative z-10"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="inline-block mb-6"
        >
          <Sparkles className="w-16 h-16 text-yellow-400" />
        </motion.div>
        
        <h1 className="text-6xl md:text-8xl text-white leading-tight" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
          صح ولا؟
        </h1>
        <p className="text-xl md:text-2xl text-white/60 mt-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
          لعبة الأسئلة والمعرفة
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="flex flex-col gap-4 relative z-10"
      >
        <button
          onClick={() => setScreen('categories')}
          className="group flex items-center gap-3 px-10 py-5 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.4), 0 10px 40px rgba(0,0,0,0.3)',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 700,
          }}
        >
          <Play className="w-7 h-7" />
          <span>ابدأ اللعبة</span>
        </button>
      </motion.div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)' }} />
    </div>
  );
}