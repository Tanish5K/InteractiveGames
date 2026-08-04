import type { Direction } from "../../input/types";

export type Cell = { x: number; y: number };
export type GameStatus = "playing" | "gameover";

export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 40;

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
const DX: Record<Direction, number> = { up: 0, down: 0, left: -1, right: 1 };
const DY: Record<Direction, number> = { up: -1, down: 1, left: 0, right: 0 };

export class SnakeGame {
  readonly gridWidth: number;
  readonly gridHeight: number;
  snake: Cell[] = [];
  direction: Direction = "right";
  private pendingDirection: Direction = "right";
  food: Cell = { x: 0, y: 0 };
  status: GameStatus = "playing";
  score = 0;

  constructor(gridWidth = GRID_WIDTH, gridHeight = GRID_HEIGHT) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.reset();
  }

  reset() {
    const midX = Math.floor(this.gridWidth / 2);
    const midY = Math.floor(this.gridHeight / 2);
    this.snake = [
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
      { x: midX - 3, y: midY },
    ];
    this.direction = "right";
    this.pendingDirection = "right";
    this.status = "playing";
    this.score = 0;
    this.placeFood();
  }

  setDirection(dir: Direction) {
    if (dir === OPPOSITE[this.direction]) return;
    this.pendingDirection = dir;
  }

  private placeFood() {
    let cell: Cell;
    do {
      cell = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight),
      };
    } while (this.snake.some((s) => s.x === cell.x && s.y === cell.y));
    this.food = cell;
  }

  tick() {
    if (this.status !== "playing") return;

    this.direction = this.pendingDirection;
    const head = this.snake[0];
    const next: Cell = {
      x: head.x + DX[this.direction],
      y: head.y + DY[this.direction],
    };

    const hitWall =
      next.x < 0 ||
      next.x >= this.gridWidth ||
      next.y < 0 ||
      next.y >= this.gridHeight;
    const hitSelf = this.snake.some((s) => s.x === next.x && s.y === next.y);
    if (hitWall || hitSelf) {
      this.status = "gameover";
      return;
    }

    this.snake.unshift(next);
    if (next.x === this.food.x && next.y === this.food.y) {
      this.score++;
      this.placeFood();
    } else {
      this.snake.pop();
    }
  }
}
