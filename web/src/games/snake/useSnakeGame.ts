import { useEffect, useRef, useState, type RefObject } from "react";
import { inputBus } from "../../input/inputBus";
import { SnakeGame } from "./snakeGame";

const TICK_MS = 150; //tick speed - like in minecraft :D
const GRID_SIZE = 20;

export function useSnakeGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const gameRef = useRef(new SnakeGame(GRID_SIZE));
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"playing" | "gameover">("playing");

  useEffect(() => {
    const unsubscribe = inputBus.subscribe((event) => {
      if (event.type === "directionChange") {
        gameRef.current.setDirection(event.direction);
      }
    });

    let accumulator = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    function render() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const game = gameRef.current;
      const cellSize = canvas.width / game.gridSize;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(244,114,182,0.85)";
      ctx.beginPath();
      ctx.arc(
        game.food.x * cellSize + cellSize / 2,
        game.food.y * cellSize + cellSize / 2,
        cellSize / 2.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      game.snake.forEach((segment, i) => {
        ctx.fillStyle =
          i === 0 ? "rgba(56,189,248,0.95)" : "rgba(56,189,248,0.6)";
        ctx.beginPath();
        ctx.roundRect(
          segment.x * cellSize + 2,
          segment.y * cellSize + 2,
          cellSize - 4,
          cellSize - 4,
          6,
        );
        ctx.fill();
      });
    }

    function loop(time: number) {
      const dt = time - lastTime;
      lastTime = time;
      accumulator += dt;

      // run exactly as many logic steps as real elapsed time allows (otherwise slow pc = bad player experience)
      while (accumulator >= TICK_MS) {
        gameRef.current.tick();
        accumulator -= TICK_MS;
      }

      render();
      setScore(gameRef.current.score);
      setStatus(gameRef.current.status);

      animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      unsubscribe();
      cancelAnimationFrame(animationFrameId);
    };
  }, [canvasRef]);

  function restart() {
    gameRef.current.reset();
    setStatus("playing");
    setScore(0);
  }

  return { score, status, restart };
}
