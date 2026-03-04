# صح ولا؟ - Production Web App (Next.js + Auth.js + Prisma + Postgres)

Self-hosted web app for the game with wallet credits, UPayments checkout, and secure server-side payment verification.

## Stack
- Next.js App Router (TypeScript)
- Auth.js (NextAuth v5) + Prisma Adapter
- Postgres + Prisma
- UPayments integration (charge + webhook + server-to-server status verification)

## Implemented Routes
- `POST /api/auth/register` (email/password signup)
- `POST /api/shop/create-checkout`
- `POST /api/webhooks/upayments`
- `POST /api/game/start`

## Auth Methods
- Google OAuth
- Apple OAuth stub (enabled when APPLE_* env vars are set)
- Email magic-link over SMTP (Nodemailer)
- Email + password (Credentials provider)

## Credits Model
- Product: `1.000 KWD => 5 credits`
- Wallet + ledger audit model
- Starting a game costs `1` credit
- Atomic game start transaction:
  - verify `balance >= 1`
  - decrement wallet
  - create ledger `-1`
  - create `GameSession`

## UPayments Security
- Webhook payload is stored as raw event data
- Optional signature verification via `UPAYMENTS_WEBHOOK_SECRET`
- Always verifies payment using UPayments `get-payment-status` before granting credits
- Idempotent webhook processing using `PaymentEvent.event_id` and transactional paid-state updates

## UPayments Sandbox / Test Mode
- Use `UPAYMENTS_MODE=sandbox` for testing (default behavior).
- Sandbox default base URL: `https://sandboxapi.upayments.com`
- Live default base URL: `https://api.upayments.com`
- You can override either with `UPAYMENTS_BASE_URL`.
- Checkout response includes `upayments_mode` so you can confirm current mode.

## Required Environment Variables
Copy `.env.example` to `.env` and set values.

## Local Run (Docker Compose)
1. `cp .env.example .env`
2. Update `.env` secrets and provider credentials.
3. Start services:
   - `docker compose up --build`
4. Run Prisma migration and seed inside app container:
   - `docker compose exec app npm run prisma:migrate -- --name init`
   - `docker compose exec app npm run prisma:seed`
5. Open `http://localhost:3000`
6. Demo credentials after seed:
   - Email: `demo@sahwala.local`
   - Password: `DemoPass123`

## Production Compose
1. Configure `.env` for production URLs/secrets.
2. Start:
   - `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`
3. App listens on port `3000`.

## Local Dev Without Docker
1. Ensure Postgres is running and `DATABASE_URL` is valid.
2. `npm install`
3. `npm run prisma:generate`
4. `npm run prisma:migrate -- --name init`
5. `npm run prisma:seed`
6. `npm run dev`
7. Demo credentials after seed:
   - Email: `demo@sahwala.local`
   - Password: `DemoPass123`

## Main UI Pages
- `/login` OAuth + magic-link + credentials
- `/shop` wallet balance + checkout (quantity + coupon UI wired to API)
- `/play` full host-only gameplay flow from Figma (board/question/winner/reveal)
- `/account` profile + credit ledger + sessions
- `/contact` contact form page
- `/reveal/[movie]` public QR reveal page for ولا كلمة
