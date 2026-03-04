You are a senior full-stack engineer.

Core requirements:
- Framework: Next.js 14/15 App Router (TypeScript).
- Auth: Auth.js (NextAuth v5) using Prisma adapter and Postgres.
- Login methods MUST include:
  1) OAuth (Google; include Apple provider stub with TODO env vars)
  2) Email magic-link (Email provider using SMTP via nodemailer)
  3) Email + password (Credentials provider)
- Database: Postgres + Prisma.
- Payments: integrate UPayments.
  - Checkout creation calls UPayments charge endpoint and stores returned track_id and payment URL.
  - A webhook endpoint receives payment notifications.
  - On webhook, ALWAYS verify the payment server-to-server using UPayments Get Payment Status (track_id) before granting credits.
  - Must implement idempotency so webhook retries do not grant credits twice.
- Credits-only business model:
  - Product: 1.000 KWD buys 5 game plays.
  - Use a credit wallet + credit ledger model (do not store only a single number with no audit trail).
  - Starting a game costs 1 credit and requires internet at the start.
  - Gameplay itself is host-only in the browser (no team controllers, no websockets needed).
- “Start Game” API must atomically:
  - verify wallet balance >= 1
  - insert a ledger entry -1
  - decrement wallet balance
  - create a game_session record
  - return game_session_id

Implementation details:
- Provide Docker Compose for local/prod: nextjs app + postgres.
- Provide env.example listing all required env vars.
- Use strict input validation (zod) for API routes.
- Use server actions or API routes (App Router route handlers) for:
  - POST /api/shop/create-checkout
  - POST /api/webhooks/upayments
  - POST /api/game/start
  - POST /api/auth/register (for email+password signup)
- UI pages:
  - /login (OAuth buttons + email magic link + email/password)
  - /shop (shows credits balance + “Buy 5 plays for 1 KWD” button)
  - /play (host-only game board UI placeholder; user must have a game_session)
  - /account (profile + credit history)
- Security:
  - verify webhook signature if UPayments supports it; if not documented, at least verify payment status via server-to-server call and store raw payload.
  - Do NOT trust client redirects for payment.
  - Protect API routes using Auth.js session.
- Prisma schema must include:
  - Auth.js tables: User, Account, Session, VerificationToken
  - Product
  - PaymentOrder (provider, track_id, status, amount_kwd, product_id, user_id, paid_at)
  - PaymentEvent (provider, event_id unique or computed hash, payload json, processed_at)
  - CreditWallet (user_id unique, balance int)
  - CreditLedger (user_id, delta int, reason enum/string, ref_type, ref_id, created_at)
  - GameSession (user_id, status, started_at, ended_at, metadata json)
- Add seed script to create the default Product (5 plays for 1.000 KWD).

Output:
- Create the full folder structure.
- Provide all code files (not pseudocode).
- Provide step-by-step run instructions (docker compose up, prisma migrate, seed).
- Ensure code compiles.