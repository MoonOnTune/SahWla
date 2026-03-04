import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router';
import { Coins, Play, Loader2, AlertTriangle, X, ShoppingCart } from 'lucide-react';

export function HomePage() {
  const { creditBalance, startGame, activeSession, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [user, isLoading, navigate]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const handleConfirmStart = async () => {
    setStarting(true);
    setStartError('');
    const result = await startGame();
    setStarting(false);
    if (result.success) {
      localStorage.removeItem('sah_wala_game_state');
      setShowConfirm(false);
      navigate('/play');
    } else {
      setStartError(result.error || 'حدث خطأ');
    }
  };

  const cairoFont = { fontFamily: 'Cairo, sans-serif' };

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)' }}>

      {/* Decorative orbs */}
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl text-white mb-2" style={{ ...cairoFont, fontWeight: 900 }}>
            صح ولا؟
          </h1>
          <p className="text-white/50" style={cairoFont}>
            جاهز تلعب؟ ابدأ لعبة جديدة!
          </p>
        </motion.div>

        {/* Credit Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 text-center"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Coins className="w-8 h-8 text-yellow-400" />
            <span className="text-white/60 text-lg" style={{ ...cairoFont, fontWeight: 600 }}>
              رصيدك الحالي
            </span>
          </div>
          <motion.div
            key={creditBalance}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="mb-2"
          >
            <span className="text-7xl text-white" style={{
              ...cairoFont, fontWeight: 900,
              textShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
            }}>
              {creditBalance}
            </span>
          </motion.div>
          <p className="text-white/40" style={cairoFont}>
            {creditBalance === 1 ? 'لعبة متبقية' : creditBalance === 0 ? 'لا يوجد رصيد' : 'ألعاب متبقية'}
          </p>

          {creditBalance === 0 && (
            <button
              onClick={() => navigate('/shop')}
              className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white/70 bg-white/10 hover:bg-white/15 transition-all cursor-pointer active:scale-95"
              style={{ ...cairoFont, fontWeight: 600 }}
            >
              <ShoppingCart className="w-4 h-4" />
              اشترِ رصيداً من المتجر
            </button>
          )}
        </motion.div>

        {/* Start Game Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          {activeSession ? (
            <button
              onClick={() => navigate('/play')}
              className="flex items-center gap-3 mx-auto px-12 py-5 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.4), 0 10px 40px rgba(0,0,0,0.3)',
                ...cairoFont, fontSize: '1.4rem', fontWeight: 700,
              }}
            >
              <Play className="w-7 h-7" />
              متابعة اللعبة
            </button>
          ) : (
            <>
              <button
                onClick={() => { setShowConfirm(true); setStartError(''); }}
                disabled={creditBalance < 1}
                className="flex items-center gap-3 mx-auto px-12 py-5 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: creditBalance >= 1
                    ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)'
                    : 'rgba(255,255,255,0.1)',
                  boxShadow: creditBalance >= 1
                    ? '0 0 30px rgba(6, 182, 212, 0.4), 0 10px 40px rgba(0,0,0,0.3)'
                    : 'none',
                  ...cairoFont, fontSize: '1.4rem', fontWeight: 700,
                }}
              >
                <Play className="w-7 h-7" />
                ابدأ لعبة جديدة
              </button>
              <p className="text-white/30 text-sm mt-3" style={cairoFont}>
                يتطلب رصيد لعبة واحدة على الأقل
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              dir="rtl"
              className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
              style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl text-white" style={{ ...cairoFont, fontWeight: 800 }}>
                    بدء لعبة جديدة
                  </h2>
                </div>
                <button
                  onClick={() => { setShowConfirm(false); setStartError(''); }}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center cursor-pointer active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white/80 mb-2" style={{ ...cairoFont, fontWeight: 600 }}>
                      سيتم خصم لعبة واحدة من رصيدك
                    </p>
                    <p className="text-white/40 text-sm" style={cairoFont}>
                      رصيدك الحالي: <span className="text-cyan-400" style={{ fontWeight: 700 }}>{creditBalance}</span> — بعد الخصم: <span className="text-cyan-400" style={{ fontWeight: 700 }}>{creditBalance - 1}</span>
                    </p>
                  </div>
                </div>
              </div>

              {startError && (
                <p className="text-red-400 text-sm text-center mb-4" style={cairoFont}>
                  {startError}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleConfirmStart}
                  disabled={starting}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                    ...cairoFont, fontWeight: 700, fontSize: '1.1rem',
                  }}
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري البدء...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      تأكيد البدء
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setStartError(''); }}
                  disabled={starting}
                  className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/60 transition-all cursor-pointer active:scale-95"
                  style={{ ...cairoFont, fontWeight: 700 }}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)' }} />
    </div>
  );
}
