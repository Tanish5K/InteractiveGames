// A basic exponential smoother: blends a new value with the previous output. 
class LowPassFilter {
  private lastOutput: number | null = null;
  filter(value: number, alpha: number): number {
    const output =
      this.lastOutput === null
        ? value
        : alpha * value + (1 - alpha) * this.lastOutput;
    this.lastOutput = output;
    return output;
  }
  last(): number | null {
    return this.lastOutput;
  }
  reset() {
    this.lastOutput = null;
  }
}

// Converts a cutoff frequency + time step into alpha blend ratio
// Higher cutoff = less smoothing = alpha closer to 1.
function smoothingFactor(dt: number, cutoff: number): number {
  const r = 2 * Math.PI * cutoff * dt;
  return r / (r + 1);
}

export class OneEuroFilter {
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTimestamp: number | null = null;

  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  // timestampMs should be a consistently increasing clock — use performance.now()
  filter(value: number, timestampMs: number): number {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestampMs;
      this.xFilter.filter(value, 1);
      return value;
    }

    const dt = (timestampMs - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestampMs;
    if (dt <= 0) return this.xFilter.last() ?? value;

    // Estimate how fast the raw signal is currently changing.
    const rawSpeed = (value - (this.xFilter.last() ?? value)) / dt;
    const smoothedSpeed = this.dxFilter.filter(
      rawSpeed,
      smoothingFactor(dt, this.dCutoff),
    );

    const cutoff = this.minCutoff + this.beta * Math.abs(smoothedSpeed);

    return this.xFilter.filter(value, smoothingFactor(dt, cutoff));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTimestamp = null;
  }
}
