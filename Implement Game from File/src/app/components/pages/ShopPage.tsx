import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router';
import {
  ShoppingCart, Sparkles, Check, Loader2,
  Minus, Plus, Tag, ArrowRight, Ticket, X,
} from 'lucide-react';

const PRICE_PER_GAME = 0.200; // KWD per game

const MOCK_COUPONS: Record<string, { discount: number; type: 'percent' | 'fixed'; label: string }> = {
  'WELCOME10': { discount: 10, type: 'percent', label: 'خصم ١٠٪ — كود ترحيبي' },
  'FREE1': { discount: 0.200, type: 'fixed', label: 'خصم لعبة واحدة مجاناً' },
  'HALF': { discount: 50, type: 'percent', label: 'خصم ٥٠٪' },
};

export function ShopPage() {
  const { buyCredits, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [user, isLoading, navigate]);

  // Purchase page state
  const [showPurchase, setShowPurchase] = useState(false);
  const [quantity, setQuantity] = useState(5);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<null | { code: string; discount: number; type: 'percent' | 'fixed'; label: string }>(null);
  const [couponError, setCouponError] = useState('');
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);

  const subtotal = quantity * PRICE_PER_GAME;
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? subtotal * (appliedCoupon.discount / 100)
      : Math.min(appliedCoupon.discount, subtotal)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = () => {
    setCouponError('');
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) return;
    const found = MOCK_COUPONS[trimmed];
    if (found) {
      setAppliedCoupon({ code: trimmed, ...found });
      setCouponError('');
    } else {
      setCouponError('كود غير صالح');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleBuy = async () => {
    setBuying(true);
    setBought(false);
    const result = await buyCredits(quantity);
    setBuying(false);
    if (result.success) {
      setBought(true);
      setTimeout(() => {
        setBought(false);
        setShowPurchase(false);
        setQuantity(5);
        setAppliedCoupon(null);
        setCouponCode('');
      }, 2000);
    }
  };

  const handleOpenPurchase = () => {
    setShowPurchase(true);
    setBought(false);
    setCouponError('');
  };

  const cairoFont = { fontFamily: 'Cairo, sans-serif' };

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 30%, #0a1a3e 70%, #0a0a2e 100%)' }}>

      {/* Decorative orbs */}
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">

        <AnimatePresence mode="wait">
          {showPurchase ? (
            /* ─── Purchase Page ─── */
            <motion.div
              key="purchase"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back button + Header */}
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

              {/* Quantity Selector Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-6"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl text-white" style={{ ...cairoFont, fontWeight: 800 }}>
                    عدد الألعاب
                  </h2>
                </div>

                {/* Quantity control */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
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
                      style={{ ...cairoFont, fontWeight: 900, textShadow: '0 0 30px rgba(6,182,212,0.4)' }}
                    >
                      {quantity}
                    </motion.span>
                    <span className="text-white/40 text-sm" style={cairoFont}>
                      {quantity === 1 ? 'لعبة' : quantity === 2 ? 'لعبتين' : 'ألعاب'}
                    </span>
                  </div>

                  <button
                    onClick={() => setQuantity(q => Math.min(50, q + 1))}
                    disabled={quantity >= 50}
                    className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Quick select buttons */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {[1, 3, 5, 10, 20].map(n => (
                    <button
                      key={n}
                      onClick={() => setQuantity(n)}
                      className={`px-4 py-2 rounded-xl text-sm cursor-pointer transition-all active:scale-95 ${
                        quantity === n
                          ? 'text-white'
                          : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'
                      }`}
                      style={{
                        ...cairoFont,
                        fontWeight: 700,
                        ...(quantity === n ? {
                          background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                          boxShadow: '0 0 15px rgba(6,182,212,0.3)',
                        } : {}),
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coupon Code Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-6"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

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
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="أدخل كود الخصم..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition-colors"
                      style={{ ...cairoFont, fontWeight: 600, direction: 'ltr', textAlign: 'left' }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-5 rounded-xl text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        ...cairoFont,
                        fontWeight: 700,
                      }}
                    >
                      تطبيق
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-red-400 text-sm mt-3" style={cairoFont}>{couponError}</p>
                )}

                <p className="text-white/20 text-xs mt-3" style={cairoFont}>
                  جرّب: WELCOME10 أو FREE1 أو HALF
                </p>
              </div>

              {/* Order Summary Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-8"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

                <h2 className="text-xl text-white mb-5" style={{ ...cairoFont, fontWeight: 800 }}>
                  ملخص الطلب
                </h2>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60" style={cairoFont}>
                      {quantity} {quantity === 1 ? 'لعبة' : quantity === 2 ? 'لعبتين' : 'ألعاب'} × {PRICE_PER_GAME.toFixed(3)} د.ك
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
                    <span className="text-2xl" style={{
                      ...cairoFont, fontWeight: 900,
                      color: '#06b6d4',
                      textShadow: '0 0 20px rgba(6,182,212,0.3)',
                    }}>
                      {total.toFixed(3)} د.ك
                    </span>
                  </div>
                </div>
              </div>

              {/* Buy Button */}
              <button
                onClick={handleBuy}
                disabled={buying || bought}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: bought
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  boxShadow: bought
                    ? '0 0 30px rgba(16, 185, 129, 0.3), 0 10px 40px rgba(0,0,0,0.3)'
                    : '0 0 30px rgba(6, 182, 212, 0.3), 0 10px 40px rgba(0,0,0,0.3)',
                  ...cairoFont, fontWeight: 700, fontSize: '1.2rem',
                }}
              >
                {buying ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    جاري الدفع...
                  </>
                ) : bought ? (
                  <>
                    <Check className="w-6 h-6" />
                    تم الشراء بنجاح!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    ادفع {total.toFixed(3)} د.ك
                  </>
                )}
              </button>

              <p className="text-white/20 text-sm mt-4 text-center" style={cairoFont}>
                وضع تجريبي — لا يتم خصم مبالغ حقيقية (يُحاكي بوابة UPayments)
              </p>
            </motion.div>
          ) : (
            /* ─── Main Shop Page ─── */
            <motion.div
              key="shop"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
              >
                <h1 className="text-4xl md:text-5xl text-white mb-2" style={{ ...cairoFont, fontWeight: 900 }}>
                  المتجر
                </h1>
                <p className="text-white/50" style={cairoFont}>
                  اشترِ رصيداً وابدأ اللعب
                </p>
              </motion.div>

              {/* Product Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
              >
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Product icon */}
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                      boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
                    }}>
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>

                  <div className="flex-1 text-center md:text-right">
                    <h3 className="text-2xl text-white mb-1" style={{ ...cairoFont, fontWeight: 800 }}>
                      رصيد ألعاب
                    </h3>
                    <p className="text-white/50 mb-3" style={cairoFont}>
                      جلسات لعب كاملة لك ولأصدقائك — اختر الكمية اللي تناسبك
                    </p>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <span className="text-3xl text-cyan-400" style={{ ...cairoFont, fontWeight: 900 }}>
                        {PRICE_PER_GAME.toFixed(3)}
                      </span>
                      <span className="text-white/50 text-lg" style={{ ...cairoFont, fontWeight: 600 }}>
                        د.ك / لعبة
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={handleOpenPurchase}
                      className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                        boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
                        ...cairoFont, fontWeight: 700, fontSize: '1.1rem',
                      }}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      شراء
                    </button>
                  </div>
                </div>

                <p className="text-white/20 text-sm mt-6 text-center" style={cairoFont}>
                  وضع تجريبي — لا يتم خصم مبالغ حقيقية (يُحاكي بوابة UPayments)
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)' }} />
    </div>
  );
}
