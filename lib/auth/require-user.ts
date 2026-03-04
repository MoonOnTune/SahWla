import { getAuthenticatedUserId } from "@/lib/auth/get-auth-user-id";

export async function requireUserId(): Promise<string | null> {
  return getAuthenticatedUserId();
}
