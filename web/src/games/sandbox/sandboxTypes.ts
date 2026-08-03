export interface SandboxShape {
  id: string;
  kind: "box" | "circle";
  //center coordinates
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}
