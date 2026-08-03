import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type Finger = "thumb" | "index" | "middle" | "ring" | "pinky";

const NON_THUMB_JOINTS: Record<
  Exclude<Finger, "thumb">,
  { tip: number; pip: number }
> = {
  index: { tip: 8, pip: 6 },
  middle: { tip: 12, pip: 10 },
  ring: { tip: 16, pip: 14 },
  pinky: { tip: 20, pip: 18 },
};

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class FingerCountDetector {
  private thumbExtended = false;
  private thumbEnterThreshold: number;
  private thumbExitThreshold: number;

  constructor(
    thumbEnterThreshold = 0.55,
    thumbExitThreshold = 0.4,
  ) {
    this.thumbEnterThreshold = thumbEnterThreshold;
    this.thumbExitThreshold = thumbExitThreshold;
  }

  update(landmarks: NormalizedLandmark[]): Finger[] {
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const handScale = dist(wrist, middleMcp);

    const extended: Finger[] = [];

    (Object.keys(NON_THUMB_JOINTS) as Exclude<Finger, "thumb">[]).forEach(
      (finger) => {
        const { tip, pip } = NON_THUMB_JOINTS[finger];
        if (dist(landmarks[tip], wrist) > dist(landmarks[pip], wrist)) {
          extended.push(finger);
        }
      },
    );

    const thumbSpread = dist(landmarks[4], indexMcp) / handScale;
    if (!this.thumbExtended && thumbSpread > this.thumbEnterThreshold) {
      this.thumbExtended = true;
    } else if (this.thumbExtended && thumbSpread < this.thumbExitThreshold) {
      this.thumbExtended = false;
    }
    if (this.thumbExtended) extended.push("thumb");

    return extended;
  }

  reset() {
    this.thumbExtended = false;
  }
}