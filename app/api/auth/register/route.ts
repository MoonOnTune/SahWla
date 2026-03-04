import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registerApiSchema } from "@/lib/validation/api";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerApiSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    await tx.creditWallet.create({
      data: {
        user_id: created.id,
        balance: 0,
      },
    });

    return created;
  });

  return NextResponse.json(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    { status: 201 },
  );
}
