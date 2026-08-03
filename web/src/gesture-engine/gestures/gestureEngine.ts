import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Point2DFilter } from "../filters/point2DFilter";
import { PinchDetector, type PinchEvent } from "./pinchDetector";
import { SwipeDetector, type Direction } from "./swipeDetector";
import { FingerCountDetector, type Finger } from "./fingerCountDetector";
import { mapCoverPoint } from "../vision/coverMap";

export interface GestureState {
  cursor: { x: number; y: number } | null;
  isPinching: boolean;
  pinchEvent: PinchEvent;
  swipeDirection: Direction | null;
  extendedFingers: Finger[];
}

export class GestureEngine {
  private cursorFilter = new Point2DFilter(1.2, 0.05); // smooth, low-jitter — for the displayed pointer
  private swipeFilter = new Point2DFilter(1.2, 0.4); // minimal smoothing — preserves true velocity for swipe
  private pinchDetector = new PinchDetector();
  private swipeDetector = new SwipeDetector();
  private fingerCountDetector = new FingerCountDetector();

  update(
    landmarks: NormalizedLandmark[] | null,
    timestampMs: number,
    videoWidth: number,
    videoHeight: number,
    screenWidth: number,
    screenHeight: number,
  ): GestureState {
    if (!landmarks || videoWidth === 0 || videoHeight === 0) {
      const pinchEvent = this.pinchDetector.reset();
      this.swipeDetector.reset();
      this.fingerCountDetector.reset();
      this.cursorFilter.reset();
      this.swipeFilter.reset();
      return {
        cursor: null,
        isPinching: false,
        pinchEvent,
        swipeDirection: null,
        extendedFingers: [],
      };
    }

    const indexTip = landmarks[8];
    const mirroredX = 1 - indexTip.x;

    const smoothedCursor = this.cursorFilter.filter(
      mirroredX,
      indexTip.y,
      timestampMs,
    );
    const smoothedSwipe = this.swipeFilter.filter(
      mirroredX,
      indexTip.y,
      timestampMs,
    );

    const cursor = mapCoverPoint(
      smoothedCursor.x,
      smoothedCursor.y,
      videoWidth,
      videoHeight,
      screenWidth,
      screenHeight,
    );
    const swipePoint = mapCoverPoint(
      smoothedSwipe.x,
      smoothedSwipe.y,
      videoWidth,
      videoHeight,
      screenWidth,
      screenHeight,
    );

    const pinchEvent = this.pinchDetector.update(landmarks);
    const swipeDirection = this.swipeDetector.update(swipePoint, timestampMs);
    const extendedFingers = this.fingerCountDetector.update(landmarks);

    return {
      cursor,
      isPinching: this.pinchDetector.isPinching(),
      pinchEvent,
      swipeDirection,
      extendedFingers,
    };
  }
}
