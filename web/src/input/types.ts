export type InputSource = "mouse" | "hand-left" | "hand-right";
export type Direction = "up" | "down" | "left" | "right";
export type Finger = "thumb" | "index" | "middle" | "ring" | "pinky";

export type InputEvent =
  | { type: "cursorMove"; source: InputSource; x: number; y: number }
  | { type: "select"; source: InputSource; x: number; y: number }
  | { type: "deselect"; source: InputSource }
  | { type: "directionChange"; source: InputSource; direction: Direction }
  | { type: "fingersChanged"; source: InputSource; fingers: Finger[] };
