import { inputBus } from "./inputBus";
import type {
  TwoHandGestureState,
  HandLabel,
} from "../gesture-engine/gestures/twoHandGestureEngine";
import type { InputSource } from "./types";
import type { Finger } from "./types";

const SOURCE_MAP: Record<HandLabel, InputSource> = {
  Left: "hand-left",
  Right: "hand-right",
};

const lastFingers: Record<HandLabel, Finger[]> = { Left: [], Right: [] };


function sameFingers(a: Finger[], b: Finger[]): boolean {
  return a.length === b.length && a.every((f) => b.includes(f));
}


export function publishGestureInput(state: TwoHandGestureState) {
  (["Left", "Right"] as HandLabel[]).forEach((label) => {
    const gesture = state[label];
    const source = SOURCE_MAP[label];
    if (!gesture?.cursor) return;

    inputBus.emit({
      type: "cursorMove",
      source,
      x: gesture.cursor.x,
      y: gesture.cursor.y,
    });

    if (gesture.pinchEvent === "pinchStart") {
      inputBus.emit({
        type: "select",
        source,
        x: gesture.cursor.x,
        y: gesture.cursor.y,
      });
    }
    if (gesture.pinchEvent === "pinchEnd") {
      inputBus.emit({ type: "deselect", source });
    }
    if (gesture.swipeDirection) {
      inputBus.emit({
        type: "directionChange",
        source,
        direction: gesture.swipeDirection,
      });
    }

    if (!sameFingers(gesture.extendedFingers, lastFingers[label])) {
      lastFingers[label] = gesture.extendedFingers;
      inputBus.emit({
        type: "fingersChanged",
        source,
        fingers: gesture.extendedFingers,
      });
    }
  });
}
