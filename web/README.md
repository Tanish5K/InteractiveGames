# Interactive Games — Web

Frontend for Interactive Games — a hand-tracking-controlled game platform. See the [root README](../README.md) for full architecture details.

## Stack

Vite + React + TypeScript + Tailwind CSS v4, with `@mediapipe/tasks-vision` for client-side hand tracking (no server-side video processing).

## Setup

```bash
pnpm install
pnpm dev
```

The hand-landmark model and MediaPipe WASM runtime are self-hosted under `public/` (`models/hand_landmarker.task`, `mediapipe/wasm/`) — no CDN dependency at runtime. If either is missing, hand tracking will fail to load; see the root README for how they were generated.

## Structure

```
src/
├── gesture-engine/   # camera → hand landmarks → clean per-hand gesture state
├── input/            # shared input event bus — the only thing games/UI depend on
├── ui/                # glassmorphism components
├── games/             # Snake, Wordle, Sandbox logic
└── pages/             # screens (menu, games, sandbox)
```