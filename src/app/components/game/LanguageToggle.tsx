import { useGame } from './GameContext';

export function LanguageToggle() {
  const { language, setLanguage } = useGame();

  return (
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1">
      <button
        onClick={() => setLanguage('ar')}
        className={`px-3 py-1 rounded-full transition-all ${
          language === 'ar'
            ? 'bg-white text-gray-900'
            : 'text-white/70 hover:text-white'
        }`}
      >
        AR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-full transition-all ${
          language === 'en'
            ? 'bg-white text-gray-900'
            : 'text-white/70 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
