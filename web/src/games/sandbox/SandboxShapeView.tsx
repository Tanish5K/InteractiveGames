import { forwardRef } from "react";
import type { SandboxShape } from "./sandboxTypes";

interface Props {
  shape: SandboxShape;
  selected: boolean;
}

export const SandboxShapeView = forwardRef<HTMLDivElement, Props>(
  function SandboxShapeView({ shape, selected }, ref) {
    return (
      <div
        ref={ref}
        className={`absolute border-2 shadow-xl ${selected ? "border-glass-accent" : "border-white/30"} ${
          shape.kind === "circle" ? "rounded-full" : "rounded-2xl"
        }`}
        style={{
          left: shape.x - shape.width / 2,
          top: shape.y - shape.height / 2,
          width: shape.width,
          height: shape.height,
          background: shape.color,
        }}
      />
    );
  },
);
