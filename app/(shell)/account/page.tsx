import { redirect } from "next/navigation";
import { AccountPageClient } from "@/components/account/account-page-client";
import { getAuthenticatedUserId } from "@/lib/auth/get-auth-user-id";
import { prisma } from "@/lib/db";

export default async function AccountPage() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const [user, wallet, ledger, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, created_at: true, accounts: { select: { provider: true }, take: 1 } },
    }),
    prisma.creditWallet.findUnique({ where: { user_id: userId }, select: { balance: true } }),
    prisma.creditLedger.findMany({ where: { user_id: userId }, orderBy: { created_at: "desc" }, take: 50 }),
    prisma.gameSession.findMany({ where: { user_id: userId }, orderBy: { started_at: "desc" }, take: 10 }),
  ]);

  const serializedUser = user
    ? {
        ...user,
        created_at: user.created_at.toISOString(),
      }
    : null;

  const serializedLedger = ledger.map((entry) => ({
    id: entry.id,
    delta: entry.delta,
    reason: entry.reason,
    created_at: entry.created_at.toISOString(),
  }));

  const serializedSessions = sessions.map((session) => ({
    id: session.id,
    status: session.status,
    started_at: session.started_at.toISOString(),
  }));

  return (
    <AccountPageClient
      user={serializedUser}
      creditBalance={wallet?.balance ?? 0}
      ledger={serializedLedger}
      sessions={serializedSessions}
    />
  );
}
