import { OneEuroFilter } from "./oneEuroFilter";

export class Point2DFilter {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;

  constructor(minCutoff = 1.0, beta = 0.007) {
    this.xFilter = new OneEuroFilter(minCutoff, beta);
    this.yFilter = new OneEuroFilter(minCutoff, beta);
  }

  filter(x: number, y: number, timestampMs: number) {
    return {
      x: this.xFilter.filter(x, timestampMs),
      y: this.yFilter.filter(y, timestampMs),
    };
  }
}