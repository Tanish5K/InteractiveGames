# Interactive Games

A browser-based platform for playing games using hand-tracking gesture control instead of a mouse or keyboard. A webcam feed is analyzed client-side to detect hand landmarks, which drive a glassmorphism-styled UI and a growing library of games — currently Snake and Wordle, with a freeform Sandbox for testing gesture-driven object manipulation.

Everything runs entirely in the browser. There is no server-side video processing — all hand tracking happens on-device via WebAssembly.

---

## Why client-side hand tracking, not server-side OpenCV

An early design decision worth documenting: "hand tracking" often implies OpenCV running in Python on a server, with video streamed up and coordinates streamed back. That approach adds real network latency — bad for anything reaction-based, like steering Snake.

Instead, this project uses **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`), which runs hand-landmark detection entirely client-side via WebAssembly, with optional GPU acceleration. No video ever leaves the browser. This keeps input latency to a single frame of local inference instead of a round trip.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 (CSS-first theming via `@theme`) |
| Hand tracking | `@mediapipe/tasks-vision` (`HandLandmarker`), self-hosted WASM runtime + model file |
| Backend (planned) | Express + Prisma + PostgreSQL — not yet built; see [Not yet built](#not-yet-built) |
| Hosting (planned) | Vercel/Netlify (frontend), Railway/Render (backend), Neon/Supabase (DB) |

The frontend and backend live in one repo as a lightweight `pnpm` workspace (`web/` and `api/` as sibling packages) — not a full monorepo with shared internal packages, since nothing in this project is consumed by more than one app.

---

## Project structure

```
web/src/
├── gesture-engine/       # camera → landmarks → clean gesture state, per hand
│   ├── vision/           # camera capture, MediaPipe model loading, cover-fit math
│   ├── filters/           # One Euro Filter (jitter smoothing)
│   └── gestures/          # pinch, swipe, finger-count detectors + per-hand orchestration
├── input/                # the ONLY vocabulary games/UI are allowed to depend on
│   ├── types.ts           # InputEvent union (cursorMove, select, deselect, directionChange, fingersChanged)
│   ├── inputBus.ts        # tiny pub/sub event bus
│   └── *InputAdapter.ts   # translates mouse / hand / keyboard into InputEvents
├── ui/                    # glassmorphism building blocks (GlassPanel, GlassButton, GlassGrid, HandCursors)
├── games/
│   ├── snake/             # game logic + canvas rendering
│   ├── wordle/            # word-guessing logic
│   └── sandbox/           # draggable/scalable shapes
└── pages/                 # screens: MainMenu, GamesMenu, SnakePage, WordlePage, SandboxPage
```

---

## Architecture: the three-layer pipeline

```
Camera → MediaPipe (raw landmarks) → GestureEngine (per hand) → InputEvent bus → games & UI
```

The core design principle: **nothing outside `gesture-engine/` and `input/` ever touches a hand landmark, and nothing outside `input/` even knows a camera exists.** A game or UI component only ever reacts to `InputEvent`s (`cursorMove`, `select`, `deselect`, `directionChange`, `fingersChanged`) — the same events fire identically whether the source was a hand, a mouse, or (for Snake's directions) a keyboard. This was validated directly: `DirectionButton` and `GlassButton` never branch on input source, and Wordle was built entirely on `cursorMove`/`select` with zero new gesture types, exactly as planned.

### 1. Gesture engine (`gesture-engine/`)

- **One Euro Filter** (`filters/oneEuroFilter.ts`) — adaptive smoothing for the cursor position. Reduces less smoothing during fast motion (so real movement doesn't lag) and more during stillness (so jitter doesn't show). Two separately-tuned filter instances are used per hand: one tuned smooth for the visible cursor, one tuned closer to raw for swipe-velocity detection — a single filter tuned as a compromise turned out to serve neither job well.
- **Pinch detection** (`gestures/pinchDetector.ts`) — thumb-to-index distance, normalized by hand size (wrist-to-knuckle distance) so it works consistently regardless of distance from the camera. Uses hysteresis (separate enter/exit thresholds) to avoid flickering at the boundary.
- **Swipe detection** (`gestures/swipeDetector.ts`) — velocity-based (distance ÷ real elapsed time, not per-frame distance), requiring several consecutive frames of consistent direction before firing, with a cooldown to prevent repeat triggers from one flick.
- **Finger counting** (`gestures/fingerCountDetector.ts`) — per-finger tip-vs-knuckle distance from the wrist; the thumb uses separate logic (distance from the index knuckle) since its joint hinges differently from the other four fingers.
- **Two-hand tracking** (`gestures/twoHandGestureEngine.ts`) — routes each frame's detected hands to persistent per-hand `GestureEngine` instances using **position continuity** (nearest wrist match to last known position), not MediaPipe's raw per-frame Left/Right label. MediaPipe re-classifies handedness fresh every frame with no memory, and trusting it directly caused hands to intermittently swap which engine they fed, breaking pinch/swipe/filters simultaneously. Labels are only used as a first guess when a hand has no prior position to match against.
  - **Known gotcha:** MediaPipe's handedness labels assume a mirrored (selfie-camera) input by default. This project feeds MediaPipe the raw, unmirrored frame (only the display is mirrored via CSS), so the expected fix was to swap the labels — but empirically, this camera/browser setup required the labels used *unswapped*. This is controlled by one constant (`SWAP_HANDEDNESS` in `twoHandGestureEngine.ts`) rather than hardcoded logic, since it may vary by device/browser.

### 2. Input abstraction (`input/`)

A minimal pub/sub event bus (`inputBus.ts`) — no external library, just a `Set` of listener callbacks. `gestureInputAdapter.ts` is the sole file allowed to know both gesture-engine's language (`GestureState`) and the input layer's language (`InputEvent`); everything downstream only ever sees the latter. Separate adapters exist for mouse (`mouseInputAdapter.ts`) and keyboard-as-directional-input (`keyboardInputAdapter.ts`, used for Snake's arrow keys), attached once globally in `App.tsx`.

Wordle's letter/Enter/Backspace input is a deliberate exception — handled as a page-local `keydown` listener rather than routed through the shared bus, since "which letter key was typed" isn't a concept any other part of the app needs to share.

### 3. UI layer (`ui/`, `pages/`)

Glassmorphism components (`bg-white/10 backdrop-blur-xl border border-white/20`) built as plain `<div>`s that subscribe directly to the input bus and do their own hit-testing (`getBoundingClientRect` + coordinate check) — not native `<button>`s with `onClick`, since that would create two divergent code paths for "this was activated" (native click vs. bus-driven pinch) instead of one.

---

## Games

### Snake

- Canvas-rendered, using a **fixed-timestep accumulator loop** decoupled from the render loop — game logic advances at a constant rate (one move per 150ms) regardless of display frame rate, while rendering still happens every available frame for smoothness. This mirrors the same "decouple the expensive/rate-limited thing from the fast display loop" principle used for hand detection itself.
- Grid resolution is computed from actual measured screen space at load (`ResizeObserver`, fixed cell size in pixels), not a fixed cell count — this keeps every cell genuinely square across different screen shapes and avoids the letterboxing/stretching that a fixed-aspect-ratio grid produced on non-matching screens.
- Controlled via swipe (hand) or arrow keys — pinch-button fallback controls were built and later removed in favor of a fuller-size board.

### Wordle

- Validates the input abstraction with zero new gesture types — the entire game (grid, on-screen keyboard) is `GlassButton`s reacting to `cursorMove`/`select`, identical to every other glass UI element in the app.
- Standard two-pass duplicate-letter evaluation (exact matches claimed first, then partial matches checked against only the unclaimed remainder) to correctly handle guesses with repeated letters.
- Supports physical keyboard input (letters, Enter, Backspace) as a page-local listener, alongside the on-screen keyboard.

### Sandbox

- Pinch-and-drag for individual shapes, tracked as a session across `select` → many `cursorMove`s → `deselect`, using direct DOM writes during the drag and a single state commit on release.
- Two-hand scale gesture: when both hands simultaneously show only the index finger extended (via the `fingersChanged` event), a dashed line is drawn between them and the most recently selected shape scales with the distance between the hands.
- Uses ref-mirrors (`shapesRef`, `selectedIdRef`) alongside React state to avoid stale-closure bugs in the bus subscription, which is set up once on mount but needs to read current state on every event.

---

## Not yet built

Documented deliberately, not as an oversight:

- **Backend / auth / persistence** — planned as Express + Prisma + PostgreSQL, with hand-rolled JWT auth. No database or auth flow exists yet; login is a placeholder screen.
- **Formal Game SDK** — a shared `Game` interface was deliberately not built yet. Snake and Wordle turned out to have genuinely different shapes (a continuous render loop vs. a static reactive UI), and forcing both through one interface now would mean guessing at dead methods neither game actually needs. The plan is to extract a shared interface later, once real duplication is visible across three or more games/screens, rather than designing it from zero examples.
- **Web Worker for hand detection** — attempted, reverted. `@mediapipe/tasks-vision` relies on `importScripts()` internally, which doesn't exist in ES module workers, and the working fix requires a hand-edited, version-locked build of the library loaded via `importScripts` in a classic worker — a real maintenance burden for a benefit (freeing the main thread) that isn't yet needed, since nothing else competes with hand tracking on the main thread at this stage. Multiple comparable public hand-tracking projects also run detection on the main thread with no worker. Worth revisiting once game logic + rendering are heavy enough to cause real main-thread contention.
- **Shape rotation in Sandbox** — the two-hand gesture currently only drives scale (line length). Rotation (line angle via `Math.atan2`) would be a small addition on top of the same gesture, not yet implemented.
- **Rectangular Sandbox hit-testing** assumes axis-aligned boxes; would need revisiting if rotation is added, since a rotated shape's true bounds tilt with it.

---

## Setup

```bash
git clone <repo-url>
cd InteractiveGames

# Frontend
cd web
pnpm install
pnpm dev
```

The hand-landmark model and MediaPipe WASM runtime are self-hosted under `web/public/` (`models/hand_landmarker.task`, `mediapipe/wasm/`) — no external CDN dependency for these at runtime.

Backend setup (`api/`) is not yet applicable — no server or database exists yet.

---

## Key lessons from building this

A few things worth remembering if extending this project:

- **Coupling logic to the wrong clock is a recurring bug class.** The single biggest reliability issue in gesture recognition (inconsistent swipe detection) came from gesture processing running in a *render*-paced loop while detection ran in a slower, independently-paced loop — causing the same stale data to be reprocessed multiple times before fresh data arrived. The fix, both here and in Snake's accumulator loop, is the same: let the expensive/rate-limited computation drive its own loop, and have anything faster (rendering) only ever *read* the latest computed result.
- **Classifier output and object identity are not the same thing.** MediaPipe's per-frame Left/Right label is not "sticky" — trusting it directly for routing caused intermittent hand-swapping bugs. Position continuity across frames is what actually identifies a physical hand over time.
- **Verify library assumptions empirically, not from docs alone.** The handedness-mirroring assumption documented by MediaPipe did not hold for this project's actual camera/browser setup — the working configuration was discovered by testing both directions, not by trusting the stated default.