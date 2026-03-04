import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';

interface TimerProps {
  duration: number; // in seconds
  teamLabel: string;
  teamColor: string;
  onExpired: () => void;
  running: boolean;
}

export function Timer({ duration, teamLabel, teamColor, onExpired, running }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => onExpiredRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, timeLeft <= 0]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isExpired = timeLeft === 0;
  const progress = timeLeft / duration;

  const increaseTime = () => {
    setTimeLeft(prev => prev + 10);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-lg" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, color: teamColor }}>
        {teamLabel}
      </span>
      
      <motion.div
        animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5, repeat: isWarning ? Infinity : 0 }}
        className={`relative flex items-center justify-center w-40 h-40 rounded-full border-4 ${
          isExpired ? 'border-red-500 bg-red-500/20' : isWarning ? 'border-yellow-400 bg-yellow-400/10' : 'bg-white/5'
        }`}
        style={{ borderColor: isExpired ? '#ef4444' : isWarning ? '#facc15' : teamColor }}
      >
        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={isExpired ? '#ef4444' : isWarning ? '#facc15' : teamColor}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
            opacity={0.6}
          />
        </svg>
        
        <span className={`text-5xl ${isExpired ? 'text-red-400' : 'text-white'}`}
          style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </motion.div>

      {running && !isExpired && (
        <button
          onClick={increaseTime}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all cursor-pointer active:scale-95"
          style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
        >
          +١٠ ثوانٍ
        </button>
      )}
    </div>
  );
}