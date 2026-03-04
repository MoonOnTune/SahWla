import Link from "next/link";
import { Home, ShoppingCart, User, Sparkles, LogOut, Gamepad2, MessageCircle } from "lucide-react";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/auth/get-auth-user-id";

export async function TopNavShell() {
  const session = await auth();
  const userId = await getAuthenticatedUserId();

  let creditBalance = 0;
  if (userId) {
    const wallet = await prisma.creditWallet.findUnique({
      where: { user_id: userId },
      select: { balance: true },
    });
    creditBalance = wallet?.balance ?? 0;
  }

  const navItems = [
    { path: "/", label: "الرئيسية", icon: Home },
    { path: "/shop", label: "المتجر", icon: ShoppingCart },
    { path: "/account", label: "حسابي", icon: User },
    { path: "/contact", label: "تواصل معنا", icon: MessageCircle },
  ];

  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-50 border-b border-white/5"
      style={{ background: "rgba(10, 10, 46, 0.95)", backdropFilter: "blur(20px)" }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 cursor-pointer group">
          <Sparkles className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="text-xl text-white" style={{ fontWeight: 900, fontFamily: "Cairo, sans-serif" }}>
            صح ولا؟
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
              style={{ fontWeight: 600, fontFamily: "Cairo, sans-serif" }}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {userId ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                <Gamepad2 className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm" style={{ fontWeight: 700, fontFamily: "Cairo, sans-serif" }}>
                  {creditBalance}
                </span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href={session?.user ? "/" : "/login"}
              className="px-4 py-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-sm"
              style={{ fontWeight: 600, fontFamily: "Cairo, sans-serif" }}
            >
              دخول
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
