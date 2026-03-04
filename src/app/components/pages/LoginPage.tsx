import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';

type Tab = 'login' | 'register';

export function LoginPage() {
  const { login, register, sendMagicLink, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [error, setError] = useState('');

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError('');
    const success = await login(provider);
    if (success) navigate('/');
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('يرجى تعبئة جميع الحقول');
      return;
    }
    if (tab === 'register') {
      if (!name) { setError('يرجى إدخال الاسم'); return; }
      const success = await register(name, email, password);
      if (success) navigate('/');
    } else {
      const success = await login('credentials', email, password);
      if (success) navigate('/');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('يرجى إدخال البريد الإلكتروني'); return; }
    setError('');
    const success = await sendMagicLink(email);
    if (success) {
      setMagicLinkSent(true);
      // Auto-login after simulated delay (mock)
      setTimeout(async () => {
        await login('email', email);
        navigate('/');
      }, 2000);
    }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all";

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)' }}>

      {/* Decorative orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="inline-block mb-3"
          >
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </motion.div>
          <h1 className="text-4xl text-white" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
            صح ولا؟
          </h1>
          <p className="text-white/50 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            سجّل دخولك للبدء
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          <AnimatePresence mode="wait">
            {showMagicLink ? (
              <motion.div key="magic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button
                  onClick={() => { setShowMagicLink(false); setMagicLinkSent(false); }}
                  className="flex items-center gap-1 text-white/50 hover:text-white mb-6 cursor-pointer"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  رجوع
                </button>

                {magicLinkSent ? (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                    >
                      <Check className="w-8 h-8 text-emerald-400" />
                    </motion.div>
                    <p className="text-white text-lg" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                      تم إرسال الرابط!
                    </p>
                    <p className="text-white/50 mt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      تحقق من بريدك الإلكتروني {email}
                    </p>
                    <p className="text-cyan-400/60 mt-4 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      (وضع تجريبي: جاري تسجيل الدخول تلقائياً...)
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
                    <h3 className="text-xl text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                      تسجيل بالرابط السحري
                    </h3>
                    <p className="text-white/40 text-sm mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      سنرسل لك رابطاً للدخول بدون كلمة مرور
                    </p>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className={inputClass}
                        style={{ fontFamily: 'Cairo, sans-serif', paddingRight: '2.5rem' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                        fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                      }}
                    >
                      {isLoading ? 'جاري الإرسال...' : 'إرسال الرابط'}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                {/* OAuth Buttons */}
                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={() => handleOAuth('google')}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    الدخول بحساب Google
                  </button>

                  <button
                    onClick={() => handleOAuth('apple')}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    الدخول بحساب Apple
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>أو</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Magic Link Button */}
                <button
                  onClick={() => setShowMagicLink(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white/70 hover:text-white transition-all mb-6 cursor-pointer"
                  style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
                >
                  <Mail className="w-4 h-4" />
                  دخول برابط سحري عبر البريد
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>أو بالبريد وكلمة المرور</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Tab switcher */}
                <div className="flex mb-6 bg-white/5 rounded-xl p-1">
                  {(['login', 'register'] as Tab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setError(''); }}
                      className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
                        tab === t
                          ? 'bg-white/10 text-white'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                      style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
                    >
                      {t === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                  {tab === 'register' && (
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="text"
                        placeholder="الاسم الكامل"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className={inputClass}
                        style={{ fontFamily: 'Cairo, sans-serif', paddingRight: '2.5rem' }}
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="email"
                      placeholder="البريد الإلكتروني"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={inputClass}
                      style={{ fontFamily: 'Cairo, sans-serif', paddingRight: '2.5rem' }}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="كلمة المرور"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={inputClass}
                      style={{ fontFamily: 'Cairo, sans-serif', paddingRight: '2.5rem', paddingLeft: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm text-center" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                      boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                      fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                    }}
                  >
                    {isLoading ? 'جاري التحميل...' : tab === 'login' ? 'دخول' : 'إنشاء حساب'}
                  </button>
                </form>

                <p className="text-center text-white/20 text-sm mt-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  وضع تجريبي — لا يتم تخزين بيانات حقيقية
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)' }} />
    </div>
  );
}