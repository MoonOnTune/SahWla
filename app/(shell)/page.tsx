import { HomePageClient } from "@/components/home/home-page-client";
import { getAuthenticatedUserId } from "@/lib/auth/get-auth-user-id";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const [wallet, activeSession] = await Promise.all([
    prisma.creditWallet.findUnique({ where: { user_id: userId }, select: { balance: true } }),
    prisma.gameSession.findFirst({
      where: { user_id: userId, status: "ACTIVE" },
      orderBy: { started_at: "desc" },
      select: { id: true },
    }),
  ]);

  return <HomePageClient creditBalance={wallet?.balance ?? 0} hasActiveSession={Boolean(activeSession)} />;
}
