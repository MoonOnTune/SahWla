import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { ShoppingCart, User, Sparkles, LogOut, GamepadIcon, Home, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function AppLayout() {
  const { user, creditBalance, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show nav on login page or play page (full-screen game)
  const hideNav = location.pathname === '/login' || location.pathname === '/play';

  if (hideNav) {
    return <Outlet />;
  }

  const navItems = [
    { path: '/', label: 'الرئيسية', icon: Home },
    { path: '/shop', label: 'المتجر', icon: ShoppingCart },
    { path: '/account', label: 'حسابي', icon: User },
    { path: '/contact', label: 'تواصل معنا', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* Top Nav */}
      <nav dir="rtl" className="sticky top-0 z-50 border-b border-white/5"
        style={{ background: 'rgba(10, 10, 46, 0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
            <span className="text-xl text-white" style={{ fontWeight: 900 }}>
              صح ولا؟
            </span>
          </button>

          {/* Center nav */}
          <div className="flex items-center gap-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/home');
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side: credits + user */}
          <div className="flex items-center gap-3">
            {/* Credit badge */}
            {user && (
              <motion.div
                key={creditBalance}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20"
              >
                <GamepadIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm" style={{ fontWeight: 700 }}>
                  {creditBalance}
                </span>
              </motion.div>
            )}

            {user ? (
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-sm"
                style={{ fontWeight: 600 }}
              >
                دخول
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}