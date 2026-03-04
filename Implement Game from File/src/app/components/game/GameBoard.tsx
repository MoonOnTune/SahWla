import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from './GameContext';
import { Minus, Plus, Pencil, X } from 'lucide-react';
import { getCategoryIcon } from './CategoryIcons';

export function GameBoard() {
  const { categories, teams, currentTurn, usedTiles, setSelectedQuestion, setScreen, setQuestionPhase, awardPoints } = useGame();
  const dir = 'rtl';
  const [showScoreEditor, setShowScoreEditor] = useState(false);
  const [adjustA, setAdjustA] = useState(0);
  const [adjustB, setAdjustB] = useState(0);

  const totalTiles = categories.length * 6;
  const usedCount = usedTiles.size;

  const handleTileClick = (catIndex: number, qIndex: number) => {
    const key = `${catIndex}-${qIndex}`;
    if (usedTiles.has(key)) return;
    setSelectedQuestion({ catIndex, qIndex });
    setQuestionPhase('timerA');
    // Route to walakalma screen if it's that category type
    const cat = categories[catIndex];
    if (cat.type === 'walakalma') {
      setScreen('walakalma');
    } else {
      setScreen('question');
    }
  };

  // Check if all tiles are used
  if (usedCount >= totalTiles) {
    setTimeout(() => setScreen('winner'), 500);
  }

  const applyScoreAdjustments = () => {
    if (adjustA !== 0) awardPoints(0, adjustA);
    if (adjustB !== 0) awardPoints(1, adjustB);
    setAdjustA(0);
    setAdjustB(0);
    setShowScoreEditor(false);
  };

  const valueColors: Record<number, string> = {
    200: 'from-emerald-500/30 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400/60',
    400: 'from-blue-500/30 to-blue-600/10 border-blue-500/30 hover:border-blue-400/60',
    600: 'from-purple-500/30 to-purple-600/10 border-purple-500/30 hover:border-purple-400/60',
  };

  return (
    <div dir={dir} className="min-h-screen flex flex-col relative"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #0f0a2e 50%, #0a0a2e 100%)' }}>
      
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 relative z-10">
        {/* Team A score */}
        <motion.div
          animate={currentTurn === 0 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 ${
            currentTurn === 0 ? 'ring-2 ring-cyan-400/50' : ''
          }`}
          style={{
            background: `linear-gradient(135deg, ${teams[0].color}20, ${teams[0].color}08)`,
            borderColor: currentTurn === 0 ? teams[0].color : `${teams[0].color}30`,
            boxShadow: currentTurn === 0 ? `0 0 20px ${teams[0].color}30` : 'none',
          }}
        >
          <div className="w-3 h-3 rounded-full" style={{ background: teams[0].color, boxShadow: `0 0 8px ${teams[0].color}` }} />
          <span className="text-white/70" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
            {teams[0].nameAr}
          </span>
          <span className="text-3xl text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {teams[0].score}
          </span>
        </motion.div>

        {/* Center - turn indicator + score edit */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setShowScoreEditor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer active:scale-95"
            style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
            title="تعديل النقاط"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-sm">تعديل النقاط</span>
          </button>
          <span className="text-white/40 text-sm mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            دور: {teams[currentTurn].nameAr}
          </span>
        </div>

        {/* Team B score */}
        <motion.div
          animate={currentTurn === 1 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 ${
            currentTurn === 1 ? 'ring-2 ring-fuchsia-400/50' : ''
          }`}
          style={{
            background: `linear-gradient(135deg, ${teams[1].color}20, ${teams[1].color}08)`,
            borderColor: currentTurn === 1 ? teams[1].color : `${teams[1].color}30`,
            boxShadow: currentTurn === 1 ? `0 0 20px ${teams[1].color}30` : 'none',
          }}
        >
          <span className="text-3xl text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {teams[1].score}
          </span>
          <span className="text-white/70" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
            {teams[1].nameAr}
          </span>
          <div className="w-3 h-3 rounded-full" style={{ background: teams[1].color, boxShadow: `0 0 8px ${teams[1].color}` }} />
        </motion.div>
      </div>

      {/* Game board grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(140px, 1fr))` }}>
          {/* Category headers */}
          {categories.map((cat, ci) => (
            <div key={`h-${ci}`} className={`text-center py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 ${
              cat.type === 'walakalma' 
                ? 'bg-amber-500/10 border-amber-500/20' 
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="opacity-70">
                {getCategoryIcon(cat.name, 'w-7 h-7')}
              </div>
              <span className={`text-lg ${cat.type === 'walakalma' ? 'text-amber-300' : 'text-white'}`} style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {cat.name}
              </span>
            </div>
          ))}

          {/* Question tiles - grouped by value: 200, 200, 400, 400, 600, 600 */}
          {[0, 1, 2, 3, 4, 5].map(qIndex => (
            categories.map((cat, ci) => {
              const key = `${ci}-${qIndex}`;
              const isUsed = usedTiles.has(key);
              const q = cat.questions[qIndex];
              const colorClass = valueColors[q.value] || valueColors[200];

              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (ci + qIndex * categories.length) * 0.02 }}
                  onClick={() => handleTileClick(ci, qIndex)}
                  disabled={isUsed}
                  className={`relative py-5 px-3 rounded-xl border transition-all cursor-pointer ${
                    isUsed
                      ? 'bg-white/3 border-white/5 opacity-30 cursor-not-allowed'
                      : `bg-gradient-to-b ${colorClass} hover:scale-105 active:scale-95`
                  }`}
                  style={!isUsed ? { boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } : {}}
                >
                  <span className={`text-2xl ${isUsed ? 'text-white/20' : 'text-white'}`}
                    style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
                    {isUsed ? '✓' : q.value}
                  </span>
                </motion.button>
              );
            })
          ))}
        </div>
      </div>

      {/* Score Editor Modal */}
      <AnimatePresence>
        {showScoreEditor && (
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
              className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
                  تعديل النقاط
                </h2>
                <button
                  onClick={() => { setShowScoreEditor(false); setAdjustA(0); setAdjustB(0); }}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center cursor-pointer active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Team A */}
                <div className="p-5 rounded-2xl border" style={{
                  background: `linear-gradient(135deg, ${teams[0].color}15, ${teams[0].color}05)`,
                  borderColor: `${teams[0].color}30`,
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: teams[0].color }} />
                      <span className="text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                        {teams[0].nameAr}
                      </span>
                    </div>
                    <span className="text-white/50" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                      الحالي: {teams[0].score}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setAdjustA(prev => prev - 100)}
                      className="w-12 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center cursor-pointer active:scale-90"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className={`text-2xl min-w-[5rem] text-center ${adjustA > 0 ? 'text-emerald-400' : adjustA < 0 ? 'text-red-400' : 'text-white/40'}`}
                      style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
                      {adjustA > 0 ? `+${adjustA}` : adjustA}
                    </span>
                    <button
                      onClick={() => setAdjustA(prev => prev + 100)}
                      className="w-12 h-12 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center cursor-pointer active:scale-90"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {adjustA !== 0 && (
                    <p className="text-center mt-2 text-sm text-white/40" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      الجديد: {teams[0].score + adjustA}
                    </p>
                  )}
                </div>

                {/* Team B */}
                <div className="p-5 rounded-2xl border" style={{
                  background: `linear-gradient(135deg, ${teams[1].color}15, ${teams[1].color}05)`,
                  borderColor: `${teams[1].color}30`,
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: teams[1].color }} />
                      <span className="text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                        {teams[1].nameAr}
                      </span>
                    </div>
                    <span className="text-white/50" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                      الحالي: {teams[1].score}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setAdjustB(prev => prev - 100)}
                      className="w-12 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center cursor-pointer active:scale-90"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className={`text-2xl min-w-[5rem] text-center ${adjustB > 0 ? 'text-emerald-400' : adjustB < 0 ? 'text-red-400' : 'text-white/40'}`}
                      style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
                      {adjustB > 0 ? `+${adjustB}` : adjustB}
                    </span>
                    <button
                      onClick={() => setAdjustB(prev => prev + 100)}
                      className="w-12 h-12 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center cursor-pointer active:scale-90"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {adjustB !== 0 && (
                    <p className="text-center mt-2 text-sm text-white/40" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      الجديد: {teams[1].score + adjustB}
                    </p>
                  )}
                </div>
              </div>

              {/* Apply button */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={applyScoreAdjustments}
                  disabled={adjustA === 0 && adjustB === 0}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white transition-all cursor-pointer active:scale-95 ${
                    adjustA === 0 && adjustB === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                  style={{
                    background: adjustA !== 0 || adjustB !== 0
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: adjustA !== 0 || adjustB !== 0 ? '0 0 20px rgba(16,185,129,0.3)' : 'none',
                    fontFamily: 'Cairo, sans-serif',
                    fontWeight: 700,
                  }}
                >
                  تطبيق التعديلات
                </button>
                <button
                  onClick={() => { setShowScoreEditor(false); setAdjustA(0); setAdjustB(0); }}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 transition-all cursor-pointer active:scale-95"
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