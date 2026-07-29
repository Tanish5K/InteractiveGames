import { useEffect, useRef, useState } from "react";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { initHandLandmarker } from "./handLandmarker";
import {
  TwoHandGestureEngine,
  type TwoHandGestureState,
} from "../gestures/twoHandGestureEngine";

export type Status = "loading" | "error" | "ready";

export function useGestureTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const resultRef = useRef<HandLandmarkerResult | null>(null);
  const gestureStateRef = useRef<TwoHandGestureState>({
    Left: null,
    Right: null,
  });
  const engineRef = useRef(new TwoHandGestureEngine());

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      const video = videoRef.current!;
      let handLandmarker;

      try {
        const [cameraStream, landmarker] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: true }),
          initHandLandmarker(),
        ]);
        stream = cameraStream;
        handLandmarker = landmarker;
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera permission denied. Allow camera access and refresh."
            : `Something went wrong: ${(err as Error).message}`,
        );
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      video.srcObject = stream;
      await video.play();
      if (cancelled) return;
      setStatus("ready");

      function detectFrame() {
        if (cancelled) return;
        if (video.readyState >= 2) {
          const timestamp = performance.now();
          const result = handLandmarker!.detectForVideo(video, timestamp);
          resultRef.current = result;

          gestureStateRef.current = engineRef.current.update(
            result,
            timestamp,
            video.videoWidth,
            video.videoHeight,
            window.innerWidth,
            window.innerHeight,
          );
        }
        animationFrameId = requestAnimationFrame(detectFrame);
      }
      detectFrame();
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { videoRef, status, errorMessage, resultRef, gestureStateRef };
}
