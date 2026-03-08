# Special Mode Design

## Goal

Extend the existing SahWla Next.js App Router game with a new `Special Mode` while preserving the current Arabic-first host UI, styling, component structure, and Classic Mode behavior.

## Constraints

- Do not rewrite the project or replace the current design system.
- Keep Classic Mode behavior aligned with the current local host-driven flow.
- Host remains authoritative for question confirmation, reveal, answers, and scoring.
- Team phones join without login via QR link, room code, nickname, and a reconnect token.
- Realtime should use an external service for reliability, low lag, and production readiness.
- Hidden abilities must remain invisible to host and opponent unless their effect becomes visible.

## Recommended Approach

Keep `Classic Mode` on the current `GameContext` path and add a separate server-backed room workflow for `Special Mode`.

This minimizes regression risk in the current host-only game and allows the new multiplayer behavior to be built around validated server state, private team data, and realtime synchronization without forcing a rewrite of the existing board flow.

## Architecture

### Classic Mode

- Keep the current screen flow under `components/game/figma/*`.
- Preserve local persistence for host state in `GameContext`.
- Add only the setup fields needed to choose game mode and Daily Double.
- Avoid routing Classic Mode through the new room backend unless needed for shared setup metadata.

### Special Mode

- Create a persisted game room linked to the existing `GameSession`.
- Keep the host UI at `/play` and reuse the existing board/question/winner screens with Special Mode branches.
- Add a QR share screen between team setup and board.
- Add a new mobile-first controller page at `/play/team`.
- Split Special Mode state into a dedicated room/team store or sub-context to avoid overloading the current local context.

## Realtime Model

- Use one external realtime provider.
- Publish sanitized room snapshots and events to:
  - one host room channel
  - one Team A private channel
  - one Team B private channel
- Team clients submit commands to the server; they do not mutate authoritative state directly.
- The server validates commands, updates Prisma state, and then publishes realtime updates.

## Host and Team Responsibilities

### Host

- Starts the game from the existing `/play` flow.
- Confirms a pending suggested tile before a question opens.
- Reveals question and answer.
- Awards points and resolves round outcomes.
- Remains the only actor allowed to complete scoring state transitions.

### Team Captain

- Suggests a tile.
- Activates abilities.
- Sees private team chat and hidden ability inventory.

### Team Member

- Sees the shared board.
- Uses team-private chat.
- Cannot suggest tiles or activate abilities.

## Data Model

### New Persistent Entities

- `GameRoom`
  - linked to `GameSession`
  - stores `mode`, `roomCode`, `status`, `dailyDoubleEnabled`, `phase`, `currentTurnTeam`, `selectedPickId`, `pendingSuggestedPickId`, `currentRound`, and round-level ability state
- `GameRoomTeam`
  - one row per team
  - stores `teamKey`, `name`, `color`, `score`, `correctStreak`, captain participant id, and team effect flags
- `GameRoomParticipant`
  - guest participant keyed by reconnect token
  - stores `nickname`, `team`, `role`, `connectedAt`, `lastSeenAt`
- `GameRoomChatMessage`
  - stores private text and emoji chat per room/team
- `GameRoomAbility`
  - stores hidden inventory and unlock timing
- `GameRoomEvent`
  - stores visible events for host banners and timeline-style UI hints

### Existing Entities Reused

- `GameSession`
- `GameQuestionPick`
- `Question`

## Setup and Screen Flow

### Setup

Reuse the current `CategorySetup` and `TeamSetup` screens and visual patterns.

`TeamSetup` gains:

- mode selector: `Classic Mode` / `Special Mode`
- Team A name
- Team B name
- Daily Double toggle

### Special Mode Flow

1. Host chooses categories.
2. Host completes team setup and starts Special Mode.
3. Server creates the room and returns room metadata.
4. UI shows `QrShareScreen`.
5. Host continues to the board.
6. Team phones join from `/play/team?room=ROOM_CODE&team=A|B`.

### Team Page

The team controller page includes:

- nickname entry for first join
- team header with color and room code
- captain badge
- connected teammate count
- private chat
- full shared board view
- captain-only suggestion controls
- hidden ability inventory and captain-only activation

## Question Flow

### Classic Mode

- Keep current direct host tile selection.

### Special Mode

1. Captain taps a tile on the team phone.
2. Server validates tile availability and stores `pendingSuggestedPickId`.
3. Host sees a pending suggestion indicator.
4. Host confirms the suggestion.
5. Server moves room state into active question phase and notifies clients.
6. Host reveals question and answer and awards points.

Rules:

- only one pending suggestion at a time
- no selection if a question is already active
- questions are shared, not reserved per team
- used questions are disabled for everyone

## Chat

- Team-private only
- host cannot read it
- opponent cannot read it
- supports text and emojis only
- persists during the game
- cleared when the game ends

## Reconnect

- On first join, issue a secure reconnect token cookie for the device.
- On refresh, recover membership using `roomCode + reconnect token`.
- Restore nickname, team, role, chat history, board snapshot, and room phase.
- Preserve captain role for the original captain device unless the product later introduces manual reassignment.

## Ability System

Special Mode only.

### Earn Rule

- A team earns 1 random ability from the fixed pool after 3 consecutive correct answers by the same team.
- A miss resets that team streak.
- Earned ability becomes usable starting next round.

### Usage Rules

- unlimited inventory can be stored
- only one ability may be used by a team in a round
- only the captain may activate one
- hidden from host and opponent

### Ability Pool

- `Steal`
  - if the active team misses, the other team may steal the points
- `Double Points`
  - the next correct answer by that team scores double
- `Shield`
  - blocks one harmful ability used against that team
- `Bonus Pick`
  - if that team answers correctly, they immediately keep control for another pick
- `Point Theft`
  - immediately transfers 200 points from opponent to activator

### Resolution Notes

- `Shield` auto-consumes when blocking `Steal` or `Point Theft`
- `Double Points` remains hidden until score resolution
- `Bonus Pick` becomes visible when the correct-answer outcome is applied
- `Point Theft` resolves immediately and emits a visible event

## Daily Double

- Keep existing Daily Double support available in Special Mode.
- Make it configurable in setup with `ON` / `OFF`.
- Apply the toggle when the room is created.

## UI Integration

- Preserve the current Arabic-first game-show visual language.
- Reuse Cairo typography, dark gradients, glassy panels, neon cyan/purple accents, and `motion/react` animation patterns.
- Add new screens and panels that feel native to the existing `components/game/figma/*` family.
- Do not introduce a generic dashboard layout.

## Validation

The server must validate:

- host-only actions
- captain-only actions
- question availability
- one pending suggestion at a time
- one ability per round
- legal ability timing
- reconnect identity

## Testing Strategy

- Route and service tests for room creation, join, reconnect, chat isolation, question suggestion validation, scoring, streak grants, and ability rules.
- Component tests for setup branching and Special Mode board status rendering where practical.
- Manual end-to-end verification for QR join, multi-phone participation, captain restrictions, hidden ability boundaries, and Classic Mode regression coverage.

## Separation of Modes

- `Classic Mode` remains the current host-local game flow and should continue to behave as before.
- `Special Mode` introduces a room-backed multiplayer path with private team data and realtime sync.
- Shared presentation components may branch on mode, but authoritative gameplay logic for Special Mode lives server-side.
