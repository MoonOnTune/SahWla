import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from './GameContext';
import { useSpecialMode } from './SpecialModeContext';
import { Timer } from './Timer';
import { ArrowLeft, Eye, SkipForward } from 'lucide-react';

export function QuestionView() {
  const {
    gameMode, categories, teams, setTeams, currentTurn, setCurrentTurn, selectedQuestion,
    questionPhase, setQuestionPhase, setScreen, awardPoints,
    markTileUsed,
  } = useGame();
  const { roomCode, hostSnapshot, setHostSnapshot, setPendingSuggestedPickId } = useSpecialMode();
  const dir = 'rtl';

  const [showAnswer, setShowAnswer] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [timerAExpired, setTimerAExpired] = useState(false);
  const [timerBExpired, setTimerBExpired] = useState(false);

  if (!selectedQuestion) return null;
  const { catIndex, qIndex } = selectedQuestion;
  const category = categories[catIndex];
  const question = category.questions[qIndex];
  const isSpecialMode = gameMode === 'SPECIAL' && Boolean(hostSnapshot);

  const displayedTeams = useMemo(() => {
    if (!hostSnapshot) {
      return teams;
    }

    return (['A', 'B'] as const).map((teamKey, index) => {
      const snapshotTeam = hostSnapshot.teams.find((team) => team.key === teamKey);
      const baseTeam = teams[index];
      if (!snapshotTeam) return baseTeam;
      return {
        ...baseTeam,
        nameAr: snapshotTeam.name,
        score: snapshotTeam.score,
      };
    }) as typeof teams;
  }, [hostSnapshot, teams]);

  const displayedCurrentTurn = hostSnapshot ? (hostSnapshot.currentTurnTeam === 'B' ? 1 : 0) : currentTurn;

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
    if (isSpecialMode && roomCode) {
      void (async () => {
        const response = await fetch(`/api/game/rooms/${roomCode}/resolve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomCode,
            winningTeam: teamIndex === -1 ? null : teamIndex === 0 ? 'A' : 'B',
          }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload) {
          return;
        }

        setHostSnapshot(payload);
        setPendingSuggestedPickId(payload.pendingSuggestedPickId ?? null);
        setCurrentTurn(payload.currentTurnTeam === 'B' ? 1 : 0);
        setTeams((previous) =>
          previous.map((team, index) => {
            const snapshotTeam = payload.teams.find((entry: { key: string }) => entry.key === (index === 0 ? 'A' : 'B'));
            if (!snapshotTeam) return team;
            return {
              ...team,
              nameAr: snapshotTeam.name,
              score: snapshotTeam.score,
            };
          }) as typeof previous,
        );

        setShowAnswer(false);
        setTimerAExpired(false);
        setTimerBExpired(false);
        setQuestionPhase('timerA');
        setScreen(payload.phase === 'WINNER' ? 'winner' : 'board');
      })();
      return;
    }

    const key = `${catIndex}-${qIndex}`;

    // Award base points to selected team
    if (teamIndex === 0) {
      awardPoints(0, question.value);
    } else if (teamIndex === 1) {
      awardPoints(1, question.value);
    }

    markTileUsed(key, question.pickId);
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
    if (isSpecialMode) {
      return;
    }
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
  const activeTimerTeam = questionPhase === 'timerA' ? displayedCurrentTurn : displayedCurrentTurn === 0 ? 1 : 0;
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
          disabled={isSpecialMode}
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
              {displayedTeams[0].score}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: teams[1].color }} />
            <span className="text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
              {displayedTeams[1].score}
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
              teamLabel={`وقت ${displayedTeams[activeTimerTeam].nameAr}`}
              teamColor={displayedTeams[activeTimerTeam].color}
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
                          boxShadow: `0 0 20px ${displayedTeams[1].color}30`,
                      fontFamily: 'Cairo, sans-serif',
                      fontWeight: 700,
                    }}
                  >
                    <SkipForward className="w-5 h-5" />
                    تخطي إلى {displayedTeams[1].nameAr}
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
                          boxShadow: `0 0 20px ${displayedTeams[1].color}40`,
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        <SkipForward className="w-5 h-5" />
                        ابدأ وقت {displayedTeams[1].nameAr}
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
                      boxShadow: `0 0 20px ${displayedTeams[0].color}30`,
                      fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                    }}
                  >
                    {displayedTeams[0].nameAr} صحيح
                  </button>
                  <button
                    onClick={() => chooseWinnerAndReturn(1)}
                    className="px-6 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${teams[1].color}, ${teams[1].color}cc)`,
                      boxShadow: `0 0 20px ${displayedTeams[1].color}30`,
                      fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                    }}
                  >
                    {displayedTeams[1].nameAr} صحيح
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
