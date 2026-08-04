import { useEffect, useRef } from "react";
import { useSnakeGame } from "./useSnakeGame";
import { GlassPanel } from "../../ui/GlassPanel";
import { GlassButton } from "../../ui/GlassButton";

interface Props {
  cols: number;
  rows: number;
  cellSize: number;
  onScoreChange: (score: number) => void;
}

export function SnakeBoard({ cols, rows, cellSize, onScoreChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { score, status, restart } = useSnakeGame(canvasRef, cols, rows);

  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  return (
    <div className="relative">
      <GlassPanel className="p-2">
        <canvas
          ref={canvasRef}
          width={cols * cellSize}
          height={rows * cellSize}
          className="rounded-2xl"
        />
      </GlassPanel>

      {status === "gameover" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
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
  );
}
