import { redirect } from "next/navigation";
import { ShopPageClient } from "@/components/shop/shop-page-client";
import { getAuthenticatedUserId } from "@/lib/auth/get-auth-user-id";
import { prisma } from "@/lib/db";

export default async function ShopPage() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const [wallet, product, activeSession] = await Promise.all([
    prisma.creditWallet.findUnique({ where: { user_id: userId }, select: { balance: true } }),
    prisma.product.findFirst({ where: { sku: "PLAY_5_KWD_1", active: true } }),
    prisma.gameSession.findFirst({
      where: { user_id: userId, status: "ACTIVE" },
      orderBy: { started_at: "desc" },
      select: { id: true },
    }),
  ]);

  if (!product) {
    return <div className="p-8 text-white">المنتج الافتراضي غير موجود. شغّل البذور أولاً.</div>;
  }

  return (
    <ShopPageClient
      creditBalance={wallet?.balance ?? 0}
      hasActiveSession={Boolean(activeSession)}
      defaultProductId={product.id}
      unitPriceKwd={Number(product.price_kwd) / product.credit_amount}
    />
  );
}
