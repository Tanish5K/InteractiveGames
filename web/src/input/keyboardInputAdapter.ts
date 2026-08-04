import { inputBus } from "./inputBus";
import type { Direction } from "./types";

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export function attachKeyboardInput(): () => void {
  function onKeyDown(e: KeyboardEvent) {
    const direction = KEY_MAP[e.key];
    if (!direction) return;
    e.preventDefault();
    inputBus.emit({ type: "directionChange", source: "keyboard", direction });
  }

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}
