import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router';
import {
  User, Mail, Calendar, Coins, TrendingDown, TrendingUp,
  GamepadIcon, Clock, LogOut, ShoppingCart
} from 'lucide-react';

export function AccountPage() {
  const { user, creditBalance, creditHistory, gameSessions, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in (wait for loading to finish)
  useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [user, isLoading, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ar-KW', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' });
  };

  const providerLabel: Record<string, string> = {
    google: 'Google',
    apple: 'Apple',
    email: 'رابط سحري',
    credentials: 'بريد + كلمة مرور',
  };

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)' }}>

      {/* Decorative orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
            حسابي
          </h1>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl text-white truncate" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
                {user.name}
              </h3>
              <div className="flex items-center gap-2 text-white/50 mt-1">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-sm truncate" style={{ fontFamily: 'Cairo, sans-serif' }}>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 mt-1">
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  عضو منذ {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/50 text-sm"
                  style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {providerLabel[user.provider] || user.provider}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credit Balance Mini Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 flex items-center justify-between"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <Coins className="w-7 h-7 text-yellow-400" />
            <div>
              <span className="text-white/60 text-sm block" style={{ fontFamily: 'Cairo, sans-serif' }}>الرصيد</span>
              <span className="text-3xl text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
                {creditBalance}
              </span>
              <span className="text-white/40 text-sm mr-2" style={{ fontFamily: 'Cairo, sans-serif' }}>ألعاب</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            شراء المزيد
          </button>
        </motion.div>

        {/* Credit History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <h3 className="text-xl text-white mb-5 flex items-center gap-2" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
            <Coins className="w-5 h-5 text-yellow-400" />
            سجل الرصيد
          </h3>

          {creditHistory.length === 0 ? (
            <p className="text-center text-white/30 py-8" style={{ fontFamily: 'Cairo, sans-serif' }}>
              لا توجد عمليات بعد
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {creditHistory.map(entry => (
                <div key={entry.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    entry.delta > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                    {entry.delta > 0
                      ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                      : <TrendingDown className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                      {entry.reasonLabel}
                    </p>
                    <p className="text-white/30 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {formatDate(entry.createdAt)} — {formatTime(entry.createdAt)}
                    </p>
                  </div>
                  <span className={`text-lg ${entry.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
                    {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Game Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <h3 className="text-xl text-white mb-5 flex items-center gap-2" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
            <GamepadIcon className="w-5 h-5 text-cyan-400" />
            سجل الألعاب
          </h3>

          {gameSessions.length === 0 ? (
            <p className="text-center text-white/30 py-8" style={{ fontFamily: 'Cairo, sans-serif' }}>
              لم تلعب أي لعبة بعد
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {gameSessions.map(session => (
                <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    session.status === 'active' ? 'bg-cyan-500/20' : 'bg-white/10'
                  }`}>
                    {session.status === 'active'
                      ? <GamepadIcon className="w-5 h-5 text-cyan-400" />
                      : <Clock className="w-5 h-5 text-white/40" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                      لعبة {session.id.slice(-4)}
                    </p>
                    <p className="text-white/30 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {formatDate(session.startedAt)} — {formatTime(session.startedAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    session.status === 'active'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : session.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/10 text-white/40'
                  }`} style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                    {session.status === 'active' ? 'نشطة' : session.status === 'completed' ? 'مكتملة' : 'ملغية'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mx-auto px-8 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-white/50 hover:text-red-400 transition-all cursor-pointer"
            style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </motion.div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)' }} />
    </div>
  );
}