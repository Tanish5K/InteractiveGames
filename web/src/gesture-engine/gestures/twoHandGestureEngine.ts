import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { GestureEngine, type GestureState } from "./gestureEngine";

export type HandLabel = "Left" | "Right";
export type TwoHandGestureState = Record<HandLabel, GestureState | null>;
const SWAP_HANDEDNESS = false;

export class TwoHandGestureEngine {
  private engines: Record<HandLabel, GestureEngine> = {
    Left: new GestureEngine(),
    Right: new GestureEngine(),
  };

  update(
    result: HandLandmarkerResult | null,
    timestampMs: number,
    videoWidth: number,
    videoHeight: number,
    screenWidth: number,
    screenHeight: number,
  ): TwoHandGestureState {
    const seen: Record<HandLabel, boolean> = { Left: false, Right: false };
    const output: TwoHandGestureState = { Left: null, Right: null };

    if (result) {
      for (let i = 0; i < result.landmarks.length; i++) {
        const rawLabel = result.handedness[i]?.[0]?.categoryName as
          | HandLabel
          | undefined;
        if (!rawLabel) continue;

        const label: HandLabel = SWAP_HANDEDNESS
          ? (rawLabel === "Left"
            ? "Right"
            : "Left")
          : rawLabel;

        seen[label] = true;
        output[label] = this.engines[label].update(
          result.landmarks[i],
          timestampMs,
          videoWidth,
          videoHeight,
          screenWidth,
          screenHeight,
        );
      }
    }

    (["Left", "Right"] as HandLabel[]).forEach((label) => {
      if (!seen[label]) {
        output[label] = this.engines[label].update(
          null,
          timestampMs,
          videoWidth,
          videoHeight,
          screenWidth,
          screenHeight,
        );
      }
    });

    return output;
  }
}
