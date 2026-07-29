export type Direction = "up" | "down" | "left" | "right";

export class SwipeDetector {
  private prevPos: { x: number; y: number } | null = null;
  private streak = 0;
  private streakDirection: Direction | null = null;
  private cooldownUntil = 0;

  private pixelThreshold: number;
  private requiredStreak: number;
  private cooldownMs: number;

  constructor(pixelThreshold = 40, requiredStreak = 3, cooldownMs = 150) {
    this.pixelThreshold = pixelThreshold;
    this.requiredStreak = requiredStreak;
    this.cooldownMs = cooldownMs;
  }

  update(pos: { x: number; y: number }, timestampMs: number): Direction | null {
    if (this.prevPos === null) {
      this.prevPos = pos;
      return null;
    }

    const dx = pos.x - this.prevPos.x;
    const dy = pos.y - this.prevPos.y;
    this.prevPos = pos;

    if (timestampMs < this.cooldownUntil) {
      this.streak = 0;
      return null;
    }

    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const magnitude = horizontal ? Math.abs(dx) : Math.abs(dy);

    let direction: Direction | null = null;
    if (magnitude > this.pixelThreshold) {
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
    this.streak = 0;
    this.streakDirection = null;
  }
}
