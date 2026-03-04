import { useGame, PRESET_CATEGORIES, Category } from './GameContext';
import { Check, ChevronLeft } from 'lucide-react';
import { getCategoryIcon } from './CategoryIcons';
import { motion } from 'motion/react';
import { useState } from 'react';

function toArabicNumeral(n: number): string {
  const arabicDigits = ['٠', '٢', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).replace(/\d/g, d => arabicDigits[parseInt(d)]);
}

export function CategorySetup() {
  const { setScreen, setCategories } = useGame();
  const [selected, setSelected] = useState<number[]>([]);

  const toggleCategory = (index: number) => {
    setSelected(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length >= 6) return prev;
      return [...prev, index];
    });
  };

  const handleNext = () => {
    if (selected.length !== 6) return;
    const cats: Category[] = selected.map(i => PRESET_CATEGORIES[i]);
    setCategories(cats);
    setScreen('teams');
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col relative"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
            اختر 6 فئات
          </h1>
          <p className="text-white/50 text-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
            تم اختيار {selected.length} من 6
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full mb-8 overflow-y-auto max-h-[60vh] p-1">
          {PRESET_CATEGORIES.map((cat, i) => {
            const isSelected = selected.includes(i);
            const isDisabled = !isSelected && selected.length >= 6;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !isDisabled && toggleCategory(i)}
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/20'
                    : isDisabled
                    ? 'border-white/5 bg-white/5 opacity-40'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                    <Check className="w-4 h-4 text-gray-900" />
                  </div>
                )}
                <div className={`transition-transform ${isSelected ? 'scale-110' : ''}`}>
                  {getCategoryIcon(cat.name)}
                </div>
                <span className="text-sm text-white text-center leading-snug" style={{ fontWeight: 700 }}>{cat.name}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleNext}
          disabled={selected.length !== 6}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-white transition-all cursor-pointer ${
            selected.length === 6
              ? 'hover:scale-105 active:scale-95'
              : 'opacity-40 cursor-not-allowed'
          }`}
          style={{
            background: selected.length === 6
              ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)'
              : 'rgba(255,255,255,0.1)',
            boxShadow: selected.length === 6 ? '0 0 30px rgba(6, 182, 212, 0.3)' : 'none',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 700,
          }}
        >
          <span>التالي</span>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}