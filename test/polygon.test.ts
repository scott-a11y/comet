import { describe, expect, it } from 'vitest';
import { validateSimplePolygon } from '@/lib/geometry/polygon';

describe('validateSimplePolygon', () => {
  it('accepts a simple closed rectangle', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 0, y: 5 },
      { x: 0, y: 0 },
    ];
    expect(validateSimplePolygon(pts)).toEqual({ ok: true });
  });

  it('rejects not-closed rings', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 0, y: 5 },
    ];
    const res = validateSimplePolygon(pts);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/not closed/i);
  });

  it('rejects self-intersecting polygons', () => {
    // Bow-tie
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 10, y: 0 },
      { x: 0, y: 0 },
    ];
    const res = validateSimplePolygon(pts);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/self-intersects/i);
  });
});
