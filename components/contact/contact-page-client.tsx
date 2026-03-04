"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Send, MessageCircle, Mail, User, FileText, Check, Loader2, Instagram, MessageSquare } from "lucide-react";

export function ContactPageClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = name.trim() && email.trim() && message.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSending(false);
    setSent(true);
  }

  function handleReset() {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setSent(false);
  }

  const cairoFont = { fontFamily: "Cairo, sans-serif" };

  const socials = [
    { icon: Instagram, label: "@sahwala.kw", href: "#", color: "#e1306c" },
    { icon: MessageSquare, label: "واتساب", href: "#", color: "#25d366" },
    { icon: Mail, label: "info@sahwala.kw", href: "#", color: "#06b6d4" },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)" }}
    >
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #d946ef, transparent)" }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl text-white mb-2" style={{ ...cairoFont, fontWeight: 900 }}>
            تواصل معنا
          </h1>
          <p className="text-white/50" style={cairoFont}>
            عندك سؤال أو اقتراح؟ نحب نسمع منك!
          </p>
        </motion.div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 40px rgba(16,185,129,0.3)" }}>
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl text-white mb-3" style={{ ...cairoFont, fontWeight: 800 }}>
              تم إرسال رسالتك!
            </h2>
            <p className="text-white/50 mb-8" style={cairoFont}>
              شكراً لتواصلك معنا، راح نرد عليك في أقرب وقت.
            </p>
            <button
              onClick={handleReset}
              className="px-8 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                boxShadow: "0 0 20px rgba(6,182,212,0.3)",
                ...cairoFont,
                fontWeight: 700,
              }}
            >
              إرسال رسالة أخرى
            </button>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-8"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl text-white" style={{ ...cairoFont, fontWeight: 800 }}>
                أرسل لنا رسالة
              </h2>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-white/50 text-sm mb-1.5 block flex items-center gap-1.5" style={{ ...cairoFont, fontWeight: 600 }}>
                  <User className="w-3.5 h-3.5" />
                  الاسم <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك الكريم..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-cyan-500/50 transition-colors"
                  style={{ ...cairoFont, fontWeight: 600 }}
                />
              </div>

              <div>
                <label className="text-white/50 text-sm mb-1.5 block flex items-center gap-1.5" style={{ ...cairoFont, fontWeight: 600 }}>
                  <Mail className="w-3.5 h-3.5" />
                  البريد الإلكتروني <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-cyan-500/50 transition-colors"
                  style={{ ...cairoFont, fontWeight: 600, direction: "ltr", textAlign: "left" }}
                />
              </div>

              <div>
                <label className="text-white/50 text-sm mb-1.5 block flex items-center gap-1.5" style={{ ...cairoFont, fontWeight: 600 }}>
                  <FileText className="w-3.5 h-3.5" />
                  الموضوع
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                  style={{ ...cairoFont, fontWeight: 600 }}
                >
                  <option value="" style={{ background: "#1a1a4e" }}>اختر الموضوع...</option>
                  <option value="general" style={{ background: "#1a1a4e" }}>استفسار عام</option>
                  <option value="bug" style={{ background: "#1a1a4e" }}>مشكلة تقنية</option>
                  <option value="suggestion" style={{ background: "#1a1a4e" }}>اقتراح أو فكرة</option>
                  <option value="payment" style={{ background: "#1a1a4e" }}>مشكلة في الدفع</option>
                  <option value="other" style={{ background: "#1a1a4e" }}>أخرى</option>
                </select>
              </div>

              <div>
                <label className="text-white/50 text-sm mb-1.5 block flex items-center gap-1.5" style={{ ...cairoFont, fontWeight: 600 }}>
                  <MessageCircle className="w-3.5 h-3.5" />
                  الرسالة <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  style={{ ...cairoFont, fontWeight: 600 }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSend || sending}
              className="w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: canSend ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "rgba(255,255,255,0.1)",
                boxShadow: canSend ? "0 0 25px rgba(6,182,212,0.3)" : "none",
                ...cairoFont,
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  إرسال
                </>
              )}
            </button>
          </motion.form>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 transition-all group cursor-pointer"
              style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: `${social.color}20` }}>
                <social.icon className="w-5 h-5" style={{ color: social.color }} />
              </div>
              <span className="text-white/60 text-sm group-hover:text-white/80 transition-colors" style={{ ...cairoFont, fontWeight: 600 }}>
                {social.label}
              </span>
            </a>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)" }} />
    </div>
  );
}
