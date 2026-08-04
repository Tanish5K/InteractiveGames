import { useCallback, useEffect, useRef, useState } from "react";
import { SnakeBoard } from "../games/snake/SnakeBoard";
import { GlassPanel } from "../ui/GlassPanel";
import { GlassButton } from "../ui/GlassButton";

interface Props {
  onBack: () => void;
}

const CELL_SIZE = 22;
const MIN_COLS = 16;
const MIN_ROWS = 10;

export function SnakeGame({ onBack }: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [gridDims, setGridDims] = useState<{
    cols: number;
    rows: number;
  } | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      setGridDims((prev) => {
        if (prev) return prev;
        const { width, height } = entries[0].contentRect;
        const cols = Math.max(Math.floor(width / CELL_SIZE), MIN_COLS);
        const rows = Math.max(Math.floor(height / CELL_SIZE), MIN_ROWS);
        return { cols, rows };
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScoreChange = useCallback((s: number) => setScore(s), []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative z-20 flex w-full shrink-0 items-center justify-between px-3 pt-2">
        <GlassPanel className="px-5 py-2 text-white">
          Score: <span className="font-semibold">{score}</span>
        </GlassPanel>
        <GlassButton onSelect={onBack} className="h-11 w-24 text-sm">
          ← Back
        </GlassButton>
      </div>

      <div
        ref={measureRef}
        className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center pt-3"
      >
        {gridDims && (
          <SnakeBoard
            cols={gridDims.cols}
            rows={gridDims.rows}
            cellSize={CELL_SIZE}
            onScoreChange={handleScoreChange}
          />
        )}
      </div>

      <p className="shrink-0 pt-2 text-center text-sm text-white/70">
        Swipe to steer, or use arrow keys.
      </p>
    </div>
  );
}
