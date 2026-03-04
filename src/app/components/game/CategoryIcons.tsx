import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
}

// الكويت والخليج — Kuwait towers silhouette
function KuwaitGulfIcon({ className = 'w-12 h-12', color = '#06b6d4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="50" width="44" height="4" rx="2" fill={color} opacity="0.4" />
      <path d="M20 50V22c0-2 1-4 3-4h2c2 0 3 2 3 4v28" stroke={color} strokeWidth="2" />
      <circle cx="24" cy="28" r="5" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" />
      <path d="M34 50V18c0-2 1-4 3-4h2c2 0 3 2 3 4v32" stroke={color} strokeWidth="2" />
      <circle cx="38" cy="24" r="6" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" />
      <path d="M48 50V30c0-1.5 0.8-3 2-3s2 1.5 2 3v20" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <circle cx="50" cy="33" r="3.5" fill={color} opacity="0.2" stroke={color} strokeWidth="1" />
      <path d="M8 54h48" stroke={color} strokeWidth="2" opacity="0.3" />
      <circle cx="32" cy="8" r="2" fill={color} opacity="0.5" />
      <path d="M30 8h4" stroke={color} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

// اللهجة الكويتية — Speech bubbles
function DialectIcon({ className = 'w-12 h-12', color = '#f59e0b' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10h32c2 0 4 2 4 4v16c0 2-2 4-4 4H20l-8 8v-8H6c-2 0-4-2-4-4V14c0-2 2-4 4-4z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <path d="M26 38h18c2 0 4 2 4 4v12c0 2-2 4-4 4h-2v6l-6-6H26c-2 0-4-2-4-4V42c0-2 2-4 4-4z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <text x="14" y="26" fill={color} fontSize="12" fontFamily="Cairo, sans-serif" fontWeight="700" opacity="0.7">ها</text>
      <text x="34" y="52" fill={color} fontSize="10" fontFamily="Cairo, sans-serif" fontWeight="700" opacity="0.7">شلون</text>
      <circle cx="50" cy="14" r="2" fill={color} opacity="0.3" />
      <circle cx="54" cy="10" r="1.5" fill={color} opacity="0.2" />
    </svg>
  );
}

// الأكل الكويتي — Bowl with steam and cushion
function KuwaitiFoodIcon({ className = 'w-12 h-12', color = '#f97316' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="38" rx="22" ry="8" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <path d="M10 38c0 8 10 14 22 14s22-6 22-14" stroke={color} strokeWidth="2" />
      <path d="M10 38v4c0 8 10 14 22 14s22-6 22-14v-4" stroke={color} strokeWidth="2" opacity="0.3" />
      <path d="M22 30c0-4 2-6 2-10" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M32 28c0-4 2-6 2-10" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M42 30c0-4 2-6 2-10" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M4 58c4-2 8-2 12 0s8 2 12 0 8-2 12 0 8 2 12 0 8-2 12 0" stroke={color} strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

// عواصم ودول — Globe with pin markers
function CapitalsIcon({ className = 'w-12 h-12', color = '#06b6d4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="24" stroke={color} strokeWidth="2" />
      <ellipse cx="32" cy="32" rx="12" ry="24" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <path d="M8 32h48" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <path d="M12 20h40" stroke={color} strokeWidth="1" opacity="0.3" />
      <path d="M12 44h40" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="22" cy="22" r="3" fill={color} opacity="0.6" />
      <path d="M22 22v-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="42" cy="36" r="3" fill={color} opacity="0.6" />
      <path d="M42 36v-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="44" r="2.5" fill={color} opacity="0.4" />
      <path d="M30 44v-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// معالم شهيرة — Eiffel tower / pyramid silhouette
function LandmarksIcon({ className = 'w-12 h-12', color = '#a855f7' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 56L32 8L40 56" stroke={color} strokeWidth="2.5" />
      <path d="M26 42h12" stroke={color} strokeWidth="2" />
      <path d="M28 30h8" stroke={color} strokeWidth="2" />
      <path d="M22 56h20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 8h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M48 56l8-20h8l-8 20" stroke={color} strokeWidth="1.5" opacity="0.5" fill={color} fillOpacity="0.1" />
      <path d="M2 56l8-16h6l-6 16" stroke={color} strokeWidth="1.5" opacity="0.5" fill={color} fillOpacity="0.1" />
      <line x1="32" y1="8" x2="32" y2="4" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// أفلام ومسلسلات — Film clapperboard
function MoviesIcon({ className = 'w-12 h-12', color = '#ef4444' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="18" width="52" height="38" rx="4" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.08" />
      <path d="M6 18h52l-4-10H10L6 18z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <line x1="18" y1="8" x2="14" y2="18" stroke={color} strokeWidth="2" />
      <line x1="30" y1="8" x2="26" y2="18" stroke={color} strokeWidth="2" />
      <line x1="42" y1="8" x2="38" y2="18" stroke={color} strokeWidth="2" />
      <line x1="54" y1="8" x2="50" y2="18" stroke={color} strokeWidth="2" />
      <polygon points="26,30 26,48 42,39" fill={color} opacity="0.5" />
    </svg>
  );
}

// الرياضة والبطولات — Trophy with star
function SportsIcon({ className = 'w-12 h-12', color = '#10b981' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 10h24v18c0 8-5 14-12 14s-12-6-12-14V10z" stroke={color} strokeWidth="2.5" />
      <path d="M20 16H12c0 0-1 12 8 14" stroke={color} strokeWidth="2" opacity="0.6" />
      <path d="M44 16h8c0 0 1 12-8 14" stroke={color} strokeWidth="2" opacity="0.6" />
      <path d="M32 42v6" stroke={color} strokeWidth="2.5" />
      <rect x="22" y="48" width="20" height="4" rx="2" fill={color} opacity="0.5" />
      <rect x="18" y="52" width="28" height="4" rx="2" fill={color} opacity="0.7" />
      <polygon points="32,14 34,20 40,20 35,24 37,30 32,26 27,30 29,24 24,20 30,20" fill={color} opacity="0.4" />
    </svg>
  );
}

// الموسيقى والفنانون — Musical notes
function MusicIcon({ className = 'w-12 h-12', color = '#ec4899' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 48V16l28-8v32" stroke={color} strokeWidth="2.5" />
      <circle cx="16" cy="48" r="6" fill={color} opacity="0.4" stroke={color} strokeWidth="2" />
      <circle cx="44" cy="40" r="6" fill={color} opacity="0.4" stroke={color} strokeWidth="2" />
      <path d="M22 24l28-8" stroke={color} strokeWidth="2" opacity="0.4" />
      <circle cx="36" cy="14" r="2" fill={color} opacity="0.3" />
      <circle cx="10" cy="30" r="1.5" fill={color} opacity="0.2" />
      <circle cx="54" cy="22" r="1.5" fill={color} opacity="0.2" />
    </svg>
  );
}

// محطات تاريخية — Scroll / monument
function HistoricalIcon({ className = 'w-12 h-12', color = '#f59e0b' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8c0-2 2-4 4-4h28c2 0 4 2 4 4" stroke={color} strokeWidth="2" />
      <path d="M12 8v44c0 4 4 6 6 2l2-4 2 4c2 4 6 2 6-2V8" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.05" />
      <path d="M28 8v44c0 4 4 6 6 2l2-4 2 4c2 4 6 2 6-2V8" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.05" />
      <rect x="16" y="14" width="14" height="2" rx="1" fill={color} opacity="0.5" />
      <rect x="16" y="20" width="10" height="2" rx="1" fill={color} opacity="0.4" />
      <rect x="16" y="26" width="12" height="2" rx="1" fill={color} opacity="0.3" />
      <rect x="32" y="14" width="10" height="2" rx="1" fill={color} opacity="0.5" />
      <rect x="32" y="20" width="8" height="2" rx="1" fill={color} opacity="0.4" />
      <rect x="32" y="26" width="10" height="2" rx="1" fill={color} opacity="0.3" />
    </svg>
  );
}

// العلوم — Atom orbits
function ScienceIcon({ className = 'w-12 h-12', color = '#10b981' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="32" rx="26" ry="10" stroke={color} strokeWidth="2" />
      <ellipse cx="32" cy="32" rx="26" ry="10" stroke={color} strokeWidth="2" transform="rotate(60 32 32)" />
      <ellipse cx="32" cy="32" rx="26" ry="10" stroke={color} strokeWidth="2" transform="rotate(-60 32 32)" />
      <circle cx="32" cy="32" r="5" fill={color} opacity="0.8" />
      <circle cx="32" cy="32" r="3" fill={color} />
      <circle cx="55" cy="24" r="2.5" fill={color} opacity="0.7" />
      <circle cx="14" cy="22" r="2.5" fill={color} opacity="0.7" />
      <circle cx="38" cy="54" r="2.5" fill={color} opacity="0.7" />
    </svg>
  );
}

// التقنية والإنترنت — Laptop with wifi
function TechIcon({ className = 'w-12 h-12', color = '#3b82f6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="12" width="44" height="30" rx="3" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.05" />
      <rect x="14" y="16" width="36" height="22" rx="1" fill={color} opacity="0.1" />
      <path d="M4 46h56c0 4-4 8-8 8H12c-4 0-8-4-8-8z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <path d="M32 22a8 8 0 0 1 8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M32 18a12 12 0 0 1 12 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <circle cx="32" cy="30" r="2" fill={color} opacity="0.7" />
    </svg>
  );
}

// علامات تجارية — Briefcase with tag
function BusinessIcon({ className = 'w-12 h-12', color = '#8b5cf6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="20" width="48" height="32" rx="4" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.08" />
      <path d="M22 20V14c0-2 2-4 4-4h12c2 0 4 2 4 4v6" stroke={color} strokeWidth="2" />
      <path d="M8 32h48" stroke={color} strokeWidth="2" opacity="0.4" />
      <rect x="28" y="28" width="8" height="8" rx="2" fill={color} opacity="0.4" />
      <path d="M50 14l6 6-2 2-6-6 2-2z" fill={color} opacity="0.3" />
      <circle cx="50" cy="14" r="2" fill={color} opacity="0.4" />
    </svg>
  );
}

// الحيوانات والطبيعة — Paw print with leaf
function AnimalsIcon({ className = 'w-12 h-12', color = '#22c55e' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="38" rx="10" ry="12" fill={color} opacity="0.3" />
      <ellipse cx="20" cy="24" rx="5" ry="6" fill={color} opacity="0.4" transform="rotate(-15 20 24)" />
      <ellipse cx="44" cy="24" rx="5" ry="6" fill={color} opacity="0.4" transform="rotate(15 44 24)" />
      <ellipse cx="14" cy="34" rx="4" ry="5" fill={color} opacity="0.4" transform="rotate(-20 14 34)" />
      <ellipse cx="50" cy="34" rx="4" ry="5" fill={color} opacity="0.4" transform="rotate(20 50 34)" />
      <path d="M46 52c4-8 8-16 4-22" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <path d="M50 52c-2-2-6-2-8 0" stroke={color} strokeWidth="1.5" opacity="0.4" fill={color} fillOpacity="0.15" />
    </svg>
  );
}

// أطعمة من حول العالم — Fork and globe
function WorldFoodIcon({ className = 'w-12 h-12', color = '#f97316' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="34" cy="32" r="20" stroke={color} strokeWidth="2" />
      <ellipse cx="34" cy="32" rx="10" ry="20" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <path d="M14 32h40" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <path d="M18 22h32" stroke={color} strokeWidth="1" opacity="0.2" />
      <path d="M18 42h32" stroke={color} strokeWidth="1" opacity="0.2" />
      <path d="M10 14v6c0 2 1 3 2 3s2-1 2-3v-6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 23v18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 14v6c0 2 1 3 2 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// اللغة والكلمات — Book with Arabic letter
function LanguageIcon({ className = 'w-12 h-12', color = '#06b6d4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 8h40c4 0 8 4 8 8v32c0 4-4 8-8 8H8V8z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.05" />
      <path d="M16 8v48" stroke={color} strokeWidth="2" opacity="0.3" />
      <text x="30" y="38" fill={color} fontSize="22" fontFamily="Cairo, sans-serif" fontWeight="800" textAnchor="middle" opacity="0.7">ع</text>
      <rect x="22" y="44" width="20" height="2" rx="1" fill={color} opacity="0.3" />
      <rect x="24" y="48" width="14" height="2" rx="1" fill={color} opacity="0.2" />
    </svg>
  );
}

// الأساطير والفلكلور — Dragon / Phoenix flame
function MythsIcon({ className = 'w-12 h-12', color = '#f43f5e' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 58c-6-8-18-20-18-34C14 14 22 6 32 6s18 8 18 18c0 14-12 26-18 34z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <path d="M32 50c-4-6-12-14-12-24C20 18 25 12 32 12s12 6 12 14c0 10-8 18-12 24z" fill={color} opacity="0.15" />
      <path d="M32 42c-2-4-8-10-8-18C24 18 28 14 32 14s8 4 8 10c0 8-6 14-8 18z" fill={color} opacity="0.25" />
      <circle cx="28" cy="22" r="2" fill="white" opacity="0.6" />
      <circle cx="36" cy="22" r="2" fill="white" opacity="0.6" />
      <circle cx="28" cy="22" r="1" fill={color} />
      <circle cx="36" cy="22" r="1" fill={color} />
    </svg>
  );
}

// ألغاز ومنطق — Puzzle piece with lightbulb
function PuzzleIcon({ className = 'w-12 h-12', color = '#eab308' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 14h12v4c0 3 2 5 5 5s5-2 5-5v-4h12v12h-4c-3 0-5 2-5 5s2 5 5 5h4v12H36v-4c0-3-2-5-5-5s-5 2-5 5v4H14V36h4c3 0 5-2 5-5s-2-5-5-5h-4V14z" 
        stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.1" />
      <circle cx="32" cy="32" r="4" fill={color} opacity="0.4" />
      <text x="32" y="36" fill={color} fontSize="8" fontFamily="sans-serif" fontWeight="800" textAnchor="middle" opacity="0.8">?</text>
    </svg>
  );
}

// خمن الشخصية — Silhouette with question mark
function GuessPersonIcon({ className = 'w-12 h-12', color = '#d946ef' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="20" r="12" fill={color} opacity="0.3" />
      <path d="M10 56c0-12 8-20 18-20s18 8 18 20" fill={color} opacity="0.2" />
      <circle cx="28" cy="20" r="12" stroke={color} strokeWidth="2" />
      <path d="M10 56c0-12 8-20 18-20s18 8 18 20" stroke={color} strokeWidth="2" />
      <circle cx="48" cy="16" r="10" fill="#0a0a2e" stroke={color} strokeWidth="2" />
      <text x="48" y="22" fill={color} fontSize="16" fontFamily="Cairo, sans-serif" fontWeight="800" textAnchor="middle">?</text>
    </svg>
  );
}

// اقتباسات وأمثال — Quotation marks
function QuotesIcon({ className = 'w-12 h-12', color = '#14b8a6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20c0-4 4-8 8-8h4v8c0 8-4 14-12 18l-2-4c4-2 6-4 6-8h-4c-2 0-4-2-4-4v-2z" 
        fill={color} opacity="0.4" stroke={color} strokeWidth="2" />
      <path d="M34 20c0-4 4-8 8-8h4v8c0 8-4 14-12 18l-2-4c4-2 6-4 6-8h-4c-2 0-4-2-4-4v-2z" 
        fill={color} opacity="0.4" stroke={color} strokeWidth="2" />
      <rect x="8" y="44" width="48" height="2" rx="1" fill={color} opacity="0.3" />
      <rect x="14" y="50" width="36" height="2" rx="1" fill={color} opacity="0.2" />
      <rect x="20" y="56" width="24" height="2" rx="1" fill={color} opacity="0.15" />
    </svg>
  );
}

// السيارات والمحركات — Car silhouette with speed lines
function CarsIcon({ className = 'w-12 h-12', color = '#ef4444' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 36l4-12c1-3 4-5 7-5h18c3 0 6 2 7 5l4 12" stroke={color} strokeWidth="2.5" />
      <rect x="8" y="36" width="48" height="12" rx="4" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.1" />
      <circle cx="20" cy="48" r="5" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.2" />
      <circle cx="44" cy="48" r="5" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.2" />
      <circle cx="20" cy="48" r="2" fill={color} opacity="0.5" />
      <circle cx="44" cy="48" r="2" fill={color} opacity="0.5" />
      <path d="M22 30h20" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <line x1="2" y1="32" x2="10" y2="32" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="2" y1="36" x2="8" y2="36" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="4" y1="40" x2="8" y2="40" stroke={color} strokeWidth="1.5" opacity="0.2" />
    </svg>
  );
}

// القرآن الكريم — Open Quran book
function QuranIcon({ className = 'w-12 h-12', color = '#10b981' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 14L8 10v38l24 4 24-4V10L32 14z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.08" />
      <line x1="32" y1="14" x2="32" y2="52" stroke={color} strokeWidth="2" opacity="0.5" />
      <path d="M12 16c6-2 12-1 20 2" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <path d="M12 22c6-2 12-1 20 2" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <path d="M12 28c6-2 12-1 20 2" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <path d="M52 16c-6-2-12-1-20 2" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <path d="M52 22c-6-2-12-1-20 2" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <path d="M52 28c-6-2-12-1-20 2" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <circle cx="32" cy="8" r="3" fill={color} opacity="0.5" />
      <path d="M29 6l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// السيرة النبوية — Mosque dome and minaret
function SeeraIcon({ className = 'w-12 h-12', color = '#8b5cf6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="34" width="36" height="20" rx="2" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.08" />
      <path d="M32 14c-10 0-16 10-16 20h32c0-10-6-20-16-20z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <line x1="32" y1="8" x2="32" y2="14" stroke={color} strokeWidth="2" />
      <circle cx="32" cy="6" r="2.5" fill={color} opacity="0.6" />
      <rect x="8" y="26" width="6" height="28" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
      <path d="M11 20l-3 6h6l-3-6z" fill={color} opacity="0.4" />
      <circle cx="11" cy="18" r="1.5" fill={color} opacity="0.5" />
      <rect x="50" y="26" width="6" height="28" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
      <path d="M53 20l-3 6h6l-3-6z" fill={color} opacity="0.4" />
      <circle cx="53" cy="18" r="1.5" fill={color} opacity="0.5" />
      <path d="M26 54v-8c0-3 3-6 6-6s6 3 6 6v8" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

// ولا كلمة — Speech bubble with X (no talking)
function TabooIcon({ className = 'w-12 h-12', color = '#fbbf24' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 12h48v30c0 3-2 5-5 5H24l-10 9v-9h-3c-3 0-3-2-3-5V12z"
        stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.08" rx="4" />
      <circle cx="32" cy="28" r="12" stroke={color} strokeWidth="2" opacity="0.4" />
      <line x1="24" y1="20" x2="40" y2="36" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="20" x2="24" y2="36" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Map category name to icon component
export function getCategoryIcon(name: string, className?: string): React.ReactNode {
  const iconClass = className || 'w-10 h-10 md:w-12 md:h-12';
  switch (name) {
    case 'الكويت والخليج':
      return <KuwaitGulfIcon className={iconClass} />;
    case 'اللهجة الكويتية':
      return <DialectIcon className={iconClass} />;
    case 'الأكل الكويتي':
      return <KuwaitiFoodIcon className={iconClass} />;
    case 'عواصم ودول':
      return <CapitalsIcon className={iconClass} />;
    case 'معالم شهيرة':
      return <LandmarksIcon className={iconClass} />;
    case 'أفلام ومسلسلات':
      return <MoviesIcon className={iconClass} />;
    case 'الرياضة والبطولات':
      return <SportsIcon className={iconClass} />;
    case 'الموسيقى والفنانون':
      return <MusicIcon className={iconClass} />;
    case 'محطات تاريخية':
      return <HistoricalIcon className={iconClass} />;
    case 'العلوم':
      return <ScienceIcon className={iconClass} />;
    case 'التقنية والإنترنت':
      return <TechIcon className={iconClass} />;
    case 'علامات تجارية':
      return <BusinessIcon className={iconClass} />;
    case 'الحيوانات والطبيعة':
      return <AnimalsIcon className={iconClass} />;
    case 'أطعمة من حول العالم':
      return <WorldFoodIcon className={iconClass} />;
    case 'اللغة والكلمات':
      return <LanguageIcon className={iconClass} />;
    case 'الأساطير والفلكلور':
      return <MythsIcon className={iconClass} />;
    case 'ألغاز ومنطق':
      return <PuzzleIcon className={iconClass} />;
    case 'خمن الشخصية':
      return <GuessPersonIcon className={iconClass} />;
    case 'اقتباسات وأمثال':
      return <QuotesIcon className={iconClass} />;
    case 'السيارات والمحركات':
      return <CarsIcon className={iconClass} />;
    case 'القرآن الكريم':
      return <QuranIcon className={iconClass} />;
    case 'السيرة النبوية':
      return <SeeraIcon className={iconClass} />;
    case 'ولا كلمة':
      return <TabooIcon className={iconClass} />;
    default:
      return null;
  }
}