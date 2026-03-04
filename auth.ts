import NextAuth, { type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { credentialsLoginSchema } from "@/lib/auth/schemas";
import { verifyPassword } from "@/lib/auth/password";

type SessionUser = DefaultSession["user"] & { id: string };
const devFallbackSecret = "dev-only-insecure-auth-secret-change-me";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  devFallbackSecret;

if (authSecret === devFallbackSecret) {
  console.warn(
    "[auth] Using fallback secret. Set AUTH_SECRET in .env for stable and secure sessions.",
  );
}

const providers: Provider[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
  Nodemailer({
    id: "email",
    server: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      secure: process.env.SMTP_SECURE === "true",
    },
    from: process.env.SMTP_FROM,
  }),
  Credentials({
    name: "Email + Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(rawCredentials) {
      const parsed = credentialsLoginSchema.safeParse(rawCredentials);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (!user?.hashedPassword) return null;

      const isValid = await verifyPassword(parsed.data.password, user.hashedPassword);
      if (!isValid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

// Apple provider stub: set APPLE_* env vars to enable Apple OAuth.
if (
  process.env.APPLE_ID &&
  process.env.APPLE_CLIENT_SECRET
) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async signIn({ user }) {
      if (!user.id) return true;
      await prisma.creditWallet.upsert({
        where: { user_id: user.id },
        create: { user_id: user.id, balance: 0 },
        update: {},
      });
      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        (session.user as SessionUser).id =
          user?.id ?? token?.id ?? token?.sub ?? (session.user as SessionUser).id;
      }
      return session;
    },
  },
});
