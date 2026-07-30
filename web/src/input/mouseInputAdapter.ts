import { inputBus } from "./inputBus";

export function attachMouseInput(): () => void {
  function onMove(e: MouseEvent) {
    inputBus.emit({ type: "cursorMove", source: "mouse", x: e.clientX, y: e.clientY });
  }
  function onDown(e: MouseEvent) {
    inputBus.emit({ type: "select", source: "mouse", x: e.clientX, y: e.clientY });
  }
  function onUp() {
    inputBus.emit({ type: "deselect", source: "mouse" });
  }

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mousedown", onDown);
  window.addEventListener("mouseup", onUp);

  return () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mousedown", onDown);
    window.removeEventListener("mouseup", onUp);
  };
}