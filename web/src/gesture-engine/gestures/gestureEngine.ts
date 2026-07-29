import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Point2DFilter } from "../filters/point2DFilter";
import { PinchDetector, type PinchEvent } from "./pinchDetector";
import { SwipeDetector, type Direction } from "./swipeDetector";
import { mapCoverPoint } from "../vision/coverMap";

export interface GestureState {
  cursor: { x: number; y: number } | null;
  isPinching: boolean;
  pinchEvent: PinchEvent;
  swipeDirection: Direction | null;
}

export class GestureEngine {
  private cursorFilter = new Point2DFilter(1.2, 0.3);
  private pinchDetector = new PinchDetector();
  private swipeDetector = new SwipeDetector();

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
        return {
            cursor: null, 
            isPinching: false, 
            pinchEvent, swipeDirection: null 
        };
    }

    const indexTip = landmarks[8];
    const mirroredX = 1 - indexTip.x;

    const smoothed = this.cursorFilter.filter(
      mirroredX,
      indexTip.y,
      timestampMs,
    );
    const cursor = mapCoverPoint(
      smoothed.x,
      smoothed.y,
      videoWidth,
      videoHeight,
      screenWidth,
      screenHeight,
    );

    const pinchEvent = this.pinchDetector.update(landmarks);
    const swipeDirection = this.swipeDetector.update(cursor, timestampMs);

    return {
      cursor,
      isPinching: this.pinchDetector.isPinching(),
      pinchEvent,
      swipeDirection,
    };
  }
}
