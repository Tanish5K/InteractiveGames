import type {
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { GestureEngine, type GestureState } from "./gestureEngine";

export type HandLabel = "Left" | "Right";
export type TwoHandGestureState = Record<HandLabel, GestureState | null>;

const SWAP_HANDEDNESS = false;
const MAX_MATCH_DISTANCE = 0.35;

interface Slot {
  engine: GestureEngine;
  lastWrist: { x: number; y: number } | null;
}

export class TwoHandGestureEngine {
  private slots: Record<HandLabel, Slot> = {
    Left: { engine: new GestureEngine(), lastWrist: null },
    Right: { engine: new GestureEngine(), lastWrist: null },
  };

  update(
    result: HandLandmarkerResult | null,
    timestampMs: number,
    videoWidth: number,
    videoHeight: number,
    screenWidth: number,
    screenHeight: number,
  ): TwoHandGestureState {
    const output: TwoHandGestureState = { Left: null, Right: null };

    const detections = (result?.landmarks ?? []).map(
      (landmarks: NormalizedLandmark[], i: number) => {
        const rawLabel = result!.handedness[i]?.[0]?.categoryName as
          | HandLabel
          | undefined;
        const label: HandLabel | undefined = SWAP_HANDEDNESS
          ? rawLabel === "Left"
            ? "Right"
            : rawLabel === "Right"
              ? "Left"
              : undefined
          : rawLabel;
        return {
          landmarks,
          label,
          wrist: { x: landmarks[0].x, y: landmarks[0].y },
        };
      },
    );

    const usedDetections = new Set<number>();
    const matchedSlots = new Set<HandLabel>();

    (["Left", "Right"] as HandLabel[]).forEach((label) => {
      const slot = this.slots[label];
      if (!slot.lastWrist) return;

      let bestIdx = -1;
      let bestDist = Infinity;
      detections.forEach((d, i) => {
        if (usedDetections.has(i)) return;
        const dist = Math.hypot(
          d.wrist.x - slot.lastWrist!.x,
          d.wrist.y - slot.lastWrist!.y,
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      if (bestIdx !== -1 && bestDist < MAX_MATCH_DISTANCE) {
        usedDetections.add(bestIdx);
        matchedSlots.add(label);
        const d = detections[bestIdx];
        slot.lastWrist = d.wrist;
        output[label] = slot.engine.update(
          d.landmarks,
          timestampMs,
          videoWidth,
          videoHeight,
          screenWidth,
          screenHeight,
        );
      }
    });

    // Pass 2 — leftover detections (a hand newly entering frame, or
    // reappearing after being lost) get assigned by MediaPipe's raw label,
    // purely as a starting guess since there's no position history yet.
    detections.forEach((d, i) => {
      if (usedDetections.has(i) || !d.label) return;
      const label = d.label;
      if (matchedSlots.has(label)) return; // that slot already got filled in pass 1
      usedDetections.add(i);
      matchedSlots.add(label);
      this.slots[label].lastWrist = d.wrist;
      output[label] = this.slots[label].engine.update(
        d.landmarks,
        timestampMs,
        videoWidth,
        videoHeight,
        screenWidth,
        screenHeight,
      );
    });

    // Any slot with nothing matched this frame — hand genuinely gone, reset it.
    (["Left", "Right"] as HandLabel[]).forEach((label) => {
      if (!matchedSlots.has(label)) {
        this.slots[label].lastWrist = null;
        output[label] = this.slots[label].engine.update(
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
