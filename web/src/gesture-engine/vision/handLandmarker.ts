import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;
let loadingPromise: Promise<HandLandmarker> | null = null;

export function initHandLandmarker(): Promise<HandLandmarker> {
  if (handLandmarker) return Promise.resolve(handLandmarker);
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });

    return handLandmarker;
  })();

  return loadingPromise;
}