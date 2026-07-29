import { useEffect, useRef, useState } from "react";
import { initHandLandmarker } from "../gesture-engine/worker/handLandmarker";
import { HAND_CONNECTIONS } from "../gesture-engine/worker/handConnections";

type Status = "loading" | "error" | "ready";

// Converts a normalized (0–1) landmark point into on-screen pixel coords
function mapCoverPoint(
  normX: number,
  normY: number,
  videoW: number,
  videoH: number,
  canvasW: number,
  canvasH: number,
) {
  const scale = Math.max(canvasW / videoW, canvasH / videoH);
  const offsetX = (videoW * scale - canvasW) / 2;
  const offsetY = (videoH * scale - canvasH) / 2;
  return {
    x: normX * videoW * scale - offsetX,
    y: normY * videoH * scale - offsetY,
  };
}

export function HandTrackingDebug() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;
    let cancelled = false;

    function resizeCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

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

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      setStatus("ready");

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      function detectFrame() {
        if (cancelled) return;
        if (video.readyState >= 2) {
          const result = handLandmarker!.detectForVideo(
            video,
            performance.now(),
          );
          const videoW = video.videoWidth;
          const videoH = video.videoHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          for (const landmarks of result.landmarks) {
            ctx.strokeStyle = "#00ff88";
            ctx.lineWidth = 2;
            for (const [start, end] of HAND_CONNECTIONS) {
              const p1 = mapCoverPoint(
                landmarks[start].x,
                landmarks[start].y,
                videoW,
                videoH,
                canvas.width,
                canvas.height,
              );
              const p2 = mapCoverPoint(
                landmarks[end].x,
                landmarks[end].y,
                videoW,
                videoH,
                canvas.width,
                canvas.height,
              );
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
            ctx.fillStyle = "#ff2288";
            for (const point of landmarks) {
              const p = mapCoverPoint(
                point.x,
                point.y,
                videoW,
                videoH,
                canvas.width,
                canvas.height,
              );
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
        animationFrameId = requestAnimationFrame(detectFrame);
      }

      detectFrame();
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {status === "error" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
          <p className="text-center text-sm text-red-300">{errorMessage}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full scale-x-[-1] ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}