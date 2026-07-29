// Converts a normalized (0–1) point into on-screen pixel coordinates,
export function mapCoverPoint(
  normX: number,
  normY: number,
  videoW: number,
  videoH: number,
  containerW: number,
  containerH: number,
) {
  const scale = Math.max(containerW / videoW, containerH / videoH);
  const offsetX = (videoW * scale - containerW) / 2;
  const offsetY = (videoH * scale - containerH) / 2;
  return {
    x: normX * videoW * scale - offsetX,
    y: normY * videoH * scale - offsetY,
  };
}
