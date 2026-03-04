import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/auth/get-auth-user-id";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const userId = await getAuthenticatedUserId();
  if (userId) {
    redirect("/shop");
  }

  return <LoginForm />;
}
