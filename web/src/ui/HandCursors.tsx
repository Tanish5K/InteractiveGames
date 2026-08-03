import { useEffect, useRef } from "react";
import { inputBus } from "../input/inputBus";
import type { InputSource } from "../input/types";

const HAND_SOURCES = ["hand-left", "hand-right"] as const;
const HAND_COLORS: Record<(typeof HAND_SOURCES)[number], string> = {
  "hand-left": "#38bdf8",
  "hand-right": "#f472b6",
};
const HIDE_TIMEOUT_MS = 300;

export function HandCursors() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const refs = { "hand-left": leftRef, "hand-right": rightRef };
  const hideTimers = useRef<
    Partial<Record<InputSource, ReturnType<typeof setTimeout>>>
  >({});

  useEffect(() => {
    return inputBus.subscribe((event) => {
      if (event.type !== "cursorMove") return;
      if (event.source !== "hand-left" && event.source !== "hand-right") return; // mouse has its own cursor

      const el = refs[event.source].current;
      if (!el) return;
      el.style.transform = `translate(${event.x - 10}px, ${event.y - 10}px)`;
      el.style.opacity = "1";

      const existing = hideTimers.current[event.source];
      if (existing) clearTimeout(existing);
      hideTimers.current[event.source] = setTimeout(() => {
        el.style.opacity = "0";
      }, HIDE_TIMEOUT_MS);
    });
  }, []);

  return (
    <>
      {HAND_SOURCES.map((source) => (
        <div
          key={source}
          ref={refs[source]}
          className="pointer-events-none fixed left-0 top-0 z-50 h-5 w-5 rounded-full border-2 shadow-lg"
          style={{
            opacity: 0,
            borderColor: HAND_COLORS[source],
            background: `${HAND_COLORS[source]}33`,
          }}
        />
      ))}
    </>
  );
}
