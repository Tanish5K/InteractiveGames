// Each pair is [startLandmarkIndex, endLandmarkIndex]
// Landmark indices: 0 = wrist, 1-4 = thumb, 5-8 = index, 9-12 = middle, 13-16 = ring, 17-20 = pinky
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // index finger
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12], // middle finger (+ palm link from index base)
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16], // ring finger (+ palm link from middle base)
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20], // pinky (+ palm link from ring base)
  [0, 17], // wrist to pinky base, closes the palm
];
