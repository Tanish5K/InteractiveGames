import type { ReactNode } from "react";
import { GLASS_PANEL } from "./glass";

interface Props {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = "" }: Props) {
  return <div className={`${GLASS_PANEL} ${className}`}>{children}</div>;
}
