import { useEffect, useRef, useState } from "react";
import { useHandLandmarks } from "../gesture-engine/vision/useHandLandmarks";
import { GestureEngine } from "../gesture-engine/gestures/gestureEngine";
import type { Direction } from "../gesture-engine/gestures/swipeDetector";

const ARROW_GLYPHS: Record<Direction, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

export function GestureDebug() {
  const { videoRef, status, errorMessage, landmarksRef } = useHandLandmarks();
  const cursorRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef(new GestureEngine());
  const [pinching, setPinching] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let lastSwipe: { direction: Direction; time: number } | null = null;

    function loop() {
      const landmarks = landmarksRef.current[0] ?? null;
      const timestamp = performance.now();
      const video = videoRef.current;
      const gesture = engineRef.current.update(
        landmarks,
        timestamp,
        video?.videoWidth ?? 0,
        video?.videoHeight ?? 0,
        window.innerWidth,
        window.innerHeight,
      );

      if (cursorRef.current) {
        if (gesture.cursor) {
          cursorRef.current.style.transform = `translate(${gesture.cursor.x - 12}px, ${gesture.cursor.y - 12}px)`;
          cursorRef.current.style.opacity = "1";
        } else {
          cursorRef.current.style.opacity = "0";
        }
      }

      if (gesture.pinchEvent === "pinchStart") setPinching(true);
      if (gesture.pinchEvent === "pinchEnd") setPinching(false);

      if (gesture.swipeDirection)
        lastSwipe = { direction: gesture.swipeDirection, time: timestamp };

      if (arrowRef.current) {
        const age = lastSwipe ? timestamp - lastSwipe.time : Infinity;
        if (lastSwipe && age < 400) {
          arrowRef.current.textContent = ARROW_GLYPHS[lastSwipe.direction];
          arrowRef.current.style.opacity = String(1 - age / 400);
        } else {
          arrowRef.current.style.opacity = "0";
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [landmarksRef, videoRef]);

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

      <div
        ref={cursorRef}
        className={`pointer-events-none absolute left-0 top-0 h-6 w-6 rounded-full border-2 transition-colors duration-100 ${
          pinching
            ? "border-emerald-400 bg-emerald-400/40"
            : "border-black/80 bg-black/20"
        }`}
        style={{ opacity: 0, backdropFilter: "blur(2px)" }}
      />

      <div className="absolute left-6 top-6 rounded-full border border-black/20 bg-black/10 px-4 py-2 text-sm text-white backdrop-blur-md">
        {pinching ? "Pinching" : "Open"}
      </div>

      <div
        ref={arrowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-white"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
