import { useEffect, useRef, useState } from "react";
import { useGestureTracking } from "../src/gesture-engine/vision/useGestureTracking";
import { attachMouseInput } from "../src/input/mouseInputAdapter";
import { inputBus } from "../src/input/inputBus";
import { DirectionButton } from "./DirectionButton";
import { type Finger } from "../src/input/types";

export function InputHarnessDebug() {
  const { videoRef, status, errorMessage } = useGestureTracking();
  const dotRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const [lastEvent, setLastEvent] = useState("none yet");
  const [leftFingers, setLeftFingers] = useState<Finger[]>([]);
  const [rightFingers, setRightFingers] = useState<Finger[]>([]);


  useEffect(() => {
    const detachMouse = attachMouseInput();

    const unsubscribe = inputBus.subscribe((event) => {
      if (event.type === "cursorMove" && dotRef.current) {
        dotRef.current.style.transform = `translate(${event.x - 10}px, ${event.y - 10}px)`;
      }
      if (event.type === "select") setLastEvent(`select (${event.source})`);
      if (event.type === "deselect") setLastEvent(`deselect (${event.source})`);
      if (event.type === "directionChange") {
        setLastEvent(`directionChange: ${event.direction} (${event.source})`);
      }
      if (event.type === "fingersChanged") {
        if (event.source === "hand-left") {
          setLeftFingers(event.fingers);
        } else if (event.source === "hand-right") {
          setRightFingers(event.fingers);
        }
      }

      if (event.type === "directionChange" && arrowRef.current) {
        const glyphs = { up: "↑", down: "↓", left: "←", right: "→" };
        arrowRef.current.textContent = glyphs[event.direction];
        arrowRef.current.style.opacity = "1";
        setTimeout(() => {
          if (arrowRef.current) arrowRef.current.style.opacity = "0";
        }, 400);
      }
    });

    return () => {
      detachMouse();
      unsubscribe();
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-neutral-950">
      {status === "error" && <p className="p-6 text-red-300">{errorMessage}</p>}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full scale-x-[-1] object-cover opacity-20"
        muted
        playsInline
      />

      <div
        ref={dotRef}
        className="pointer-events-none absolute left-0 top-0 h-5 w-5 rounded-full bg-white/80 shadow-lg"
      />

      <div
        ref={arrowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-white transition-opacity duration-300"
        style={{ opacity: 0 }}
      />

      <div className="absolute left-6 top-6 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md">
        Last event: {lastEvent}
      </div>

      <div>Left: {leftFingers.join(", ") || "None"}</div>
      <div>Right: {rightFingers.join(", ") || "None"}</div>

      <div className="absolute bottom-16 left-1/2 grid -translate-x-1/2 grid-cols-3 gap-3">
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
    </div>
  );
}