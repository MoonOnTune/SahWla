"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from "lucide-react";

type Tab = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleOAuth(provider: "google" | "apple") {
    setError("");
    setMessage("");
    await signIn(provider, { callbackUrl: "/shop" });
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }

    setIsLoading(true);

    if (tab === "register") {
      if (!name) {
        setIsLoading(false);
        setError("يرجى إدخال الاسم");
        return;
      }

      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const registerData = (await registerResponse.json().catch(() => ({}))) as { error?: string };
      if (!registerResponse.ok) {
        setIsLoading(false);
        setError(registerData.error ?? "فشل إنشاء الحساب");
        return;
      }

      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/shop",
      });

      setIsLoading(false);

      if (login?.error) {
        setMessage("تم إنشاء الحساب. سجّل الدخول الآن.");
        setTab("login");
        return;
      }

      router.replace("/shop");
      router.refresh();
      return;
    }

    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/shop",
    });

    setIsLoading(false);

    if (login?.error) {
      setError("تعذّر تسجيل الدخول. تحقّق من البريد وكلمة المرور.");
      return;
    }

    router.replace("/shop");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/shop",
    });

    setIsLoading(false);

    if (result?.error) {
      setError("تعذر إرسال الرابط. تحقّق من إعدادات البريد.");
      return;
    }

    setMagicLinkSent(true);
    setMessage("تم إرسال رابط الدخول إلى بريدك الإلكتروني.");
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all";

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)" }}
    >
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #d946ef, transparent)" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }} className="inline-block mb-3">
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </motion.div>
          <h1 className="text-4xl text-white" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900 }}>
            صح ولا؟
          </h1>
          <p className="text-white/50 mt-1" style={{ fontFamily: "Cairo, sans-serif" }}>
            سجّل دخولك للبدء
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <AnimatePresence mode="wait">
            {showMagicLink ? (
              <motion.div key="magic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button
                  onClick={() => {
                    setShowMagicLink(false);
                    setMagicLinkSent(false);
                    setError("");
                    setMessage("");
                  }}
                  className="flex items-center gap-1 text-white/50 hover:text-white mb-6 cursor-pointer"
                  style={{ fontFamily: "Cairo, sans-serif" }}
                >
                  <ArrowRight className="w-4 h-4" />
                  رجوع
                </button>

                {magicLinkSent ? (
                  <div className="text-center py-8">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </motion.div>
                    <p className="text-white text-lg" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
                      تم إرسال الرابط!
                    </p>
                    <p className="text-white/50 mt-2" style={{ fontFamily: "Cairo, sans-serif" }}>
                      تحقق من بريدك الإلكتروني {email}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
                    <h3 className="text-xl text-white mb-2" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
                      تسجيل بالرابط السحري
                    </h3>
                    <p className="text-white/40 text-sm mb-2" style={{ fontFamily: "Cairo, sans-serif" }}>
                      سنرسل لك رابطاً للدخول بدون كلمة مرور
                    </p>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        style={{ fontFamily: "Cairo, sans-serif", paddingRight: "2.5rem" }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                        boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {isLoading ? "جاري الإرسال..." : "إرسال الرابط"}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={() => handleOAuth("google")}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{ fontFamily: "Cairo, sans-serif", fontWeight: 600 }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    الدخول بحساب Google
                  </button>

                  <button
                    onClick={() => handleOAuth("apple")}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{ fontFamily: "Cairo, sans-serif", fontWeight: 600 }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    الدخول بحساب Apple
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-sm" style={{ fontFamily: "Cairo, sans-serif" }}>أو</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  onClick={() => setShowMagicLink(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white/70 hover:text-white transition-all mb-6 cursor-pointer"
                  style={{ fontFamily: "Cairo, sans-serif", fontWeight: 600 }}
                >
                  <Mail className="w-4 h-4" />
                  دخول برابط سحري عبر البريد
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-sm" style={{ fontFamily: "Cairo, sans-serif" }}>أو بالبريد وكلمة المرور</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="flex mb-6 bg-white/5 rounded-xl p-1">
                  {(["login", "register"] as Tab[]).map((currentTab) => (
                    <button
                      key={currentTab}
                      onClick={() => {
                        setTab(currentTab);
                        setError("");
                        setMessage("");
                      }}
                      className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
                        tab === currentTab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                      }`}
                      style={{ fontFamily: "Cairo, sans-serif", fontWeight: 600 }}
                    >
                      {currentTab === "login" ? "تسجيل الدخول" : "حساب جديد"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                  {tab === "register" && (
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="text"
                        placeholder="الاسم الكامل"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        style={{ fontFamily: "Cairo, sans-serif", paddingRight: "2.5rem" }}
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="email"
                      placeholder="البريد الإلكتروني"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      style={{ fontFamily: "Cairo, sans-serif", paddingRight: "2.5rem", direction: "ltr", textAlign: "left" }}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      style={{ fontFamily: "Cairo, sans-serif", paddingRight: "2.5rem", paddingLeft: "2.5rem", direction: "ltr", textAlign: "left" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 mt-2"
                    style={{
                      background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                      boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
                      fontFamily: "Cairo, sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {isLoading ? "جاري المعالجة..." : tab === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-red-400 text-sm mt-4 text-center" style={{ fontFamily: "Cairo, sans-serif" }}>
              {error}
            </p>
          )}

          {message && (
            <p className="text-emerald-400 text-sm mt-4 text-center" style={{ fontFamily: "Cairo, sans-serif" }}>
              {message}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
