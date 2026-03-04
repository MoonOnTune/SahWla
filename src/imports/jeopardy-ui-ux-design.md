Design a complete UI/UX for a local multiplayer Jeopardy-style quiz game optimized for Arabic + English UI, with all questions/answers content in Arabic. The game is controlled by a host on a phone/tablet, and the host screen is mirrored to a TV. Focus on readability at distance, bold game-show visuals, and fast host control.
Core Requirements
Bilingual UI: Every UI label must support Arabic + English (toggle or dual-language label).
Default language: Arabic (RTL).
Provide a language toggle: AR / EN.
Questions content: Always Arabic (RTL), large and readable.
Host flow: Host selects categories, teams, questions, timers, reveals answer, awards points, and final winner.
Teams: Assume 2 teams (Team A vs Team B) for the main game logic. (Make the layout extensible for more teams later, but keep designs for 2 teams.)
Visual Style (Modern Party Game Show)
Modern vibrant game-show UI (not Jeopardy clone): glossy panels, neon accents, soft glow, subtle gradients, clean shadows.
High contrast for TV readability.
Rounded corners, bold typography, large hit targets for touch.
No audio design needed.
Use a consistent component system: buttons, panels, chips, timers, score cards, modals.
Layout Constraints
Primary target: 16:9 TV view (mirrored from host device).
Also provide a host-friendly layout variant for phone/tablet (portrait optional), but prioritize TV readability.
Provide auto-layout and responsive constraints.
Screens / Frames to Design (End-to-End Flow)
1) Welcome / Start Screen
Title: bilingual (AR/EN).
Primary CTA: “ابدأ اللعبة / Start Game”
Secondary: “الإعدادات / Settings”
Language toggle AR/EN (top corner).
2) Category Selection Screen (Choose 6 Categories)
Header: “اختر ٦ فئات / Choose 6 Categories”
6 selection slots shown as cards with:
Category name input (bilingual label, but category name itself can be Arabic).
Optional dropdown for “preset category library”.
CTA: “التالي / Next”
Validation states: not enough categories selected.
3) Teams Setup Screen
Header: “إعداد الفرق / Team Setup”
Two team cards:
Team Name field (optional)
Player count stepper (+ / -)
Optional player names list (optional fields; allow adding names but not required)
CTA: “ابدأ الجولة / Start Round”
Make the UI quick to fill, minimal typing.
4) Game Board Screen (6 Categories × 6 Questions)
Grid board:
6 category columns.
Under each category: 6 tiles total arranged as 200 / 400 / 600 with 2 tiles per value side-by-side (explicitly: two 200 tiles, two 400 tiles, two 600 tiles per category).
Each tile shows score value and “unused/used” state.
Score HUD always visible:
Team A score, Team B score, with clear team colors and bilingual team labels.
Current turn indicator: “دور الفريق / Team Turn: Team A”
On tile tap: transition to Question Reveal.
5) Question Reveal + Timer (Team A: 1 minute)
Large question panel in Arabic (RTL), big font.
Visible metadata: category + score.
Timer component:
Starts at 01:00 when question appears.
Clearly labeled for which team: “وقت الفريق A / Team A Timer”
When it hits 0, it turns red and shows a prompt:
“انتهى الوقت — ابدأ وقت الفريق الآخر / Time’s up — Start other team”
Controls for host:
Button: “ابدأ وقت الفريق الآخر / Start Other Team Timer”
Button: “إظهار الإجابة / Show Answer” (initially disabled until host chooses or always available—design both states)
Small button: “-10 ثوانٍ / -10s” to decrease time (applies to the currently running timer)
Button: “عودة للوحة / Back to Board” (confirm modal if leaving early)
6) Other Team Timer (Team B: 30 seconds)
Same question still displayed.
New timer appears: 00:30, clearly labeled for Team B.
Controls:
“-10 ثوانٍ / -10s”
“إظهار الإجابة / Show Answer”
When time ends: timer turns red and prompts host to reveal answer or proceed.
7) Answer Reveal + Award Points
Answer panel appears under question:
Arabic answer (RTL), big and clear.
Host chooses which team got it right:
Two big selectable buttons: “الفريق A صحيح / Team A Correct”, “الفريق B صحيح / Team B Correct”
Option: “لا أحد / No One”
After choosing, show a Score Adjustment stepper for each team:
+100 / -100 controls (and display current delta)
This allows correction if wrong team selected.
Confirmation CTA: “تأكيد وإضافة النقاط / Confirm & Apply”
After applying, return to board with tile marked “used” and score updated (animated count-up).
8) End Game / Winner Reveal
When all tiles used:
Winner screen with celebration animation placeholders.
Show final scores for both teams.
Winner label bilingual: “الفائز / Winner”
CTA: “لعبة جديدة / New Game” and “إعادة نفس الفئات / Rematch”
Components to Create (as reusable variants)
Button system: Primary / Secondary / Danger + states (default/pressed/disabled)
Category card: empty/filled/invalid
Question tile: 200/400/600 + unused/used/hover/pressed
Team score card: normal / active turn / winner highlight
Timer component: normal / warning / expired(red) + label for team
Modal: confirm exit, confirm apply points
Language toggle: AR/EN
Stepper: + / - for player count and +100/-100 score adjust
UX Notes
Prioritize clarity: always show which team is active, which timer is running, and what step the host should take next.
Use large text and strong contrast for TV distance.
Smooth transitions between Board → Question → Timers → Reveal → Award → Board.
RTL support: Arabic layout aligns right, but keep a consistent structure when switching to English.
Deliverables
A page with all main frames (1–8).
A components page with variants and auto-layout.
Use consistent spacing, 8pt grid, and constraints for 16:9.
Provide a simple prototype flow linking the frames with interactions.
Important: Make everything look like a modern party game show, distinct from classic Jeopardy. No copyrighted elements. No sound needed.