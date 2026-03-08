# Special Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new Special Mode to the existing SahWla game without breaking Classic Mode, using a server-backed room model, guest team joins, private team chat, hidden abilities, and realtime synchronization.

**Architecture:** Preserve the current local host flow for Classic Mode. Introduce a new room-backed path for Special Mode with Prisma persistence, host-authoritative server actions, and an external realtime provider for low-latency sync between host and team phones. Keep UI changes inside the existing `components/game/figma/*` family and branch behavior by mode instead of replacing the current screens.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Prisma/Postgres, Zod, motion/react, external realtime SDK, Vitest, Testing Library

---

### Task 1: Add Test Harness

**Files:**
- Modify: `/Users/yousefsabti/SahWla/package.json`
- Create: `/Users/yousefsabti/SahWla/vitest.config.ts`
- Create: `/Users/yousefsabti/SahWla/vitest.setup.ts`
- Create: `/Users/yousefsabti/SahWla/tests/helpers/test-env.ts`

**Step 1: Write the failing test**

Create a smoke test at `/Users/yousefsabti/SahWla/tests/smoke/game-smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs app tests", () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/smoke/game-smoke.test.ts`
Expected: FAIL because no test runner is configured yet.

**Step 3: Write minimal implementation**

- Add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event`.
- Add scripts:
  - `test`
  - `test:watch`
- Configure alias support and jsdom setup.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/smoke/game-smoke.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json vitest.config.ts vitest.setup.ts tests/helpers/test-env.ts tests/smoke/game-smoke.test.ts
git commit -m "test: add vitest harness for game features"
```

### Task 2: Add Prisma Room Schema

**Files:**
- Modify: `/Users/yousefsabti/SahWla/prisma/schema.prisma`
- Create: `/Users/yousefsabti/SahWla/prisma/migrations/<timestamp>_add_special_mode_rooms/migration.sql`

**Step 1: Write the failing test**

Create `/Users/yousefsabti/SahWla/tests/game/room-schema-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

describe("room schema contract", () => {
  it("exposes special mode room models", () => {
    expect(Prisma.ModelName.GameSession).toBe("GameSession");
    expect(Prisma.ModelName.GameRoom).toBe("GameRoom");
    expect(Prisma.ModelName.GameRoomTeam).toBe("GameRoomTeam");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/room-schema-contract.test.ts`
Expected: FAIL because the new Prisma models do not exist yet.

**Step 3: Write minimal implementation**

Add:

- enums for room mode, room phase, participant role, room status, ability type, team key
- `GameRoom`
- `GameRoomTeam`
- `GameRoomParticipant`
- `GameRoomChatMessage`
- `GameRoomAbility`
- `GameRoomEvent`

Model the following minimum fields:

- room code
- daily double enabled
- current round
- pending suggestion pick id
- selected pick id
- current turn
- per-team score and streak
- reconnect token
- captain participant id
- hidden ability inventory and unlock round

Generate the migration and Prisma client.

**Step 4: Run test to verify it passes**

Run:
- `npm run prisma:generate`
- `npm run test -- tests/game/room-schema-contract.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add prisma schema for special mode rooms"
```

### Task 3: Add Shared Room Types, Validation, and Realtime Wrapper

**Files:**
- Modify: `/Users/yousefsabti/SahWla/lib/validation/api.ts`
- Create: `/Users/yousefsabti/SahWla/lib/game/room-types.ts`
- Create: `/Users/yousefsabti/SahWla/lib/game/room-code.ts`
- Create: `/Users/yousefsabti/SahWla/lib/game/realtime.ts`
- Create: `/Users/yousefsabti/SahWla/lib/game/team-device.ts`
- Create: `/Users/yousefsabti/SahWla/tests/game/room-validation.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { joinRoomSchema, suggestTileSchema } from "@/lib/validation/api";

describe("special mode validation", () => {
  it("requires room, team, and nickname on join", () => {
    expect(() => joinRoomSchema.parse({ room: "", team: "A", nickname: "" })).toThrow();
  });

  it("requires category and tile coordinates for suggestions", () => {
    expect(() => suggestTileSchema.parse({ roomCode: "ROOM1" })).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/room-validation.test.ts`
Expected: FAIL because schemas do not exist yet.

**Step 3: Write minimal implementation**

- Add Zod schemas for:
  - create room
  - join room
  - reconnect
  - suggest tile
  - confirm suggestion
  - send chat
  - use ability
  - resolve answer
- Add shared TS types for room snapshots and sanitized team payloads.
- Add a provider-agnostic realtime wrapper so the rest of the app does not depend on SDK calls directly.
- Add helpers for room-code generation and reconnect cookie creation/parsing.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/game/room-validation.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/validation/api.ts lib/game/room-types.ts lib/game/room-code.ts lib/game/realtime.ts lib/game/team-device.ts tests/game/room-validation.test.ts
git commit -m "feat: add room validation and realtime abstractions"
```

### Task 4: Build Room Service Layer

**Files:**
- Create: `/Users/yousefsabti/SahWla/lib/game/room-service.ts`
- Create: `/Users/yousefsabti/SahWla/lib/game/ability-engine.ts`
- Create: `/Users/yousefsabti/SahWla/lib/game/room-snapshot.ts`
- Create: `/Users/yousefsabti/SahWla/tests/game/ability-engine.test.ts`
- Create: `/Users/yousefsabti/SahWla/tests/game/room-service.test.ts`

**Step 1: Write the failing test**

Add focused tests:

```ts
it("grants one hidden ability every three consecutive correct answers", async () => {
  // create room, apply three correct answers for Team A
  // expect one ability in Team A inventory locked until next round
});

it("consumes shield before point theft takes effect", async () => {
  // Team B has Shield, Team A uses Point Theft
  // expect no score transfer and shield consumed
});

it("rejects a second ability in the same round", async () => {
  // one ability already used by Team A this round
  // expect validation error
});
```

**Step 2: Run test to verify it fails**

Run:
- `npm run test -- tests/game/ability-engine.test.ts`
- `npm run test -- tests/game/room-service.test.ts`

Expected: FAIL because service logic does not exist yet.

**Step 3: Write minimal implementation**

Implement server-side helpers for:

- room creation from Special Mode setup
- join or reconnect by device token
- captain assignment
- room snapshot assembly for host/team clients
- private chat persistence
- tile suggestion validation
- host confirmation
- scoring resolution
- streak tracking
- hidden ability granting and locking
- ability activation and shield interception
- round reset rules
- room completion and chat cleanup

**Step 4: Run test to verify it passes**

Run:
- `npm run test -- tests/game/ability-engine.test.ts`
- `npm run test -- tests/game/room-service.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/game/room-service.ts lib/game/ability-engine.ts lib/game/room-snapshot.ts tests/game/ability-engine.test.ts tests/game/room-service.test.ts
git commit -m "feat: add special mode room service and ability engine"
```

### Task 5: Add Special Mode API Routes

**Files:**
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/route.ts`
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/[roomCode]/join/route.ts`
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/[roomCode]/reconnect/route.ts`
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/[roomCode]/suggest/route.ts`
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/[roomCode]/confirm/route.ts`
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/[roomCode]/chat/route.ts`
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/[roomCode]/ability/route.ts`
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/[roomCode]/resolve/route.ts`
- Create: `/Users/yousefsabti/SahWla/app/api/game/rooms/[roomCode]/snapshot/route.ts`
- Create: `/Users/yousefsabti/SahWla/tests/game/room-routes.test.ts`

**Step 1: Write the failing test**

```ts
it("blocks non-captains from suggesting a tile", async () => {
  // request as a regular member
  // expect 403
});

it("blocks host confirmation when there is no pending suggestion", async () => {
  // confirm without pending pick
  // expect 409
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/room-routes.test.ts`
Expected: FAIL because the routes do not exist yet.

**Step 3: Write minimal implementation**

- Add host-authenticated routes for room creation, confirmation, resolution, and snapshot.
- Add guest routes for join, reconnect, chat, suggestion, and ability use.
- Read and write the reconnect cookie in join and reconnect handlers.
- Publish realtime updates after successful mutations.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/game/room-routes.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/api/game/rooms tests/game/room-routes.test.ts
git commit -m "feat: add special mode room api routes"
```

### Task 6: Extend Host Game Context for Mode-Aware Flow

**Files:**
- Modify: `/Users/yousefsabti/SahWla/components/game/figma/GameContext.tsx`
- Create: `/Users/yousefsabti/SahWla/components/game/figma/SpecialModeContext.tsx`
- Create: `/Users/yousefsabti/SahWla/tests/game/game-context-mode.test.tsx`

**Step 1: Write the failing test**

```tsx
import { renderHook } from "@testing-library/react";

it("starts in classic mode by default", () => {
  // render provider and expect classic setup defaults
});

it("stores special mode room metadata separately from classic local state", () => {
  // set special mode room state and verify classic teams state stays intact
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/game-context-mode.test.tsx`
Expected: FAIL because mode-aware state does not exist yet.

**Step 3: Write minimal implementation**

- Add `gameMode` and `dailyDoubleEnabled` to the host setup state.
- Keep current local board/question state for Classic Mode.
- Add a Special Mode sub-context for room snapshot, pending suggestion, connected counts, captain metadata, visible room events, and loading states.
- Keep saved local storage behavior limited to Classic Mode.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/game/game-context-mode.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/game/figma/GameContext.tsx components/game/figma/SpecialModeContext.tsx tests/game/game-context-mode.test.tsx
git commit -m "feat: separate classic and special mode host state"
```

### Task 7: Extend Setup Flow and Add QR Share Screen

**Files:**
- Modify: `/Users/yousefsabti/SahWla/components/game/figma/TeamSetup.tsx`
- Modify: `/Users/yousefsabti/SahWla/components/game/play-client.tsx`
- Create: `/Users/yousefsabti/SahWla/components/game/figma/QrShareScreen.tsx`
- Create: `/Users/yousefsabti/SahWla/tests/game/team-setup-special-mode.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shows mode selection and daily double toggle", () => {
  // render TeamSetup and assert setup controls are visible
});

it("routes special mode start to qr share instead of board", async () => {
  // submit special mode setup and expect qr screen state
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/team-setup-special-mode.test.tsx`
Expected: FAIL because the setup flow does not branch yet.

**Step 3: Write minimal implementation**

- Add mode picker and Daily Double toggle using the existing glass panel/button language.
- On Classic Mode start, keep the current board entry.
- On Special Mode start, create the room via API and show `QrShareScreen`.
- Build two QR cards using the current visual system, each with:
  - team name
  - team color
  - QR code
  - copy link button
  - continue-to-board button

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/game/team-setup-special-mode.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/game/figma/TeamSetup.tsx components/game/play-client.tsx components/game/figma/QrShareScreen.tsx tests/game/team-setup-special-mode.test.tsx
git commit -m "feat: add special mode setup and qr share flow"
```

### Task 8: Update Host Board and Question Resolution for Special Mode

**Files:**
- Modify: `/Users/yousefsabti/SahWla/components/game/figma/GameBoard.tsx`
- Modify: `/Users/yousefsabti/SahWla/components/game/figma/QuestionView.tsx`
- Modify: `/Users/yousefsabti/SahWla/components/game/figma/WalaKalmaView.tsx`
- Modify: `/Users/yousefsabti/SahWla/components/game/figma/WinnerScreen.tsx`
- Create: `/Users/yousefsabti/SahWla/components/game/figma/AbilityEventBanner.tsx`
- Create: `/Users/yousefsabti/SahWla/tests/game/host-board-special-mode.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shows pending suggested tile and connected counts in special mode", () => {
  // render board with special mode snapshot
});

it("does not render hidden ability inventory on host board", () => {
  // assert hidden ability labels are absent
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/host-board-special-mode.test.tsx`
Expected: FAIL because host board special mode UI does not exist yet.

**Step 3: Write minimal implementation**

- Keep the current board layout and score cards.
- Add compact Special Mode status chips:
  - connected player count per team
  - captain nickname
  - pending suggestion
  - visible ability event banner
  - optional discussion indicator if low-cost
- Update question resolution screens to call host resolve APIs in Special Mode while preserving current Classic Mode behavior.
- Keep Daily Double support mode-aware.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/game/host-board-special-mode.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/game/figma/GameBoard.tsx components/game/figma/QuestionView.tsx components/game/figma/WalaKalmaView.tsx components/game/figma/WinnerScreen.tsx components/game/figma/AbilityEventBanner.tsx tests/game/host-board-special-mode.test.tsx
git commit -m "feat: add special mode host board state and resolution flow"
```

### Task 9: Add Team Controller Page and Team UI Components

**Files:**
- Create: `/Users/yousefsabti/SahWla/app/(fullscreen)/play/team/page.tsx`
- Create: `/Users/yousefsabti/SahWla/components/game/figma/TeamControllerView.tsx`
- Create: `/Users/yousefsabti/SahWla/components/game/figma/TeamChatPanel.tsx`
- Create: `/Users/yousefsabti/SahWla/components/game/figma/AbilityPanel.tsx`
- Create: `/Users/yousefsabti/SahWla/components/game/figma/TeamBoardView.tsx`
- Create: `/Users/yousefsabti/SahWla/tests/game/team-controller-view.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shows nickname join form before participant is connected", () => {
  // render with no participant snapshot
});

it("enables tile suggestion only for captains", () => {
  // render member view and assert suggestion action is disabled
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/team-controller-view.test.tsx`
Expected: FAIL because the team controller page does not exist yet.

**Step 3: Write minimal implementation**

- Build a mobile-first controller page in the current visual language.
- Include:
  - join form
  - room/team header
  - captain badge
  - teammate count
  - private chat
  - shared board rendering
  - captain-only suggest tile controls
  - captain-only ability activation
- Subscribe to the correct private team channel after join/reconnect.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/game/team-controller-view.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/'(fullscreen)'/play/team/page.tsx components/game/figma/TeamControllerView.tsx components/game/figma/TeamChatPanel.tsx components/game/figma/AbilityPanel.tsx components/game/figma/TeamBoardView.tsx tests/game/team-controller-view.test.tsx
git commit -m "feat: add special mode team controller page"
```

### Task 10: Wire `/play` Server Entry for Room Bootstrap

**Files:**
- Modify: `/Users/yousefsabti/SahWla/app/(fullscreen)/play/page.tsx`
- Modify: `/Users/yousefsabti/SahWla/components/game/play-client.tsx`
- Create: `/Users/yousefsabti/SahWla/lib/game/load-active-room.ts`
- Create: `/Users/yousefsabti/SahWla/tests/game/play-page-bootstrap.test.ts`

**Step 1: Write the failing test**

```ts
it("returns active room metadata when the active session already has a special mode room", async () => {
  // mock active session with attached room
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/play-page-bootstrap.test.ts`
Expected: FAIL because room bootstrap is not loaded.

**Step 3: Write minimal implementation**

- Load any existing active Special Mode room alongside picks.
- Pass room bootstrap data into `PlayClient`.
- Keep current Classic Mode load behavior unchanged.

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/game/play-page-bootstrap.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/'(fullscreen)'/play/page.tsx components/game/play-client.tsx lib/game/load-active-room.ts tests/game/play-page-bootstrap.test.ts
git commit -m "feat: bootstrap play page with active special mode room"
```

### Task 11: Verify End-to-End Behavior and Clean Up

**Files:**
- Modify: `/Users/yousefsabti/SahWla/package.json`
- Create: `/Users/yousefsabti/SahWla/docs/plans/2026-03-08-special-mode-verification.md`

**Step 1: Write the failing test**

If no browser automation exists yet, add a manual verification checklist first and fail the task on any unmet acceptance criterion.

**Step 2: Run verification to capture failures**

Run:
- `npm run test`
- `npm run build`

Expected: either failures to fix or a green baseline with any remaining manual checks listed.

**Step 3: Write minimal implementation**

- Fix any failing tests or type/build issues.
- Add any final defensive comments where logic is genuinely non-obvious.
- Document:
  - changed files
  - new dependencies
  - assumptions
  - Classic vs Special separation

**Step 4: Run verification to confirm completion**

Run:
- `npm run test`
- `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: complete special mode multiplayer game flow"
```
