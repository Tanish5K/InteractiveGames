import { useRef, useState } from "react";
import { useSnakeGame } from "../games/snake/useSnakeGame";
import { GlassPanel } from "../ui/GlassPanel";
import { GlassButton } from "../ui/GlassButton";
import { DirectionButton } from "../ui/DirectionButton";

const CANVAS_SIZE = 500;

interface Props {
  onBack: () => void;
}

export function SnakeGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { score, status, restart } = useSnakeGame(canvasRef);
  const [showArrows, setShowArrows] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-[500px] items-center justify-between">
        <GlassPanel className="px-5 py-2 text-white">
          Score: <span className="font-semibold">{score}</span>
        </GlassPanel>
        <div className="flex gap-3">
          <GlassButton
            onSelect={() => setShowSettings((s) => !s)}
            className="h-11 w-11 text-lg"
          >
            ⚙
          </GlassButton>
          <GlassButton onSelect={onBack} className="h-11 w-24 text-sm">
            ← Back
          </GlassButton>
        </div>
      </div>

      {showSettings && (
        <GlassPanel className="flex items-center gap-4 px-5 py-3 text-sm text-white">
          <span>Show direction buttons</span>
          <GlassButton
            onSelect={() => setShowArrows((s) => !s)}
            className={`h-8 w-14 ${showArrows ? "bg-glass-accent/40" : ""}`}
          >
            {showArrows ? "On" : "Off"}
          </GlassButton>
        </GlassPanel>
      )}

      <div className="relative">
        <GlassPanel className="p-3">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-2xl"
          />
        </GlassPanel>

        {status === "gameover" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <GlassPanel className="flex flex-col items-center gap-4 px-10 py-8">
              <h2 className="text-2xl font-semibold text-white">Game Over</h2>
              <p className="text-white/70">Score: {score}</p>
              <GlassButton onSelect={restart} className="h-12 w-32 text-sm">
                Restart
              </GlassButton>
            </GlassPanel>
          </div>
        )}
      </div>

      {showArrows && (
        <div className="grid grid-cols-3 gap-3">
          <div />
          <DirectionButton direction="up" label="↑" />
          <div />
          <DirectionButton direction="left" label="←" />
          <div />
          <DirectionButton direction="right" label="→" />
          <div />
          <DirectionButton direction="down" label="↓" />
          <div />
        </div>
      )}

      <p className="text-sm text-white/50">
        Swipe to steer — arrow buttons are a pinch-friendly fallback.
      </p>
    </div>
  );
}
