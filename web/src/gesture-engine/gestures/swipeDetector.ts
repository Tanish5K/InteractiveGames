export type Direction = "up" | "down" | "left" | "right";

export class SwipeDetector {
  private prevPos: { x: number; y: number } | null = null;
  private prevTime: number | null = null;
  private streak = 0;
  private streakDirection: Direction | null = null;
  private cooldownUntil = 0;
  private velocityThreshold: number;
  private requiredStreak: number;
  private cooldownMs: number;

  constructor(
    velocityThreshold = 0.3, //Fine tune later
    requiredStreak = 3,
    cooldownMs = 150,
  ) {
    this.velocityThreshold = velocityThreshold;
    this.requiredStreak = requiredStreak;
    this.cooldownMs = cooldownMs;
  }

  update(pos: { x: number; y: number }, timestampMs: number): Direction | null {
    if (this.prevPos === null || this.prevTime === null) {
      this.prevPos = pos;
      this.prevTime = timestampMs;
      return null;
    }

    const dt = timestampMs - this.prevTime;
    const dx = pos.x - this.prevPos.x;
    const dy = pos.y - this.prevPos.y;
    this.prevPos = pos;
    this.prevTime = timestampMs;
    if (dt <= 0) return null;

    if (timestampMs < this.cooldownUntil) {
      this.streak = 0;
      return null;
    }

    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const magnitude = horizontal ? Math.abs(dx) : Math.abs(dy);
    const velocity = magnitude / dt;

    // TEMPORARY — remove once velocityThreshold is tuned
    console.log("swipe velocity:", velocity.toFixed(2), "threshold:", this.velocityThreshold);

    let direction: Direction | null = null;
    if (velocity > this.velocityThreshold) {
      direction = horizontal
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up";
    }

    if (direction && direction === this.streakDirection) {
      this.streak++;
    } else {
      this.streakDirection = direction;
      this.streak = direction ? 1 : 0;
    }

    if (direction && this.streak >= this.requiredStreak) {
      this.cooldownUntil = timestampMs + this.cooldownMs;
      this.streak = 0;
      return direction;
    }
    return null;
  }

  reset() {
    this.prevPos = null;
    this.prevTime = null;
    this.streak = 0;
    this.streakDirection = null;
  }
}
