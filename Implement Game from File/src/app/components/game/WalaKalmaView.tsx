import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from './GameContext';
import { Timer } from './Timer';
import { ArrowLeft, QrCode, SkipForward, Play } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

type WalaKalmaPhase = 'qr' | 'timerA' | 'timerB' | 'choose';

export function WalaKalmaView() {
  const {
    categories, teams, currentTurn, selectedQuestion,
    setScreen, awardPoints, markTileUsed, setCurrentTurn,
    setQuestionPhase,
  } = useGame();

  const [phase, setPhase] = useState<WalaKalmaPhase>('qr');
  const [timerAExpired, setTimerAExpired] = useState(false);
  const [timerBExpired, setTimerBExpired] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  if (!selectedQuestion) return null;
  const { catIndex, qIndex } = selectedQuestion;
  const category = categories[catIndex];
  const question = category.questions[qIndex];

  // The movie name is stored in question.question
  const movieName = question.question;

  // Build a reveal URL: the app's origin + hash with URI-encoded movie name
  const revealUrl = `${window.location.origin}${window.location.pathname}#/reveal/${encodeURIComponent(movieName)}`;

  // Generate QR code image using a public API, pointing to the reveal URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(revealUrl)}&bgcolor=ffffff&color=0a0a2e&format=svg`;

  const handleTimerAExpired = useCallback(() => {
    setTimerAExpired(true);
  }, []);

  const handleTimerBExpired = useCallback(() => {
    setTimerBExpired(true);
  }, []);

  const startTeamATimer = () => {
    setPhase('timerA');
  };

  const skipToTeamB = () => {
    setPhase('timerB');
    setTimerAExpired(false);
  };

  const startTeamBTimer = () => {
    setPhase('timerB');
    setTimerAExpired(false);
  };

  const goToChooseWinner = () => {
    setPhase('choose');
  };

  const chooseWinnerAndReturn = (teamIndex: number | -1) => {
    const key = `${catIndex}-${qIndex}`;
    if (teamIndex === 0) awardPoints(0, question.value);
    else if (teamIndex === 1) awardPoints(1, question.value);

    markTileUsed(key);
    setCurrentTurn(currentTurn === 0 ? 1 : 0);

    // Reset and go back to board
    setTimerAExpired(false);
    setTimerBExpired(false);
    setQuestionPhase('timerA');
    setScreen('board');
  };

  const handleBack = () => {
    setShowBackConfirm(true);
  };

  const confirmBack = () => {
    setShowBackConfirm(false);
    setTimerAExpired(false);
    setTimerBExpired(false);
    setQuestionPhase('timerA');
    setScreen('board');
  };

  // Determine which team is "active" for timer display
  const activeTeamIndex = phase === 'timerA' ? currentTurn : (currentTurn === 0 ? 1 : 0);
  const otherTeamIndex = currentTurn === 0 ? 1 : 0;

  return (
    <div dir="rtl" className="min-h-screen flex flex-col relative"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all cursor-pointer"
          style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
        >
          <ArrowLeft className="w-5 h-5" />
          عودة للوحة
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: teams[0].color }} />
            <span className="text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
              {teams[0].score}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: teams[1].color }} />
            <span className="text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
              {teams[1].score}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full gap-6">

        {/* Category + value badge */}
        <div className="flex items-center gap-3">
          <span className="px-4 py-1 rounded-full bg-white/10 text-white/60" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
            {category.name}
          </span>
          <span className="px-4 py-1 rounded-full text-white" style={{
            fontFamily: 'Cairo, sans-serif', fontWeight: 700,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          }}>
            {question.value}
          </span>
        </div>

        {/* QR Code Phase */}
        <AnimatePresence mode="wait">
          {phase === 'qr' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <QrCode className="w-8 h-8" />
                <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
                  امسح الرمز لمعرفة الفيلم
                </h2>
              </div>

              <p className="text-white/50 text-center text-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
                لاعب من {teams[currentTurn].nameAr} يمسح الرمز ويمثّل الفيلم لفريقه بدون كلام
              </p>

              {/* QR Code */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-3xl border border-white/20"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))' }}
              >
                <div className="bg-white p-4 rounded-2xl">
                  <ImageWithFallback
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-full"
                  />
                </div>
              </motion.div>

              <p className="text-white/30 text-sm text-center" style={{ fontFamily: 'Cairo, sans-serif' }}>
                امسح الرمز بكاميرا الجوال لرؤية اسم الفيلم
              </p>

              {/* Start button */}
              <button
                onClick={startTeamATimer}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer mt-2"
                style={{
                  background: `linear-gradient(135deg, ${teams[currentTurn].color}, ${teams[currentTurn].color}cc)`,
                  boxShadow: `0 0 30px ${teams[currentTurn].color}40`,
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                <Play className="w-6 h-6" />
                ابدأ وقت {teams[currentTurn].nameAr}
              </button>
            </motion.div>
          )}

          {/* Timer A Phase */}
          {phase === 'timerA' && (
            <motion.div
              key="timerA"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Timer
                key="wk-timerA"
                duration={120}
                teamLabel={`وقت ${teams[currentTurn].nameAr}`}
                teamColor={teams[currentTurn].color}
                onExpired={handleTimerAExpired}
                running={!timerAExpired}
              />

              {!timerAExpired && (
                <div className="flex items-center gap-3 flex-wrap justify-center mt-4">
                  <button
                    onClick={skipToTeamB}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${teams[otherTeamIndex].color}, ${teams[otherTeamIndex].color}cc)`,
                      boxShadow: `0 0 20px ${teams[otherTeamIndex].color}30`,
                      fontFamily: 'Cairo, sans-serif',
                      fontWeight: 700,
                    }}
                  >
                    <SkipForward className="w-5 h-5" />
                    تخطي إلى {teams[otherTeamIndex].nameAr}
                  </button>
                  <button
                    onClick={goToChooseWinner}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all cursor-pointer active:scale-95"
                    style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
                  >
                    اختيار الفائز
                  </button>
                </div>
              )}

              <AnimatePresence>
                {timerAExpired && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <p className="text-red-400 text-xl" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                      انتهى الوقت!
                    </p>
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                      <button
                        onClick={startTeamBTimer}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                          background: `linear-gradient(135deg, ${teams[otherTeamIndex].color}, ${teams[otherTeamIndex].color}cc)`,
                          boxShadow: `0 0 20px ${teams[otherTeamIndex].color}40`,
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        <SkipForward className="w-5 h-5" />
                        ابدأ وقت {teams[otherTeamIndex].nameAr}
                      </button>
                      <button
                        onClick={goToChooseWinner}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                        style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                      >
                        اختيار الفائز
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Timer B Phase */}
          {phase === 'timerB' && (
            <motion.div
              key="timerB"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Timer
                key="wk-timerB"
                duration={120}
                teamLabel={`وقت ${teams[otherTeamIndex].nameAr}`}
                teamColor={teams[otherTeamIndex].color}
                onExpired={handleTimerBExpired}
                running={!timerBExpired}
              />

              {!timerBExpired && (
                <div className="flex items-center gap-3 flex-wrap justify-center mt-4">
                  <button
                    onClick={goToChooseWinner}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all cursor-pointer active:scale-95"
                    style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
                  >
                    اختيار الفائز
                  </button>
                </div>
              )}

              <AnimatePresence>
                {timerBExpired && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <p className="text-red-400 text-xl" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                      انتهى الوقت!
                    </p>
                    <button
                      onClick={goToChooseWinner}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        boxShadow: '0 0 20px rgba(251,191,36,0.3)',
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 700,
                      }}
                    >
                      اختيار الفائز
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Choose Winner Phase */}
          {phase === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {/* Show the movie name */}
              <div className="p-6 md:p-8 rounded-3xl border border-amber-500/30 text-center mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))' }}>
                <p className="text-white/50 text-sm mb-3" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                  🎬 اسم الفيلم
                </p>
                <h3 className="text-3xl md:text-4xl text-amber-300"
                  style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
                  {movieName}
                </h3>
              </div>

              <div className="flex flex-col items-center gap-4">
                <p className="text-white/50" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                  أي فريق عر�� اسم الفيلم؟
                </p>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => chooseWinnerAndReturn(0)}
                    className="px-6 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${teams[0].color}, ${teams[0].color}cc)`,
                      boxShadow: `0 0 20px ${teams[0].color}30`,
                      fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                    }}
                  >
                    {teams[0].nameAr} صحيح
                  </button>
                  <button
                    onClick={() => chooseWinnerAndReturn(1)}
                    className="px-6 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${teams[1].color}, ${teams[1].color}cc)`,
                      boxShadow: `0 0 20px ${teams[1].color}30`,
                      fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                    }}
                  >
                    {teams[1].nameAr} صحيح
                  </button>
                  <button
                    onClick={() => chooseWinnerAndReturn(-1)}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 transition-all cursor-pointer active:scale-95"
                    style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                  >
                    لا أحد
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Back confirmation modal */}
      <AnimatePresence>
        {showBackConfirm && (
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
              className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
            >
              <p className="text-xl text-white mb-6" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                هل تريد العودة للوحة؟
              </p>
              <p className="text-white/50 mb-8" style={{ fontFamily: 'Cairo, sans-serif' }}>
                سيتم فقدان تقدم هذا السؤال
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={confirmBack}
                  className="px-6 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all cursor-pointer active:scale-95"
                  style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                >
                  نعم، عودة
                </button>
                <button
                  onClick={() => setShowBackConfirm(false)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                  style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}