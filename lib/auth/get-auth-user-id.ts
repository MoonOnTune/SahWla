import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();

  const sessionUserId = session?.user?.id;
  if (sessionUserId) {
    return sessionUserId;
  }

  const email = session?.user?.email;
  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}
