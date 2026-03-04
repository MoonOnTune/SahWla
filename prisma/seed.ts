import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { sku: "PLAY_5_KWD_1" },
    update: {
      name: "5 Game Plays",
      description: "Buy 5 plays for 1.000 KWD",
      price_kwd: new Prisma.Decimal("1.000"),
      credit_amount: 5,
      active: true,
    },
    create: {
      sku: "PLAY_5_KWD_1",
      name: "5 Game Plays",
      description: "Buy 5 plays for 1.000 KWD",
      price_kwd: new Prisma.Decimal("1.000"),
      credit_amount: 5,
      active: true,
    },
  });

  const demoEmail = process.env.DEMO_USER_EMAIL ?? "demo@sahwala.local";
  const demoPassword = process.env.DEMO_USER_PASSWORD ?? "DemoPass123";
  const demoName = "Demo Player";
  const demoCredits = 20;
  const hashedPassword = await bcrypt.hash(demoPassword, 12);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      name: demoName,
      hashedPassword,
    },
    create: {
      name: demoName,
      email: demoEmail,
      hashedPassword,
      emailVerified: new Date(),
    },
  });

  const existingWallet = await prisma.creditWallet.findUnique({
    where: { user_id: demoUser.id },
  });

  if (!existingWallet) {
    await prisma.$transaction([
      prisma.creditWallet.create({
        data: {
          user_id: demoUser.id,
          balance: demoCredits,
        },
      }),
      prisma.creditLedger.create({
        data: {
          user_id: demoUser.id,
          delta: demoCredits,
          reason: "BONUS",
          ref_type: "SEED",
          ref_id: "DEMO_INITIAL_CREDITS_20",
        },
      }),
    ]);
  }

  console.log("Seed complete: default product and demo user are ready.");
  console.log(`Demo login => email: ${demoEmail} | password: ${demoPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
