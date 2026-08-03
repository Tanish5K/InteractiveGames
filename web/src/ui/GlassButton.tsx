import { useEffect, useRef, useState, type ReactNode } from "react";
import { inputBus } from "../input/inputBus";
import { GLASS_PANEL } from "./glass";

interface Props {
  children: ReactNode;
  onSelect: () => void;
  className?: string;
}

export function GlassButton({ children, onSelect, className = "" }: Props) {
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
        onSelect();
      }
      if (event.type === "deselect") setPressed(false);
    });
  }, [onSelect]);

  return (
    <div
      ref={ref}
      className={`${GLASS_PANEL} flex cursor-pointer select-none items-center justify-center text-white transition-all duration-150 ${
        pressed
          ? "scale-95 border-glass-accent bg-glass-accent/25"
          : hovered
            ? "scale-[1.03] border-white/40 bg-white/20"
            : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
