import type { BuildingFloorGeometry, BuildingFloorPlane, BuildingVertex } from '@/lib/types/building-geometry';

const EPS = 1e-6;

function cross(ax: number, ay: number, bx: number, by: number) {
  return ax * by - ay * bx;
}

function segmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  q1: { x: number; y: number },
  q2: { x: number; y: number }
) {
  // Standard orientation test with bounding box
  const o = (a: any, b: any, c: any) => {
    const v = cross(b.x - a.x, b.y - a.y, c.x - a.x, c.y - a.y);
    if (Math.abs(v) < EPS) return 0;
    return v > 0 ? 1 : 2;
  };

  const onSeg = (a: any, b: any, c: any) => {
    return (
      Math.min(a.x, b.x) - EPS <= c.x &&
      c.x <= Math.max(a.x, b.x) + EPS &&
      Math.min(a.y, b.y) - EPS <= c.y &&
      c.y <= Math.max(a.y, b.y) + EPS
    );
  };

  const o1 = o(p1, p2, q1);
  const o2 = o(p1, p2, q2);
  const o3 = o(q1, q2, p1);
  const o4 = o(q1, q2, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  // Collinear special cases
  if (o1 === 0 && onSeg(p1, p2, q1)) return true;
  if (o2 === 0 && onSeg(p1, p2, q2)) return true;
  if (o3 === 0 && onSeg(q1, q2, p1)) return true;
  if (o4 === 0 && onSeg(q1, q2, p2)) return true;
  return false;
}

export function validateSimplePolygon(points: Array<{ x: number; y: number }>): {
  ok: boolean;
  reason?: string;
} {
  if (points.length < 3) return { ok: false, reason: 'Need at least 3 points' };

  // Closed ring requirement (last point equals first)
  const first = points[0];
  const last = points[points.length - 1];
  if (Math.abs(first.x - last.x) > EPS || Math.abs(first.y - last.y) > EPS) {
    return { ok: false, reason: 'Polygon is not closed' };
  }

  // Self intersection: test all non-adjacent edges
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < points.length - 1; i++) edges.push([i, i + 1]);

  const sharesEndpoint = (e1: [number, number], e2: [number, number]) => {
    const set = new Set([e1[0], e1[1]]);
    return set.has(e2[0]) || set.has(e2[1]);
  };

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];

      // Skip edges that share endpoints (adjacent in the ring)
      if (sharesEndpoint(e1, e2)) continue;

      // In a closed ring, the first and last edges also share a point (the closing vertex)
      if (i === 0 && j === edges.length - 1) continue;

      if (segmentsIntersect(points[e1[0]], points[e1[1]], points[e2[0]], points[e2[1]])) {
        return { ok: false, reason: 'Polygon self-intersects' };
      }
    }
  }

  return { ok: true };
}

export function geometryToFloorPlane(geom: BuildingFloorGeometry): {
  plane: BuildingFloorPlane | null;
  reason?: string;
} {
  const vMap = new Map<string, BuildingVertex>();
  for (const v of geom.vertices) vMap.set(v.id, v);

  const ring = geom.ringVertexIds;
  if (!ring || ring.length < 3) return { plane: null, reason: 'Missing ringVertexIds' };

  const pts = ring.map((id) => {
    const v = vMap.get(id);
    if (!v) throw new Error(`Missing vertex ${id}`);
    return { x: v.x, y: v.y };
  });

  // Ensure closed by repeating first at end
  const first = pts[0];
  const last = pts[pts.length - 1];
  const closedPts = (Math.abs(first.x - last.x) < EPS && Math.abs(first.y - last.y) < EPS)
    ? pts
    : [...pts, { ...first }];

  const valid = validateSimplePolygon(closedPts);
  if (!valid.ok) return { plane: null, reason: valid.reason };

  return { plane: { points: closedPts, closed: true } };
}