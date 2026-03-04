import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from './GameContext';
import { Timer } from './Timer';
import { ArrowLeft, Eye, SkipForward } from 'lucide-react';

export function QuestionView() {
  const {
    categories, teams, currentTurn, selectedQuestion,
    questionPhase, setQuestionPhase, setScreen, awardPoints,
    markTileUsed, setCurrentTurn,
  } = useGame();
  const dir = 'rtl';

  const [showAnswer, setShowAnswer] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [timerAExpired, setTimerAExpired] = useState(false);
  const [timerBExpired, setTimerBExpired] = useState(false);

  if (!selectedQuestion) return null;
  const { catIndex, qIndex } = selectedQuestion;
  const category = categories[catIndex];
  const question = category.questions[qIndex];

  const handleTimerAExpired = useCallback(() => {
    setTimerAExpired(true);
  }, []);

  const handleTimerBExpired = useCallback(() => {
    setTimerBExpired(true);
  }, []);

  const startOtherTeamTimer = () => {
    setQuestionPhase('timerB');
    setTimerAExpired(false);
  };

  const skipToOtherTeam = () => {
    if (questionPhase === 'timerA') {
      setQuestionPhase('timerB');
      setTimerAExpired(false);
    }
  };

  const goToAnswer = () => {
    setShowAnswer(true);
    setQuestionPhase('answer');
  };

  const chooseWinnerAndReturn = (teamIndex: number | -1) => {
    const key = `${catIndex}-${qIndex}`;

    // Award base points to selected team
    if (teamIndex === 0) {
      awardPoints(0, question.value);
    } else if (teamIndex === 1) {
      awardPoints(1, question.value);
    }

    markTileUsed(key);
    // Alternate turns
    setCurrentTurn(currentTurn === 0 ? 1 : 0);

    // Reset and go back to board
    setShowAnswer(false);
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
    setShowAnswer(false);
    setTimerAExpired(false);
    setTimerBExpired(false);
    setQuestionPhase('timerA');
    setScreen('board');
  };

  // Determine active team for timer
  const activeTimerTeam = questionPhase === 'timerA' ? 0 : 1;
  const timerDuration = questionPhase === 'timerA' ? 60 : 30;
  const isTimerRunning = (questionPhase === 'timerA' && !timerAExpired) || (questionPhase === 'timerB' && !timerBExpired);
  const currentTimerExpired = questionPhase === 'timerA' ? timerAExpired : timerBExpired;

  return (
    <div dir={dir} className="min-h-screen flex flex-col relative"
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full gap-8">
        
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

        {/* Question panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full p-8 md:p-12 rounded-3xl border border-white/10 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' }}
        >
          <p dir="rtl" className="text-3xl md:text-4xl lg:text-5xl text-white leading-relaxed"
            style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
            {question.question}
          </p>
        </motion.div>

        {/* Timer section */}
        {(questionPhase === 'timerA' || questionPhase === 'timerB') && (
          <div className="flex flex-col items-center gap-4">
            <Timer
              key={questionPhase}
              duration={timerDuration}
              teamLabel={`وقت ${teams[activeTimerTeam].nameAr}`}
              teamColor={teams[activeTimerTeam].color}
              onExpired={questionPhase === 'timerA' ? handleTimerAExpired : handleTimerBExpired}
              running={isTimerRunning}
            />

            {/* Buttons while timer is running */}
            {!currentTimerExpired && (
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {questionPhase === 'timerA' && (
                  <button
                    onClick={skipToOtherTeam}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${teams[1].color}, ${teams[1].color}cc)`,
                      boxShadow: `0 0 20px ${teams[1].color}30`,
                      fontFamily: 'Cairo, sans-serif',
                      fontWeight: 700,
                    }}
                  >
                    <SkipForward className="w-5 h-5" />
                    تخطي إلى {teams[1].nameAr}
                  </button>
                )}
                <button
                  onClick={goToAnswer}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all cursor-pointer active:scale-95"
                  style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
                >
                  <Eye className="w-5 h-5" />
                  إظهار الإجابة
                </button>
              </div>
            )}

            {/* Timer expired message */}
            <AnimatePresence>
              {currentTimerExpired && (
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
                    {questionPhase === 'timerA' && (
                      <button
                        onClick={startOtherTeamTimer}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                          background: `linear-gradient(135deg, ${teams[1].color}, ${teams[1].color}cc)`,
                          boxShadow: `0 0 20px ${teams[1].color}40`,
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        <SkipForward className="w-5 h-5" />
                        ابدأ وقت {teams[1].nameAr}
                      </button>
                    )}
                    <button
                      onClick={goToAnswer}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                      style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                    >
                      <Eye className="w-5 h-5" />
                      إظهار الإجابة
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Answer panel + choose winner */}
        <AnimatePresence>
          {questionPhase === 'answer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="p-6 md:p-8 rounded-3xl border border-emerald-500/30 text-center mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}>
                <p className="text-white/50 text-sm mb-2" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                  الإجابة
                </p>
                <p dir="rtl" className="text-3xl md:text-4xl text-emerald-300"
                  style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
                  {question.answer}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <p className="text-white/50" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                  من أجاب بشكل صحيح؟
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
              dir={dir}
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