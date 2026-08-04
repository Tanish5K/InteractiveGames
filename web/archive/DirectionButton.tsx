import { useEffect, useRef, useState } from "react";
import { inputBus } from "../src/input/inputBus";
import type { Direction } from "../src/input/types";

interface Props {
  direction: Direction;
  label: string;
  className?: string;
}

export function DirectionButton({ direction, label, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    return inputBus.subscribe((event) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const isInside = (x: number, y: number) =>
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

      if (event.type === "cursorMove") setHovered(isInside(event.x, event.y));
      if (event.type === "select" && isInside(event.x, event.y)) {
        setPressed(true);
        inputBus.emit({
          type: "directionChange",
          source: event.source,
          direction,
        });
      }
      if (event.type === "deselect") setPressed(false);
    });
  }, [direction]);

  return (
    <div
      ref={ref}
      className={`flex items-center justify-center rounded-2xl border text-white backdrop-blur-md transition-colors ${
        pressed
          ? "border-emerald-400 bg-emerald-400/30"
          : hovered
            ? "border-white/60 bg-white/20"
            : "border-white/20 bg-white/10"
      } ${className}`}
    >
      {label}
    </div>
  );
}
