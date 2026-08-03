import { useEffect, useRef, useState } from "react";
import { useGestureTracking } from "../src/gesture-engine/vision/useGestureTracking";
import { HAND_CONNECTIONS } from "../src/gesture-engine/vision/handConnections";
import { mapCoverPoint } from "../src/gesture-engine/vision/coverMap";
import type { HandLabel } from "../src/gesture-engine/gestures/twoHandGestureEngine";
import type { Direction } from "../src/gesture-engine/gestures/swipeDetector";

const ARROW_GLYPHS: Record<Direction, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};
const HAND_COLORS: Record<HandLabel, string> = {
  Left: "#38bdf8",
  Right: "#f472b6",
};
const SWIPE_FADE_MS = 400;

export function GestureDebug() {
  const { videoRef, status, errorMessage, resultRef, gestureStateRef } =
    useGestureTracking();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRefs = {
    Left: useRef<HTMLDivElement>(null),
    Right: useRef<HTMLDivElement>(null),
  };
  const arrowRefs = {
    Left: useRef<HTMLDivElement>(null),
    Right: useRef<HTMLDivElement>(null),
  };
  const [pinching, setPinching] = useState<Record<HandLabel, boolean>>({
    Left: false,
    Right: false,
  });
  const lastSwipeRef = useRef<
    Record<HandLabel, { direction: Direction; time: number } | null>
  >({
    Left: null,
    Right: null,
  });

  useEffect(() => {
    let animationFrameId: number;

    function resizeCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function loop() {
      const video = videoRef.current;
      const timestamp = performance.now();
      const state = gestureStateRef.current;

      (["Left", "Right"] as HandLabel[]).forEach((label) => {
        const gesture = state[label];
        const cursorEl = cursorRefs[label].current;
        const arrowEl = arrowRefs[label].current;

        if (cursorEl) {
          if (gesture?.cursor) {
            cursorEl.style.transform = `translate(${gesture.cursor.x - 12}px, ${gesture.cursor.y - 12}px)`;
            cursorEl.style.opacity = "1";
            cursorEl.style.borderColor = gesture.isPinching
              ? "#34d399"
              : HAND_COLORS[label];
            cursorEl.style.background = gesture.isPinching
              ? "rgba(52,211,153,0.4)"
              : "rgba(255,255,255,0.15)";
          } else {
            cursorEl.style.opacity = "0";
          }
        }

        if (gesture?.swipeDirection) {
          lastSwipeRef.current[label] = {
            direction: gesture.swipeDirection,
            time: timestamp,
          };
        }

        if (arrowEl) {
          const last = lastSwipeRef.current[label];
          const age = last ? timestamp - last.time : Infinity;
          if (last && age < SWIPE_FADE_MS && gesture?.cursor) {
            arrowEl.textContent = ARROW_GLYPHS[last.direction];
            arrowEl.style.color = HAND_COLORS[label];
            arrowEl.style.opacity = String(1 - age / SWIPE_FADE_MS);
            arrowEl.style.transform = `translate(${gesture.cursor.x - 24}px, ${gesture.cursor.y - 90}px)`;
          } else {
            arrowEl.style.opacity = "0";
          }
        }
      });

      setPinching({
        Left: !!state.Left?.isPinching,
        Right: !!state.Right?.isPinching,
      });

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas && video) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const result = resultRef.current;
        if (result) {
          for (const landmarks of result.landmarks) {
            ctx.strokeStyle = "#00ff88";
            ctx.lineWidth = 2;
            for (const [start, end] of HAND_CONNECTIONS) {
              const p1 = mapCoverPoint(
                landmarks[start].x,
                landmarks[start].y,
                video.videoWidth,
                video.videoHeight,
                canvas.width,
                canvas.height,
              );
              const p2 = mapCoverPoint(
                landmarks[end].x,
                landmarks[end].y,
                video.videoWidth,
                video.videoHeight,
                canvas.width,
                canvas.height,
              );
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
            ctx.fillStyle = "#ff2288";
            for (const point of landmarks) {
              const p = mapCoverPoint(
                point.x,
                point.y,
                video.videoWidth,
                video.videoHeight,
                canvas.width,
                canvas.height,
              );
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    loop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [videoRef, resultRef, gestureStateRef]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {status === "error" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
          <p className="text-center text-sm text-red-300">{errorMessage}</p>
        </div>
      )}
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${status === "ready" ? "opacity-100" : "opacity-0"}`}
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full scale-x-[-1] ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
      {(["Left", "Right"] as HandLabel[]).map((label) => (
        <div key={label}>
          <div
            ref={cursorRefs[label]}
            className="pointer-events-none absolute left-0 top-0 h-6 w-6 rounded-full border-2 transition-colors duration-100"
            style={{ opacity: 0, backdropFilter: "blur(2px)" }}
          />
          <div
            ref={arrowRefs[label]}
            className="pointer-events-none absolute left-0 top-0 text-6xl font-bold"
            style={{ opacity: 0 }}
          />
        </div>
      ))}
      <div className="absolute left-6 top-6 flex gap-3 text-sm text-white">
        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
          Left: {pinching.Left ? "Pinching" : "Open"}
        </span>
        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
          Right: {pinching.Right ? "Pinching" : "Open"}
        </span>
      </div>
    </div>
  );
}
