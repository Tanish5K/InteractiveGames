import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export type PinchEvent = "pinchStart" | "pinchEnd" | null;

export class PinchDetector {
  private pinching = false;
  private enterThreshold: number;
  private exitThreshold: number;

  constructor(enterThreshold = 0.3, exitThreshold = 0.45) {
    this.enterThreshold = enterThreshold;
    this.exitThreshold = exitThreshold;
  }

  update(landmarks: NormalizedLandmark[]): PinchEvent {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const wrist = landmarks[0];
    const middleKnuckle = landmarks[9];

    const pinchDistance = dist(thumbTip, indexTip);
    const handScale = dist(wrist, middleKnuckle);
    const ratio = pinchDistance / handScale;

    if (!this.pinching && ratio < this.enterThreshold) {
      this.pinching = true;
      return "pinchStart";
    }
    if (this.pinching && ratio > this.exitThreshold) {
      this.pinching = false;
      return "pinchEnd";
    }
    return null;
  }

  isPinching() {
    return this.pinching;
  }

  reset(): PinchEvent {
    if (this.pinching) {
      this.pinching = false;
      return "pinchEnd";
    }
    return null;
  }
}
