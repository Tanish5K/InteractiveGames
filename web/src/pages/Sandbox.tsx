import { useEffect, useRef, useState } from "react";
import { inputBus } from "../input/inputBus";
import type { InputSource, Finger } from "../input/types";
import type { SandboxShape } from "../games/sandbox/sandboxTypes";
import { SandboxShapeView } from "../games/sandbox/SandboxShapeView";
import { GlassPanel } from "../ui/GlassPanel";
import { GlassButton } from "../ui/GlassButton";

interface Props {
  onBack: () => void;
}

interface HeldState {
  id: string;
  source: InputSource;
  offsetX: number;
  offsetY: number;
  liveX: number;
  liveY: number;
}

interface TwoHandState {
  shapeId: string;
  baseDist: number;
  baseWidth: number;
  baseHeight: number;
  liveWidth?: number;
  liveHeight?: number;
}

function hitTest(
  shape: SandboxShape,
  point: { x: number; y: number },
): boolean {
  // Axis-aligned box test — a known simplification, fine here since
  // shapes aren't rotated in this version. Worth revisiting if rotation
  // is added later, since a rotated shape's true bounds tilt with it.
  return (
    point.x >= shape.x - shape.width / 2 &&
    point.x <= shape.x + shape.width / 2 &&
    point.y >= shape.y - shape.height / 2 &&
    point.y <= shape.y + shape.height / 2
  );
}

function isIndexOnly(fingers?: Finger[]): boolean {
  return !!fingers && fingers.length === 1 && fingers[0] === "index";
}

export function Sandbox({ onBack }: Props) {
  const [shapes, setShapes] = useState<SandboxShape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  //Shapes ref and selectedId ref are used to access the current state in the inputBus subscription
  const shapesRef = useRef<SandboxShape[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const shapeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const heldRef = useRef<HeldState | null>(null);
  const twoHandRef = useRef<TwoHandState | null>(null);
  const cursorsRef = useRef<
    Partial<Record<InputSource, { x: number; y: number }>>
  >({});
  const fingersRef = useRef<Partial<Record<InputSource, Finger[]>>>({});
  const lineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    function updateTwoHandGesture(twoHand: TwoHandState) {
      const left = cursorsRef.current["hand-left"];
      const right = cursorsRef.current["hand-right"];
      if (!left || !right) return;

      const dist = Math.hypot(right.x - left.x, right.y - left.y);
      const scale = Math.min(Math.max(dist / twoHand.baseDist, 0.3), 4);
      const width = twoHand.baseWidth * scale;
      const height = twoHand.baseHeight * scale;
      twoHand.liveWidth = width;
      twoHand.liveHeight = height;

      const el = shapeRefs.current[twoHand.shapeId];
      const shape = shapesRef.current.find((s) => s.id === twoHand.shapeId);
      if (el && shape) {
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.left = `${shape.x - width / 2}px`;
        el.style.top = `${shape.y - height / 2}px`;
      }

      if (lineRef.current) {
        lineRef.current.setAttribute("x1", String(left.x));
        lineRef.current.setAttribute("y1", String(left.y));
        lineRef.current.setAttribute("x2", String(right.x));
        lineRef.current.setAttribute("y2", String(right.y));
        lineRef.current.style.opacity = "1";
      }
    }

    function checkTwoHandGesture() {
      const bothIndexOnly =
        isIndexOnly(fingersRef.current["hand-left"]) &&
        isIndexOnly(fingersRef.current["hand-right"]);

      if (bothIndexOnly && !twoHandRef.current) {
        const left = cursorsRef.current["hand-left"];
        const right = cursorsRef.current["hand-right"];
        const targetId = selectedIdRef.current;
        if (!left || !right || !targetId) return;

        const shape = shapesRef.current.find((s) => s.id === targetId);
        if (!shape) return;

        const baseDist = Math.hypot(right.x - left.x, right.y - left.y);
        if (baseDist < 20) return;

        twoHandRef.current = {
          shapeId: targetId,
          baseDist,
          baseWidth: shape.width,
          baseHeight: shape.height,
        };
        heldRef.current = null;
      }

      if (!bothIndexOnly && twoHandRef.current) {
        const twoHand = twoHandRef.current;
        setShapes((prev) =>
          prev.map((s) =>
            s.id === twoHand.shapeId
              ? {
                  ...s,
                  width: twoHand.liveWidth ?? s.width,
                  height: twoHand.liveHeight ?? s.height,
                }
              : s,
          ),
        );
        twoHandRef.current = null;
        if (lineRef.current) lineRef.current.style.opacity = "0";
      }
    }

    return inputBus.subscribe((event) => {
      if (event.type === "cursorMove") {
        cursorsRef.current[event.source] = { x: event.x, y: event.y };

        const held = heldRef.current;
        if (held && held.source === event.source) {
          const shape = shapesRef.current.find((s) => s.id === held.id);
          const el = shapeRefs.current[held.id];
          if (shape && el) {
            const newX = event.x + held.offsetX;
            const newY = event.y + held.offsetY;
            el.style.left = `${newX - shape.width / 2}px`;
            el.style.top = `${newY - shape.height / 2}px`;
            held.liveX = newX;
            held.liveY = newY;
          }
        }

        const twoHand = twoHandRef.current;
        if (
          twoHand &&
          (event.source === "hand-left" || event.source === "hand-right")
        ) {
          updateTwoHandGesture(twoHand);
        }
      }

      if (event.type === "select") {
        //don't start a drag if a scale gesture is in progress
        if (twoHandRef.current) return; 
        const point = { x: event.x, y: event.y };
        const hit = [...shapesRef.current]
          .reverse()
          .find((s) => hitTest(s, point));
        if (hit) {
          heldRef.current = {
            id: hit.id,
            source: event.source,
            offsetX: hit.x - point.x,
            offsetY: hit.y - point.y,
            liveX: hit.x,
            liveY: hit.y,
          };
          setSelectedId(hit.id);
        }
      }

      if (event.type === "deselect") {
        const held = heldRef.current;
        if (held && held.source === event.source) {
          setShapes((prev) =>
            prev.map((s) =>
              s.id === held.id ? { ...s, x: held.liveX, y: held.liveY } : s,
            ),
          );
          heldRef.current = null;
        }
      }

      if (event.type === "fingersChanged") {
        if (event.source === "hand-left" || event.source === "hand-right") {
          fingersRef.current[event.source] = event.fingers;
          checkTwoHandGesture();
        }
      }
    });
  }, []);

  function addShape(kind: "box" | "circle") {
    const id = crypto.randomUUID();
    const newShape: SandboxShape = {
      id,
      kind,
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
      width: 120,
      height: 120,
      color: kind === "box" ? "rgba(56,189,248,0.5)" : "rgba(244,114,182,0.5)",
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedId(id);
  }

  return (
    <div className="relative h-full w-full">
      {shapes.map((shape) => (
        <SandboxShapeView
          key={shape.id}
          shape={shape}
          selected={shape.id === selectedId}
          ref={(el) => {
            shapeRefs.current[shape.id] = el;
          }}
        />
      ))}

      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <line
          ref={lineRef}
          className="stroke-glass-accent"
          strokeWidth={2}
          strokeDasharray="6 6"
          style={{ opacity: 0 }}
        />
      </svg>

      <GlassPanel className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-4 px-6 py-4">
        <GlassButton
          onSelect={() => addShape("box")}
          className="h-14 w-32 text-sm"
        >
          + Box
        </GlassButton>
        <GlassButton
          onSelect={() => addShape("circle")}
          className="h-14 w-32 text-sm"
        >
          + Circle
        </GlassButton>
        <GlassButton onSelect={onBack} className="h-14 w-32 text-sm">
          ← Back
        </GlassButton>
      </GlassPanel>
    </div>
  );
}
