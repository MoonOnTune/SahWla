import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router';
import { GameProvider, useGame } from '../game/GameContext';
import { CategorySetup } from '../game/CategorySetup';
import { TeamSetup } from '../game/TeamSetup';
import { GameBoard } from '../game/GameBoard';
import { QuestionView } from '../game/QuestionView';
import { WalaKalmaView } from '../game/WalaKalmaView';
import { WinnerScreen } from '../game/WinnerScreen';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useCallback } from 'react';
import { ShieldAlert, ShoppingCart, ArrowRight } from 'lucide-react';

function GameScreens() {
  const { screen } = useGame();
  const { activeSession, endGame } = useAuth();
  const navigate = useNavigate();

  // Called when user clicks "لعبة جديدة" on the winner screen
  const handleNewGame = useCallback(() => {
    if (activeSession) endGame(activeSession.id);
    localStorage.removeItem('sah_wala_game_state');
    navigate('/');
  }, [activeSession, endGame, navigate]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="size-full"
      >
        {screen === 'categories' && <CategorySetup />}
        {screen === 'teams' && <TeamSetup />}
        {screen === 'board' && <GameBoard />}
        {screen === 'question' && <QuestionView />}
        {screen === 'walakalma' && <WalaKalmaView />}
        {screen === 'winner' && <WinnerScreen onNewGame={handleNewGame} />}
      </motion.div>
    </AnimatePresence>
  );
}

export function PlayPage() {
  const { activeSession, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // If not logged in, redirect (wait for loading)
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // No active session — show a message
  if (!activeSession) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <ShieldAlert className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-2xl text-white mb-4" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
            لا توجد جلسة لعب نشطة
          </h2>
          <p className="text-white/50 mb-8" style={{ fontFamily: 'Cairo, sans-serif' }}>
            تحتاج لبدء لعبة جديدة من المتجر أولاً
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
                fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '1.2rem',
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              الذهاب للمتجر
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/60 transition-all cursor-pointer"
              style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
            >
              <ArrowRight className="w-4 h-4" />
              رجوع
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <GameProvider initialScreen="categories">
      <div className="size-full" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <GameScreens />
      </div>
    </GameProvider>
  );
}