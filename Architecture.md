handtracking-games/
├── web/                          → Vite + React app
│   ├── public/
│   └── src/
│       ├── gesture-engine/       → camera capture, MediaPipe wiring
│       │   ├── worker/           → Web Worker for off-main-thread detection
│       │   └── filters/          → One Euro filter, smoothing math
│       ├── input/                → input abstraction layer (event bus, types)
│       ├── game-sdk/             → shared Game interface, canvas/loop helpers
│       ├── games/
│       │   ├── snake/
│       │   └── wordle/
│       ├── ui/                   → glassmorphism components (GlassButton, GlassGrid, etc.)
│       ├── pages/                → menu, game screens
│       └── lib/                  → API client, auth context
└── api/                          → Express backend
    ├── src/
    │   ├── routes/
    │   └── middleware/
    └── prisma/                   → schema + migrations