import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  columns?: number;
}

export function GlassGrid({ children, columns = 3 }: Props) {
  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}
