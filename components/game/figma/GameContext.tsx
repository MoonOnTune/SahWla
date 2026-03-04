import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { GAME_CATEGORY_DEFS } from "@/lib/game/catalog";
import type { GameQuestionBankByCategory } from "@/lib/game/picks";

export type Language = "ar" | "en";
export type Screen = "welcome" | "categories" | "teams" | "board" | "question" | "walakalma" | "winner";
export type QuestionPhase = "showing" | "timerA" | "timerB" | "answer";

export interface Question {
  question: string;
  answer: string;
  value: number;
  pickId?: string;
  questionId?: string;
}

export interface Category {
  name: string;
  questions: Question[];
  type?: "normal" | "walakalma";
}

export interface Team {
  name: string;
  nameAr: string;
  score: number;
  playerCount: number;
  playerNames: string[];
  color: string;
  colorLight: string;
}

interface SelectedQuestion {
  catIndex: number;
  qIndex: number;
}

interface GameContextType {
  activeSessionId: string;
  questionBankByCategory: GameQuestionBankByCategory;
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
  screen: Screen;
  setScreen: Dispatch<SetStateAction<Screen>>;
  categories: Category[];
  setCategories: Dispatch<SetStateAction<Category[]>>;
  teams: [Team, Team];
  setTeams: Dispatch<SetStateAction<[Team, Team]>>;
  currentTurn: number;
  setCurrentTurn: Dispatch<SetStateAction<number>>;
  selectedQuestion: SelectedQuestion | null;
  setSelectedQuestion: Dispatch<SetStateAction<SelectedQuestion | null>>;
  questionPhase: QuestionPhase;
  setQuestionPhase: Dispatch<SetStateAction<QuestionPhase>>;
  usedTiles: Set<string>;
  markTileUsed: (key: string, pickId?: string) => void;
  awardPoints: (teamIndex: number, points: number) => void;
  t: (ar: string, en: string) => string;
  resetGame: () => void;
  rematch: () => void;
}

const defaultTeams: [Team, Team] = [
  {
    name: "Team A",
    nameAr: "الفريق أ",
    score: 0,
    playerCount: 2,
    playerNames: [],
    color: "#06b6d4",
    colorLight: "#22d3ee",
  },
  {
    name: "Team B",
    nameAr: "الفريق ب",
    score: 0,
    playerCount: 2,
    playerNames: [],
    color: "#d946ef",
    colorLight: "#e879f9",
  },
];

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}

const STORAGE_KEY = "sah_wala_game_state";

interface SavedGameState {
  screen: Screen;
  categories: Category[];
  teams: [Team, Team];
  currentTurn: number;
  selectedQuestion: SelectedQuestion | null;
  questionPhase: QuestionPhase;
  usedTiles: string[];
}

function loadSavedState(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameState;
    if (!parsed.screen || !parsed.categories || !parsed.teams) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: SavedGameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore localStorage write errors
  }
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const PRESET_CATEGORIES: Category[] = GAME_CATEGORY_DEFS.map((categoryDef) => ({
  name: categoryDef.name,
  type: categoryDef.type,
  questions: [],
}));

interface GameProviderProps {
  children: ReactNode;
  initialScreen?: Screen;
  activeSessionId: string;
  questionBankByCategory: GameQuestionBankByCategory;
}

export function GameProvider({
  children,
  initialScreen,
  activeSessionId,
  questionBankByCategory,
}: GameProviderProps) {
  const saved = useRef<SavedGameState | null>(null);
  const hasRestored = useRef(false);

  if (typeof window !== "undefined" && saved.current === null) {
    saved.current = loadSavedState();
  }

  const [language, setLanguage] = useState<Language>("ar");
  const [screen, setScreen] = useState<Screen>(saved.current?.screen || initialScreen || "categories");
  const [categories, setCategories] = useState<Category[]>(saved.current?.categories || []);
  const [teams, setTeams] = useState<[Team, Team]>(
    saved.current?.teams || [{ ...defaultTeams[0] }, { ...defaultTeams[1] }],
  );
  const [currentTurn, setCurrentTurn] = useState(saved.current?.currentTurn ?? 0);
  const [selectedQuestion, setSelectedQuestion] = useState<SelectedQuestion | null>(
    saved.current?.selectedQuestion ?? null,
  );
  const [questionPhase, setQuestionPhase] = useState<QuestionPhase>(saved.current?.questionPhase || "showing");
  const [usedTiles, setUsedTiles] = useState<Set<string>>(new Set(saved.current?.usedTiles || []));

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    if (saved.current) {
      const savedScreen = saved.current.screen;
      if (savedScreen === "question" || savedScreen === "walakalma") {
        setScreen("board");
        setSelectedQuestion(null);
        setQuestionPhase("showing");
      }
    }
  }, []);

  useEffect(() => {
    if (screen === "winner") {
      clearSavedState();
      return;
    }

    saveState({
      screen,
      categories,
      teams,
      currentTurn,
      selectedQuestion,
      questionPhase,
      usedTiles: Array.from(usedTiles),
    });
  }, [screen, categories, teams, currentTurn, selectedQuestion, questionPhase, usedTiles]);

  const markTileUsed = useCallback((key: string, pickId?: string) => {
    setUsedTiles((previous) => new Set(previous).add(key));

    if (!pickId) return;

    void fetch("/api/game/pick/use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickId }),
    });
  }, []);

  const awardPoints = useCallback((teamIndex: number, points: number) => {
    setTeams((previous) => {
      const next = [...previous] as [Team, Team];
      next[teamIndex] = { ...next[teamIndex], score: next[teamIndex].score + points };
      return next;
    });
  }, []);

  const t = useCallback((ar: string, en: string) => (language === "ar" ? ar : en), [language]);

  const resetGame = useCallback(() => {
    clearSavedState();
    setScreen("categories");
    setCategories([]);
    setTeams([{ ...defaultTeams[0] }, { ...defaultTeams[1] }]);
    setCurrentTurn(0);
    setSelectedQuestion(null);
    setQuestionPhase("showing");
    setUsedTiles(new Set());
  }, []);

  const rematch = useCallback(() => {
    setTeams((previous) =>
      [
        { ...previous[0], score: 0 },
        { ...previous[1], score: 0 },
      ] as [Team, Team],
    );
    setCurrentTurn(0);
    setSelectedQuestion(null);
    setQuestionPhase("showing");
    setUsedTiles(new Set());
    setScreen("board");
  }, []);

  return (
    <GameContext.Provider
      value={{
        activeSessionId,
        questionBankByCategory,
        language,
        setLanguage,
        screen,
        setScreen,
        categories,
        setCategories,
        teams,
        setTeams,
        currentTurn,
        setCurrentTurn,
        selectedQuestion,
        setSelectedQuestion,
        questionPhase,
        setQuestionPhase,
        usedTiles,
        markTileUsed,
        awardPoints,
        t,
        resetGame,
        rematch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
