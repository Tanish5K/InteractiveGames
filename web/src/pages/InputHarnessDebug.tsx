import { useEffect, useRef, useState } from "react";
import { useGestureTracking } from "../gesture-engine/vision/useGestureTracking";
import { attachMouseInput } from "../input/mouseInputAdapter";
import { inputBus } from "../input/inputBus";
import { DirectionButton } from "../ui/DirectionButton";

export function InputHarnessDebug() {
  const { videoRef, status, errorMessage } = useGestureTracking();
  const dotRef = useRef<HTMLDivElement>(null);
  const [lastEvent, setLastEvent] = useState("none yet");

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

      <div ref={dotRef} className="pointer-events-none absolute left-0 top-0 h-5 w-5 rounded-full bg-white/80 shadow-lg" />

      <div className="absolute left-6 top-6 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md">
        Last event: {lastEvent}
      </div>

      <div className="absolute bottom-16 left-1/2 grid -translate-x-1/2 grid-cols-3 gap-3">
        <div /><DirectionButton direction="up" label="↑" /><div />
        <DirectionButton direction="left" label="←" /><div /><DirectionButton direction="right" label="→" />
        <div /><DirectionButton direction="down" label="↓" /><div />
      </div>
    </div>
  );
}