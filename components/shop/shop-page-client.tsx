"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Sparkles,
  Check,
  Loader2,
  Minus,
  Plus,
  Tag,
  ArrowRight,
  Ticket,
  X,
  Coins,
  Play,
  Trash2,
} from "lucide-react";

const MOCK_COUPONS: Record<string, { discount: number; type: "percent" | "fixed"; label: string }> = {
  WELCOME10: { discount: 10, type: "percent", label: "خصم ١٠٪ — كود ترحيبي" },
  FREE1: { discount: 0.2, type: "fixed", label: "خصم لعبة واحدة مجاناً" },
  HALF: { discount: 50, type: "percent", label: "خصم ٥٠٪" },
};

type Props = {
  creditBalance: number;
  hasActiveSession: boolean;
  defaultProductId: string;
  unitPriceKwd: number;
};

export function ShopPageClient({ creditBalance, hasActiveSession, defaultProductId, unitPriceKwd }: Props) {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(hasActiveSession);
  const [showPurchase, setShowPurchase] = useState(false);
  const [quantity, setQuantity] = useState(5);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<null | {
    code: string;
    discount: number;
    type: "percent" | "fixed";
    label: string;
  }>(null);
  const [couponError, setCouponError] = useState("");
  const [buying, setBuying] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const subtotal = quantity * unitPriceKwd;
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? subtotal * (appliedCoupon.discount / 100)
      : Math.min(appliedCoupon.discount, subtotal)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  function handleApplyCoupon() {
    setCouponError("");
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) return;
    const found = MOCK_COUPONS[trimmed];
    if (found) {
      setAppliedCoupon({ code: trimmed, ...found });
      setCouponError("");
    } else {
      setCouponError("كود غير صالح");
      setAppliedCoupon(null);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  async function handleBuy() {
    setBuying(true);
    setCheckoutError("");

    const response = await fetch("/api/shop/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: defaultProductId,
        quantity,
        couponCode: appliedCoupon?.code,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      checkout_url?: string;
      error?: string;
      details?: string;
    };

    setBuying(false);

    if (!response.ok || !data.checkout_url) {
      const details = data.details ? ` (${data.details})` : "";
      setCheckoutError(`${data.error ?? "تعذر إنشاء رابط الدفع"}${details}`);
      return;
    }

    window.location.href = data.checkout_url;
  }

  async function handleCancelGame() {
    setCancelling(true);
    setCancelError("");

    const response = await fetch("/api/game/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setCancelling(false);

    if (!response.ok) {
      setCancelError(data.error ?? "تعذر إلغاء اللعبة الحالية");
      return;
    }

    localStorage.removeItem("sah_wala_game_state");
    setHasSession(false);
    router.refresh();
  }

  const cairoFont = { fontFamily: "Cairo, sans-serif" };

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)" }}
    >
      <div
        className="absolute top-10 right-10 w-72 h-72 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
      />
      <div
        className="absolute bottom-10 left-10 w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #d946ef, transparent)" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {showPurchase ? (
            <motion.div key="purchase" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => setShowPurchase(false)}
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl text-white" style={{ ...cairoFont, fontWeight: 900 }}>
                    إتمام الشراء
                  </h1>
                  <p className="text-white/40 text-sm" style={cairoFont}>
                    اختر عدد الألعاب وأدخل كود الخصم
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-6" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl text-white" style={{ ...cairoFont, fontWeight: 800 }}>
                    عدد الألعاب
                  </h2>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-6 h-6" />
                  </button>

                  <div className="text-center min-w-[100px]">
                    <motion.span
                      key={quantity}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-6xl text-white block"
                      style={{ ...cairoFont, fontWeight: 900, textShadow: "0 0 30px rgba(6,182,212,0.4)" }}
                    >
                      {quantity}
                    </motion.span>
                    <span className="text-white/40 text-sm" style={cairoFont}>
                      {quantity === 1 ? "لعبة" : quantity === 2 ? "لعبتين" : "ألعاب"}
                    </span>
                  </div>

                  <button
                    onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                    disabled={quantity >= 50}
                    className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {[1, 3, 5, 10, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuantity(n)}
                      className={`px-4 py-2 rounded-xl text-sm cursor-pointer transition-all active:scale-95 ${
                        quantity === n ? "text-white" : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/10"
                      }`}
                      style={{
                        ...cairoFont,
                        fontWeight: 700,
                        ...(quantity === n
                          ? {
                              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                              boxShadow: "0 0 15px rgba(6,182,212,0.3)",
                            }
                          : {}),
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-6" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h2 className="text-xl text-white" style={{ ...cairoFont, fontWeight: 800 }}>
                    كود الخصم
                  </h2>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <div>
                        <span className="text-green-400 text-sm block" style={{ ...cairoFont, fontWeight: 700 }}>
                          {appliedCoupon.code}
                        </span>
                        <span className="text-white/40 text-xs" style={cairoFont}>
                          {appliedCoupon.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/50 flex items-center justify-center cursor-pointer active:scale-90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-stretch gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="أدخل كود الخصم..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition-colors"
                      style={{ ...cairoFont, fontWeight: 600, direction: "ltr", textAlign: "left" }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-5 rounded-xl text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", ...cairoFont, fontWeight: 700 }}
                    >
                      تطبيق
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-red-400 text-sm mt-3" style={cairoFont}>
                    {couponError}
                  </p>
                )}

                <p className="text-white/20 text-xs mt-3" style={cairoFont}>
                  جرّب: WELCOME10 أو FREE1 أو HALF
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-8" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <h2 className="text-xl text-white mb-5" style={{ ...cairoFont, fontWeight: 800 }}>
                  ملخص الطلب
                </h2>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60" style={cairoFont}>
                      {quantity} {quantity === 1 ? "لعبة" : quantity === 2 ? "لعبتين" : "ألعاب"} × {unitPriceKwd.toFixed(3)} د.ك
                    </span>
                    <span className="text-white" style={{ ...cairoFont, fontWeight: 700 }}>
                      {subtotal.toFixed(3)} د.ك
                    </span>
                  </div>

                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-green-400/80 flex items-center gap-1.5" style={cairoFont}>
                        <Tag className="w-4 h-4" />
                        خصم ({appliedCoupon.code})
                      </span>
                      <span className="text-green-400" style={{ ...cairoFont, fontWeight: 700 }}>
                        - {discountAmount.toFixed(3)} د.ك
                      </span>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                    <span className="text-white text-lg" style={{ ...cairoFont, fontWeight: 800 }}>
                      المجموع
                    </span>
                    <span className="text-2xl" style={{ ...cairoFont, fontWeight: 900, color: "#06b6d4", textShadow: "0 0 20px rgba(6,182,212,0.3)" }}>
                      {total.toFixed(3)} د.ك
                    </span>
                  </div>
                </div>
              </div>

              {checkoutError && (
                <p className="text-center text-red-400 mb-4" style={cairoFont}>
                  {checkoutError}
                </p>
              )}

              <button
                onClick={handleBuy}
                disabled={buying}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                  boxShadow: "0 0 30px rgba(6,182,212,0.3)",
                  ...cairoFont,
                  fontWeight: 800,
                  fontSize: "1.2rem",
                }}
              >
                {buying ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    جاري تجهيز الدفع...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    اذهب إلى صفحة الدفع
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div key="landing" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl text-white mb-2" style={{ ...cairoFont, fontWeight: 900 }}>
                  المتجر
                </h1>
                <p className="text-white/50" style={cairoFont}>
                  اشترِ رصيد ألعاب وابدأ التحدي
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-6 text-center" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Coins className="w-7 h-7 text-yellow-400" />
                  <span className="text-white/60 text-lg" style={{ ...cairoFont, fontWeight: 700 }}>
                    رصيدك الحالي
                  </span>
                </div>
                <p className="text-6xl text-white" style={{ ...cairoFont, fontWeight: 900 }}>{creditBalance}</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-6" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl text-white" style={{ ...cairoFont, fontWeight: 800 }}>
                      رصيد ألعاب
                    </h2>
                    <p className="text-white/40" style={cairoFont}>
                      0.200 د.ك لكل لعبة
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPurchase(true)}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                    boxShadow: "0 0 30px rgba(6,182,212,0.3)",
                    ...cairoFont,
                    fontWeight: 800,
                    fontSize: "1.2rem",
                  }}
                >
                  <ShoppingCart className="w-6 h-6" />
                  شراء رصيد
                </button>
              </div>

              {hasSession ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => router.push("/play")}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 transition-all cursor-pointer"
                      style={{ ...cairoFont, fontWeight: 700 }}
                    >
                      <Play className="w-5 h-5" />
                      متابعة اللعبة الحالية
                    </button>
                    <button
                      onClick={handleCancelGame}
                      disabled={cancelling}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-300 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ ...cairoFont, fontWeight: 700 }}
                    >
                      {cancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      إلغاء اللعبة
                    </button>
                  </div>
                  {cancelError && (
                    <p className="text-red-400 text-sm mt-3 text-center" style={cairoFont}>
                      {cancelError}
                    </p>
                  )}
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)" }} />
    </div>
  );
}
