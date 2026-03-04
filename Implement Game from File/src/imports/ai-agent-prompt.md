# AI Coding Agent Prompt: "صح ولا؟" Jeopardy Quiz Game

Build an Arabic-only Jeopardy-style quiz game web app called **"صح ولا؟"** using React (Vite), Tailwind CSS v4, and React Router. The entire app is RTL Arabic using the **Cairo** Google Font (weights 400-900). Use the attached Figma code as the visual reference for all screens.

## Tech Stack & Setup
- **React 18+ with TypeScript** (Vite)
- **Tailwind CSS v4** (utility classes, no `tailwind.config.js`)
- **React Router** (use `react-router` package, NOT `react-router-dom`) with `createBrowserRouter` + `RouterProvider`
- **Motion** (`motion/react`) for animations
- **lucide-react** for icons
- Cairo font imported via Google Fonts

## Design Theme
Dark game-show aesthetic throughout all screens:
- Background: dark navy gradients (`#0a0a2e`, `#1a0a3e`, `#0a1a3e`)
- Team A color: **cyan** (`#06b6d4`), Team B color: **magenta** (`#d946ef`)
- Accent colors: yellow/gold (`#fbbf24`) for credits/rewards, emerald for success, purple gradients for CTAs
- Cards/panels: `bg-white/5` with `backdrop-blur-xl`, `border border-white/10`, rounded-3xl, with subtle box-shadows
- Buttons: gradient backgrounds with glow box-shadows, `hover:scale-105 active:scale-95` interactions
- All text uses inline `style={{ fontFamily: 'Cairo, sans-serif' }}` with explicit `fontWeight` values
- Bottom gradient accent line on key pages: `linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #fbbf24)`

## App Architecture

### Entry Point (`App.tsx`):
- Wraps everything in `<AuthProvider>` then `<RouterProvider>`
- Special QR hash routing: if URL has `#/reveal/{encodedMovieName}`, render `<RevealPage>` instead of the router (for the "ولا كلمة" Taboo-style mobile reveal)

### Routes (via `AppLayout` parent):
| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | HomePage | Yes |
| `/login` | LoginPage | No |
| `/shop` | ShopPage | Yes |
| `/account` | AccountPage | Yes |
| `/play` | PlayPage | Yes (+ active session) |
| `/contact` | ContactPage | No |

### `AppLayout`
Sticky top nav bar (hidden on `/login` and `/play`):
- Logo "صح ولا؟" with sparkle icon (links to `/`)
- 4 nav tabs: الرئيسية, المتجر, حسابي, تواصل معنا
- Right side: credit badge (yellow gamepad icon + count), logout button
- All protected pages have `isLoading` guard to prevent flash-redirects during localStorage hydration

---

## Auth System (`AuthContext.tsx`)

Full mock service layer simulating a backend (ready to be replaced with real API routes later):

### State:
`user`, `isLoading`, `creditBalance`, `creditHistory` (ledger entries), `gameSessions`, `activeSession`

### Persisted to localStorage:
user object, active session, credit balance

### Mock Methods:
- `login(method, email?)` - simulates OAuth (Google/Apple) or email login, returns mock user
- `register(name, email, password)` - creates mock user with 0 credits
- `sendMagicLink(email)` - simulates email magic link
- `logout()` - clears user and session from state + localStorage
- `buyCredits(quantity)` - adds credits, creates ledger entry
- `startGame()` - checks credit >= 1, deducts 1 credit, creates active session
- `endGame(sessionId)` - marks session as completed, clears active session

### Data Types:
```typescript
User { id, name, email, image?, provider: 'google'|'apple'|'email'|'credentials', createdAt }
CreditLedgerEntry { id, delta, reason: 'purchase'|'game_start'|'refund'|'bonus', reasonLabel, refType?, refId?, createdAt }
GameSession { id, status: 'active'|'completed'|'cancelled', startedAt, endedAt? }
```

---

## Pages

### LoginPage (`/login`):
- Login/Register tabs
- Google & Apple OAuth buttons (mock)
- Email + password form
- Magic link option
- Redirects to `/` on success

### HomePage (`/`):
- Large credit balance display card ("رصيدك الحالي") with animated count
- "ابدأ لعبة جديدة" button (disabled if 0 credits, shows "اشترِ رصيداً" link)
- "متابعة اللعبة" button if `activeSession` exists (green, navigates to `/play`)
- Confirmation modal before starting: warns about 1-credit deduction, shows before/after balance

### ShopPage (`/shop`):
- "رصيد ألعاب" product card (0.200 KWD per game)
- Click opens purchase flow with: quantity selector (plus/minus), subtotal display
- Coupon code input with validation (mock coupons: WELCOME10, FREE1, HALF)
- Checkout button then simulated purchase then success state

### AccountPage (`/account`):
- User profile card (name, email, provider, join date)
- Credit balance display
- Credit ledger history (color-coded: green for positive, red for negative)
- Game session history with status badges
- Logout button

### ContactPage (`/contact`):
- Form: name, email, subject dropdown (استفسار عام, مشكلة تقنية, اقتراح أو فكرة, مشكلة في الدفع, أخرى), message textarea
- Simulated send with loading then success state
- Social contact cards (Instagram, WhatsApp, email) at bottom

---

## Game System (`GameContext.tsx`)

React context managing all game state with **full localStorage persistence** (key: `sah_wala_game_state`).

### State:
```typescript
Screen = 'welcome' | 'categories' | 'teams' | 'board' | 'question' | 'walakalma' | 'winner'
QuestionPhase = 'showing' | 'timerA' | 'timerB' | 'answer'
Team { name, nameAr, score, playerCount, playerNames: string[], color, colorLight }
Category { name, questions: Question[], type?: 'normal' | 'walakalma' }
Question { question, answer, value: 200|400|600 }
```

### Default teams:
Team A (cyan `#06b6d4`), Team B (magenta `#d946ef`)

### Persistence rules:
- Save state on every change to localStorage
- On restore: if saved state was mid-question/walakalma, snap back to board
- Winner screen clears saved state
- `resetGame()` clears everything, goes to categories
- `rematch()` keeps categories but resets scores/tiles, stays in same session

### 23 preset Arabic categories (22 normal + 1 "ولا كلمة"):
القرآن الكريم, السيرة النبوية, الكويت والخليج, اللهجة الكويتية, الأكل الكويتي, عواصم ودول, معالم شهيرة, أفلام ومسلسلات, الرياضة والبطولات, الموسيقى والفنانون, محطات تاريخية, العلوم, التقنية والإنترنت, علامات تجارية, الحيوانات والطبيعة, أطعمة من حول العالم, اللغة والكلمات, الأساطير والفلكلور, ألغاز ومنطق, خمن الشخصية, اقتباسات وأمثال, السيارات والمحركات, **ولا كلمة** (type: 'walakalma')

Each category has **6 questions**: two at 200pts, two at 400pts, two at 600pts.

Each category has a **custom SVG icon** component in `CategoryIcons.tsx` - create unique SVG icons for each category (e.g., Kuwait towers for الكويت والخليج, speech bubbles for اللهجة الكويتية, etc.). Export a `getCategoryIcon(categoryName, className?)` lookup function.

---

## Game Screens (all inside PlayPage -> GameProvider)

### PlayPage (`/play`):
- Requires auth + active session; shows "no active session" message with link to shop if missing
- Wraps game in `<GameProvider initialScreen="categories">`
- `<GameScreens>` switches between screens with AnimatePresence transitions
- WinnerScreen's "لعبة جديدة" calls `endGame()` on the auth session and navigates to `/`

### 1. CategorySetup - "اختر 6 فئات"
- Grid of all 23 categories (responsive: 2 then 3 then 4 then 5 columns)
- Each card shows SVG icon + name, highlighted with cyan border when selected
- Max 6 selections, counter shows progress
- "التالي" button enabled at exactly 6

### 2. TeamSetup - "إعداد الفرق"
- Two team cards side by side (team color-themed borders/backgrounds)
- Each has: name input, player count stepper (1-10)
- **Collapsible "قسم الفريق" section:** textarea for player names (one per line), "وزّع اللاعبين" button randomly distributes players into 2 teams evenly, shows animated name tags under each team card, auto-updates player counts. Can re-shuffle or clear.
- "ابدأ الجولة" button

### 3. GameBoard - 6x6 grid
- Top bar: Team A score (left, with glow when active turn) | "تعديل النقاط" button + turn indicator | Team B score (right)
- Grid: category headers on top (with icon + name), 6 rows of value tiles below
- Tiles color-coded: 200=emerald, 400=blue, 600=purple; used tiles greyed with checkmark
- Clicking a tile: if category is "ولا كلمة" then walakalma screen, else then question screen
- When all tiles used then auto-navigate to winner screen
- **"تعديل النقاط" modal:** per-team plus/minus 100 adjusters showing current score, adjustment, and preview of new score

### 4. QuestionView
- Top bar: back button (with confirmation modal), both team scores
- Category badge + value badge
- Large question text panel
- **Timer flow:** starts on Team A's timer (60s) then can skip to Team B (30s) then show answer
- Timer component: circular progress ring, countdown display, "+10 ثوانٍ" button to ADD time
- On timer expire: red "انتهى الوقت!" with options to start other team's timer or show answer
- **Answer phase:** green answer panel + "من أجاب بشكل صحيح؟" with 3 buttons: Team A صحيح, Team B صحيح, لا أحد
- Choosing winner immediately awards points, marks tile used, alternates turn, returns to board

### 5. WalaKalmaView (Taboo-style)
- **QR Phase:** generates QR code pointing to `{origin}#/reveal/{encodedMovieName}` using `api.qrserver.com`
- Instructions: one player scans QR on phone to see movie name, acts it out without words
- "ابدأ وقت [team]" button starts 120s timer
- **Timer phases** (A then B): same skip/choose-winner flow as QuestionView but with 120s timers
- **Choose winner phase:** reveals movie name in gold/amber panel, same 3-button winner selection

### 6. RevealPage (standalone, accessed via QR)
- Shows "ولا كلمة" header
- "اكشف الفيلم" button reveals the movie name with spring animation
- Warning: "لا تُري الشاشة لأحد"

### 7. WinnerScreen
- Animated confetti particles (20 colored dots falling infinitely)
- Winner glow effect behind trophy
- Trophy icon with floating animation
- Winner/tie announcement with team color styling
- Both team score cards (winner highlighted with ring + trophy badge)
- "لعبة جديدة" (ends session, goes to `/`) and "إعادة نفس الفئات" (rematch within session)

---

## Timer Component
Reusable `<Timer>` with props: `duration`, `teamLabel`, `teamColor`, `onExpired`, `running`
- Circular SVG progress ring with stroke-dasharray animation
- Large MM:SS countdown display
- Pulsing scale animation when 10 seconds or less remaining
- Red styling when expired
- **"+10 ثوانٍ" button** that ADDS 10 seconds (not subtracts)

---

## Key Implementation Notes
1. **No language toggle** - everything hardcoded Arabic, but keep a `t(ar, en)` helper in context for potential future use
2. **Timer +10s** - the timer button adds time, not subtracts
3. **Skip button** - allows jumping from Team A's timer directly to Team B's timer
4. **Immediate board return** - after choosing question winner, go straight back to board (no separate award phase)
5. **localStorage persistence** - game state survives page refresh; auth session survives refresh
6. **Protected routes** - all pages check `isLoading` before redirecting to prevent hydration flash
7. **QR hash routing** - `#/reveal/encodedData` is checked BEFORE the React Router, renders `RevealPage` as a standalone page
