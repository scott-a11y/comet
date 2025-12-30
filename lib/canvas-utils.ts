/**
 * Export Konva stage as PNG image
 * @param stage - Konva Stage instance
 * @param filename - Output filename
 * @param dimensions - Export dimensions
 */
export const exportCanvasToPNG = (
  stage: any, // Konva.Stage type
  filename: string,
  dimensions: { width: number; height: number }
) => {
  const dataUrl = stage.toDataURL({
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
    pixelRatio: 3,
    mimeType: "image/png",
  });
  
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Snap coordinate to grid
 * @param value - Coordinate value
 * @param gridSize - Grid cell size (default 10)
 */
export const snapToGridUtil = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Calculate distance between two points
 */
export const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Geometry helpers for wall segment operations
export type Pt = { x: number; y: number };

export function dist(a: Pt, b: Pt) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function segmentExists(
  segments: { a: string; b: string }[],
  a: string,
  b: string
) {
  return segments.some(s => (s.a === a && s.b === b) || (s.a === b && s.b === a));
}

export function pointToSegmentDistance(p: Pt, a: Pt, b: Pt) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;

  const abLen2 = abx * abx + aby * aby;
  if (abLen2 === 0) return Math.hypot(apx, apy);

  let t = (apx * abx + apy * aby) / abLen2;
  t = Math.max(0, Math.min(1, t));

  const cx = a.x + t * abx;
  const cy = a.y + t * aby;
  return Math.hypot(p.x - cx, p.y - cy);
}

/**
 * Convert feet to pixels based on scale factor
 */
export const feetToPixels = (feet: number, scaleFactor: number = 10): number => {
  return feet * scaleFactor;
};

/**
 * Convert pixels to feet based on scale factor
 */
export const pixelsToFeet = (pixels: number, scaleFactor: number = 10): number => {
  return pixels / scaleFactor;
};
