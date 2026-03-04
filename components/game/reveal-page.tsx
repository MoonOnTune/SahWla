"use client";
import { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Film } from 'lucide-react';

interface RevealPageProps {
  movieName: string;
}

export function RevealPage({ movieName }: RevealPageProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)' }}
    >
      {/* Decorative orbs */}
      <div
        className="absolute top-10 left-10 w-48 h-48 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }}
      />
      <div
        className="absolute bottom-10 right-10 w-64 h-64 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 max-w-md w-full relative z-10"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
        >
          <Film className="w-10 h-10 text-gray-900" />
        </motion.div>

        {/* Title */}
        <h1
          className="text-3xl text-amber-400 text-center"
          style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
        >
          ولا كلمة 🎬
        </h1>

        <p
          className="text-white/50 text-center text-lg"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          اسم الفيلم المطلوب تمثيله بدون كلام
        </p>

        {/* Movie card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full rounded-3xl border overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.03))',
            borderColor: 'rgba(251,191,36,0.25)',
          }}
        >
          {!revealed ? (
            <div className="p-8 flex flex-col items-center gap-5">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(251,191,36,0.1)', border: '2px dashed rgba(251,191,36,0.3)' }}
              >
                <EyeOff className="w-12 h-12 text-amber-400/50" />
              </div>
              <p
                className="text-white/40 text-center"
                style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
              >
                اضغط الزر لكشف اسم الفيلم
              </p>
              <button
                onClick={() => setRevealed(true)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-gray-900 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  boxShadow: '0 0 30px rgba(251,191,36,0.3)',
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                }}
              >
                <Eye className="w-6 h-6" />
                اكشف الفيلم
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="p-8 flex flex-col items-center gap-4"
            >
              <p
                className="text-amber-200/60 text-sm"
                style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
              >
                اسم الفيلم
              </p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl text-amber-300 text-center leading-relaxed"
                style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}
              >
                {movieName}
              </motion.h2>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="h-0.5 rounded-full mt-2"
                style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }}
              />
              <p
                className="text-white/30 text-sm mt-4 text-center"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                مثّل هذا الفيلم لفريقك بدون أي كلام!
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Warning */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-red-400/60 text-sm text-center mt-4"
          style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
        >
          ⚠️ لا تُري الشاشة لأحد من فريقك أو الفريق الآخر
        </motion.p>
      </motion.div>
    </div>
  );
}
