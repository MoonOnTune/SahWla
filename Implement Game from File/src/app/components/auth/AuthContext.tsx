import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  provider: 'google' | 'apple' | 'email' | 'credentials';
  createdAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  delta: number;
  reason: 'purchase' | 'game_start' | 'refund' | 'bonus';
  reasonLabel: string;
  refType?: string;
  refId?: string;
  createdAt: string;
}

export interface GameSession {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  endedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  creditBalance: number;
  creditHistory: CreditLedgerEntry[];
  gameSessions: GameSession[];
  activeSession: GameSession | null;
  login: (method: string, email?: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  sendMagicLink: (email: string) => Promise<boolean>;
  logout: () => void;
  buyCredits: (quantity?: number) => Promise<{ success: boolean; paymentUrl?: string }>;
  startGame: () => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  endGame: (sessionId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Mock user data
const MOCK_USER: User = {
  id: 'usr_mock_001',
  name: 'أحمد المحمد',
  email: 'ahmed@example.com',
  provider: 'google',
  createdAt: '2026-01-15T10:00:00Z',
};

const INITIAL_CREDITS = 3;

const INITIAL_HISTORY: CreditLedgerEntry[] = [
  {
    id: 'txn_001',
    delta: 5,
    reason: 'purchase',
    reasonLabel: 'شراء ٥ ألعاب',
    refType: 'payment',
    refId: 'pay_001',
    createdAt: '2026-01-15T10:05:00Z',
  },
  {
    id: 'txn_002',
    delta: -1,
    reason: 'game_start',
    reasonLabel: 'بدء لعبة',
    refType: 'game_session',
    refId: 'gs_001',
    createdAt: '2026-01-20T18:30:00Z',
  },
  {
    id: 'txn_003',
    delta: -1,
    reason: 'game_start',
    reasonLabel: 'بدء لعبة',
    refType: 'game_session',
    refId: 'gs_002',
    createdAt: '2026-02-10T20:00:00Z',
  },
];

const INITIAL_SESSIONS: GameSession[] = [
  { id: 'gs_001', status: 'completed', startedAt: '2026-01-20T18:30:00Z', endedAt: '2026-01-20T19:15:00Z' },
  { id: 'gs_002', status: 'completed', startedAt: '2026-02-10T20:00:00Z', endedAt: '2026-02-10T20:45:00Z' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState(INITIAL_CREDITS);
  const [creditHistory, setCreditHistory] = useState<CreditLedgerEntry[]>(INITIAL_HISTORY);
  const [gameSessions, setGameSessions] = useState<GameSession[]>(INITIAL_SESSIONS);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);

  // Restore user + active session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('sah_wala_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    const savedSession = localStorage.getItem('sah_wala_active_session');
    if (savedSession) {
      try {
        setActiveSession(JSON.parse(savedSession));
      } catch {}
    }
    const savedCredits = localStorage.getItem('sah_wala_credits');
    if (savedCredits !== null) {
      try {
        setCreditBalance(JSON.parse(savedCredits));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  // Persist active session whenever it changes
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('sah_wala_active_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('sah_wala_active_session');
    }
  }, [activeSession]);

  // Persist credit balance whenever it changes
  useEffect(() => {
    localStorage.setItem('sah_wala_credits', JSON.stringify(creditBalance));
  }, [creditBalance]);

  const login = useCallback(async (method: string, email?: string, _password?: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200));
    const u: User = {
      ...MOCK_USER,
      provider: method as User['provider'],
      email: email || MOCK_USER.email,
    };
    setUser(u);
    localStorage.setItem('sah_wala_user', JSON.stringify(u));
    setIsLoading(false);
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const u: User = {
      id: 'usr_new_' + Date.now(),
      name,
      email,
      provider: 'credentials',
      createdAt: new Date().toISOString(),
    };
    setUser(u);
    localStorage.setItem('sah_wala_user', JSON.stringify(u));
    // New users get 0 credits
    setCreditBalance(0);
    setCreditHistory([]);
    setGameSessions([]);
    setIsLoading(false);
    return true;
  }, []);

  const sendMagicLink = useCallback(async (_email: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    // In a real app, this would send an email
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setActiveSession(null);
    localStorage.removeItem('sah_wala_user');
  }, []);

  const buyCredits = useCallback(async (quantity: number = 5): Promise<{ success: boolean; paymentUrl?: string }> => {
    // Simulate creating a checkout and immediate payment success
    await new Promise(r => setTimeout(r, 1500));
    const txnId = 'txn_' + Date.now();
    const label = quantity === 1 ? 'شراء لعبة واحدة' : `شراء ${quantity} ألعاب`;
    const entry: CreditLedgerEntry = {
      id: txnId,
      delta: quantity,
      reason: 'purchase',
      reasonLabel: label,
      refType: 'payment',
      refId: 'pay_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setCreditBalance(prev => prev + quantity);
    setCreditHistory(prev => [entry, ...prev]);
    return { success: true };
  }, []);

  const startGame = useCallback(async (): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    if (creditBalance < 1) {
      return { success: false, error: 'رصيدك غير كافي. اشترِ رصيداً من المتجر.' };
    }
    await new Promise(r => setTimeout(r, 800));

    const sessionId = 'gs_' + Date.now();
    const session: GameSession = {
      id: sessionId,
      status: 'active',
      startedAt: new Date().toISOString(),
    };
    const entry: CreditLedgerEntry = {
      id: 'txn_' + Date.now(),
      delta: -1,
      reason: 'game_start',
      reasonLabel: 'بدء لعبة',
      refType: 'game_session',
      refId: sessionId,
      createdAt: new Date().toISOString(),
    };

    setCreditBalance(prev => prev - 1);
    setCreditHistory(prev => [entry, ...prev]);
    setGameSessions(prev => [session, ...prev]);
    setActiveSession(session);
    return { success: true, sessionId };
  }, [creditBalance]);

  const endGame = useCallback((sessionId: string) => {
    setGameSessions(prev =>
      prev.map(s => s.id === sessionId ? { ...s, status: 'completed' as const, endedAt: new Date().toISOString() } : s)
    );
    setActiveSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isLoading, creditBalance, creditHistory, gameSessions, activeSession,
      login, register, sendMagicLink, logout, buyCredits, startGame, endGame,
    }}>
      {children}
    </AuthContext.Provider>
  );
}