"use client";

import { useCallback, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Layer, Line, Circle, Stage, Text, Rect } from 'react-konva';
import type { BuildingFloorGeometry, BuildingVertex, BuildingWallSegment } from '@/lib/types/building-geometry';
import { validateSimplePolygon } from '@/lib/geometry/polygon';

type Mode = 'PAN' | 'DRAW' | 'CALIBRATE' | 'EDIT';

type Props = {
  initialGeometry?: BuildingFloorGeometry | null;
  initialScaleFtPerUnit?: number | null;
  onChange: (payload: {
    geometry: BuildingFloorGeometry | null;
    scaleFtPerUnit: number | null;
    floorPlanePoints: Array<{ x: number; y: number }> | null;
    validationError: string | null;
  }) => void;
};

const GRID_SIZE = 25;
const SNAP_DIST = 10;

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function snapAngle(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx); // rad
  const snap = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
  const len = Math.hypot(dx, dy);
  return { x: from.x + Math.cos(snap) * len, y: from.y + Math.sin(snap) * len };
}

function snapToGrid(p: { x: number; y: number }, grid = GRID_SIZE) {
  return {
    x: Math.round(p.x / grid) * grid,
    y: Math.round(p.y / grid) * grid,
  };
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildRingFromVertices(vertices: BuildingVertex[]) {
  // In this minimal v1 editor we assume the user is drawing a single polyline in order.
  // ringVertexIds becomes [v0,v1,...,vn] (without repeating v0).
  return vertices.map((v) => v.id);
}

export function WallEditor({ initialGeometry, initialScaleFtPerUnit, onChange }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const [mode, setMode] = useState<Mode>('DRAW');
  const [showGrid, setShowGrid] = useState(true);
  const [stage, setStage] = useState({ scale: 1, x: 0, y: 0 });

  const [vertices, setVertices] = useState<BuildingVertex[]>(initialGeometry?.vertices ?? []);
  const [segments, setSegments] = useState<BuildingWallSegment[]>(initialGeometry?.segments ?? []);
  const [scaleFtPerUnit, setScaleFtPerUnit] = useState<number | null>(initialScaleFtPerUnit ?? null);

  // History for undo (simple snapshot)
  const [history, setHistory] = useState<Array<{ vertices: BuildingVertex[]; segments: BuildingWallSegment[] }>>([]);

  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [calibration, setCalibration] = useState<{ a: { x: number; y: number } | null; b: { x: number; y: number } | null; realFt: string }>(
    { a: null, b: null, realFt: '' }
  );

  const [showMeasurements, setShowMeasurements] = useState(true);
  const [drawByMeasurement, setDrawByMeasurement] = useState(false);
  const [pendingLengthFt, setPendingLengthFt] = useState<string>('');

  const pushHistory = useCallback((next: { vertices: BuildingVertex[]; segments: BuildingWallSegment[] }) => {
    setHistory((h) => [...h.slice(-50), { vertices: next.vertices, segments: next.segments }]);
  }, []);

  const currentGeom: BuildingFloorGeometry | null = useMemo(() => {
    if (vertices.length < 3) return null;
    return {
      version: 1,
      vertices,
      segments,
      ringVertexIds: buildRingFromVertices(vertices),
    };
  }, [vertices, segments]);

  const floorPlanePoints = useMemo(() => {
    if (!currentGeom?.ringVertexIds) return null;
    const pts = currentGeom.ringVertexIds
      .map((id) => vertices.find((v) => v.id === id))
      .filter(Boolean)
      .map((v) => ({ x: (v as BuildingVertex).x, y: (v as BuildingVertex).y }));
    if (pts.length < 3) return null;
    return [...pts, { ...pts[0] }];
  }, [currentGeom, vertices]);

  const validationError = useMemo(() => {
    if (!floorPlanePoints) return 'Draw at least 3 vertices and close the loop.';
    const res = validateSimplePolygon(floorPlanePoints);
    return res.ok ? null : res.reason || 'Invalid polygon';
  }, [floorPlanePoints]);

  const emitChange = useCallback(
    (next?: { vertices?: BuildingVertex[]; segments?: BuildingWallSegment[]; scaleFtPerUnit?: number | null }) => {
      const v = next?.vertices ?? vertices;
      const s = next?.segments ?? segments;
      const scale = next?.scaleFtPerUnit ?? scaleFtPerUnit;

      const geom = v.length >= 3
        ? ({ version: 1, vertices: v, segments: s, ringVertexIds: buildRingFromVertices(v) } as BuildingFloorGeometry)
        : null;

      const pts = geom?.ringVertexIds
        ? [...geom.ringVertexIds.map((id) => {
            const vv = v.find((x) => x.id === id);
            return { x: vv?.x ?? 0, y: vv?.y ?? 0 };
          }), { x: v[0]?.x ?? 0, y: v[0]?.y ?? 0 }]
        : null;

      const vErr = pts ? (validateSimplePolygon(pts).ok ? null : validateSimplePolygon(pts).reason || 'Invalid polygon') : 'Draw at least 3 vertices and close the loop.';

      onChange({
        geometry: geom,
        scaleFtPerUnit: scale,
        floorPlanePoints: pts,
        validationError: vErr,
      });
    },
    [vertices, segments, scaleFtPerUnit, onChange]
  );

  const worldPointer = (e: any) => {
    const st = stageRef.current;
    if (!st) return null;
    const pos = st.getPointerPosition();
    if (!pos) return null;
    const transform = st.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pos);
  };

  const findSnapVertex = (p: { x: number; y: number }) => {
    let best: BuildingVertex | null = null;
    let bestD = Infinity;
    for (const v of vertices) {
      const d = dist(p, v);
      if (d < SNAP_DIST && d < bestD) {
        best = v;
        bestD = d;
      }
    }
    return best;
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const st = stageRef.current;
    if (!st) return;
    const oldScale = st.scaleX();
    const pointer = st.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - st.x()) / oldScale,
      y: (pointer.y - st.y()) / oldScale,
    };
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clamped = Math.max(0.1, Math.min(6, newScale));
    setStage({
      scale: clamped,
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    });
  };

  const addVertex = useCallback(
    (pRaw: { x: number; y: number }) => {
      // snap endpoint to existing vertex
      let p = snapToGrid(pRaw);
      const snapV = findSnapVertex(p);
      if (snapV) p = { x: snapV.x, y: snapV.y };

      // angle snap relative to previous vertex
      const prev = vertices[vertices.length - 1];
      if (prev) p = snapAngle(prev, p);

      // if close to start, close loop by reusing first vertex
      const first = vertices[0];
      if (first && dist(p, first) < SNAP_DIST && vertices.length >= 3) {
        const nextSegments = [...segments, { id: newId('seg'), a: prev.id, b: first.id }];
        const nextVertices = [...vertices];
        pushHistory({ vertices: nextVertices, segments: nextSegments });
        setSegments(nextSegments);
        emitChange({ vertices: nextVertices, segments: nextSegments });
        return;
      }

      // create new vertex
      const v: BuildingVertex = { id: newId('v'), x: p.x, y: p.y };
      const nextVertices = [...vertices, v];
      const nextSegments = prev ? [...segments, { id: newId('seg'), a: prev.id, b: v.id }] : [...segments];
      pushHistory({ vertices: nextVertices, segments: nextSegments });
      setVertices(nextVertices);
      setSegments(nextSegments);
      emitChange({ vertices: nextVertices, segments: nextSegments });
    },
    [vertices, segments, pushHistory, emitChange]
  );

  const undo = () => {
    setHistory((h) => {
      const next = [...h];
      const last = next.pop();
      if (!last) return h;
      setVertices(last.vertices);
      setSegments(last.segments);
      // emit after state set
      queueMicrotask(() => emitChange({ vertices: last.vertices, segments: last.segments }));
      return next;
    });
  };

  const clearAll = () => {
    pushHistory({ vertices, segments });
    setVertices([]);
    setSegments([]);
    emitChange({ vertices: [], segments: [] });
  };

  const deleteVertex = (id: string) => {
    pushHistory({ vertices, segments });
    const nextVertices = vertices.filter((v) => v.id !== id);
    const nextSegments = segments.filter((s) => s.a !== id && s.b !== id);
    setVertices(nextVertices);
    setSegments(nextSegments);
    emitChange({ vertices: nextVertices, segments: nextSegments });
  };

  const deleteSegment = (id: string) => {
    pushHistory({ vertices, segments });
    const nextSegments = segments.filter((s) => s.id !== id);
    setSegments(nextSegments);
    emitChange({ vertices, segments: nextSegments });
  };

  const handleMouseMove = (e: any) => {
    const p = worldPointer(e);
    if (!p) return;
    setPointerPos(p);
  };

  const handleStageClick = (e: any) => {
    // Ignore clicks on shapes in edit mode
    if (e.target && e.target !== e.target.getStage()) {
      return;
    }

    const p = worldPointer(e);
    if (!p) return;

    if (mode === 'DRAW') {
      if (!drawByMeasurement || vertices.length === 0) {
        addVertex(p);
      } else {
        const prev = vertices[vertices.length - 1];
        const lenFt = parseFloat(pendingLengthFt);
        if (!scaleFtPerUnit) {
          // Measurement draw requires calibration.
          return;
        }
        if (!isFinite(lenFt) || lenFt <= 0) {
          return;
        }

        // Use click direction, but enforce the desired length.
        let directionPoint = snapToGrid(p);
        const snapV = findSnapVertex(directionPoint);
        if (snapV) directionPoint = { x: snapV.x, y: snapV.y };
        directionPoint = snapAngle(prev, directionPoint);

        const dx = directionPoint.x - prev.x;
        const dy = directionPoint.y - prev.y;
        const d = Math.hypot(dx, dy);
        if (d <= 0) return;

        const lenUnits = lenFt / scaleFtPerUnit;
        const nextP = { x: prev.x + (dx / d) * lenUnits, y: prev.y + (dy / d) * lenUnits };
        addVertex(nextP);
      }
    }

    if (mode === 'CALIBRATE') {
      const snapped = snapToGrid(p);
      if (!calibration.a) {
        setCalibration((c) => ({ ...c, a: snapped }));
      } else if (!calibration.b) {
        setCalibration((c) => ({ ...c, b: snapped }));
      } else {
        setCalibration({ a: snapped, b: null, realFt: '' });
      }
    }
  };

  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    const w = 2000;
    const h = 1200;
    const lines: any[] = [];
    for (let x = -w; x <= w; x += GRID_SIZE) {
      lines.push(
        <Line key={`gx-${x}`} points={[x, -h, x, h]} stroke="#334155" strokeWidth={1} opacity={0.25} listening={false} />
      );
    }
    for (let y = -h; y <= h; y += GRID_SIZE) {
      lines.push(
        <Line key={`gy-${y}`} points={[-w, y, w, y]} stroke="#334155" strokeWidth={1} opacity={0.25} listening={false} />
      );
    }
    return lines;
  }, [showGrid]);

  const vertexMap = useMemo(() => new Map(vertices.map((v) => [v.id, v])), [vertices]);

  const segmentLines = useMemo(() => {
    return segments.map((s) => {
      const a = vertexMap.get(s.a);
      const b = vertexMap.get(s.b);
      if (!a || !b) return null;
      return (
        <Line
          key={s.id}
          points={[a.x, a.y, b.x, b.y]}
          stroke="#f87171"
          strokeWidth={3}
          lineCap="round"
          onDblClick={() => mode === 'EDIT' && deleteSegment(s.id)}
        />
      );
    });
  }, [segments, vertexMap, mode]);

  const vertexDots = useMemo(() => {
    return vertices.map((v) => (
      <Circle
        key={v.id}
        x={v.x}
        y={v.y}
        radius={6}
        fill={v === vertices[0] ? '#22c55e' : '#60a5fa'}
        stroke="#0f172a"
        strokeWidth={2}
        draggable={mode === 'EDIT'}
        onDragMove={(e) => {
          const pos = e.target.position();
          const snapped = snapToGrid(pos);
          e.target.position(snapped);
        }}
        onDragEnd={(e) => {
          if (mode !== 'EDIT') return;
          const pos = e.target.position();
          const snapped = snapToGrid(pos);
          pushHistory({ vertices, segments });
          const nextVertices = vertices.map((vv) => (vv.id === v.id ? { ...vv, x: snapped.x, y: snapped.y } : vv));
          setVertices(nextVertices);
          emitChange({ vertices: nextVertices });
        }}
        onDblClick={() => mode === 'EDIT' && deleteVertex(v.id)}
      />
    ));
  }, [vertices, mode, pushHistory, segments, emitChange]);

  const previewLine = useMemo(() => {
    if (mode !== 'DRAW' || vertices.length === 0 || !pointerPos) return null;
    const prev = vertices[vertices.length - 1];
    let p = snapToGrid(pointerPos);
    const snapV = findSnapVertex(p);
    if (snapV) p = { x: snapV.x, y: snapV.y };
    p = snapAngle(prev, p);
    return <Line points={[prev.x, prev.y, p.x, p.y]} stroke="#fb7185" strokeWidth={2} dash={[10, 6]} listening={false} />;
  }, [mode, vertices, pointerPos]);

  const segmentLabels = useMemo(() => {
    if (!showMeasurements) return [];
    if (!scaleFtPerUnit) return [];

    return segments.map((s) => {
      const a = vertexMap.get(s.a);
      const b = vertexMap.get(s.b);
      if (!a || !b) return null;

      const lenUnits = dist(a, b);
      const lenFt = lenUnits * scaleFtPerUnit;
      const m = midpoint(a, b);
      const label = `${lenFt.toFixed(1)}'`;

      return (
        <Text
          key={`label-${s.id}`}
          x={m.x + 6}
          y={m.y + 6}
          text={label}
          fontSize={12}
          fill="#e2e8f0"
          listening={false}
        />
      );
    });
  }, [segments, vertexMap, showMeasurements, scaleFtPerUnit]);

  const calibrationLine = useMemo(() => {
    if (mode !== 'CALIBRATE' || !calibration.a) return null;
    const a = calibration.a;
    const b = calibration.b ?? (pointerPos ? snapToGrid(pointerPos) : null);
    if (!b) return null;
    return <Line points={[a.x, a.y, b.x, b.y]} stroke="#fbbf24" strokeWidth={3} dash={[6, 4]} listening={false} />;
  }, [mode, calibration, pointerPos]);

  const applyCalibration = () => {
    if (!calibration.a || !calibration.b) return;
    const real = parseFloat(calibration.realFt);
    if (!isFinite(real) || real <= 0) return;
    const measuredUnits = dist(calibration.a, calibration.b);
    if (measuredUnits <= 0) return;
    const next = real / measuredUnits;
    setScaleFtPerUnit(next);
    emitChange({ scaleFtPerUnit: next });
  };

  return (
    <div className="bg-slate-900/30 border border-slate-700 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setMode('DRAW')}
            className={`px-3 py-1 text-xs rounded ${mode === 'DRAW' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => setMode('EDIT')}
            className={`px-3 py-1 text-xs rounded ${mode === 'EDIT' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('CALIBRATE')}
            className={`px-3 py-1 text-xs rounded ${mode === 'CALIBRATE' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-200'}`}
          >
            Calibrate
          </button>
          <button
            type="button"
            onClick={() => setShowGrid((g) => !g)}
            className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-200"
          >
            {showGrid ? 'Hide grid' : 'Show grid'}
          </button>

          <button
            type="button"
            onClick={() => setShowMeasurements((m) => !m)}
            className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-200"
          >
            {showMeasurements ? 'Hide lengths' : 'Show lengths'}
          </button>

          <button type="button" onClick={undo} disabled={history.length === 0} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-200 disabled:opacity-50">
            Undo
          </button>
          <button type="button" onClick={clearAll} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-200">
            Clear
          </button>
        </div>

        <div className="text-xs text-slate-300">
          Scale: {scaleFtPerUnit ? `${scaleFtPerUnit.toFixed(4)} ft/unit` : 'not set'} • Zoom: {(stage.scale * 100).toFixed(0)}%
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-slate-400 mb-3">
          <strong>How to use:</strong> Draw walls by clicking to place vertices. Click near the first point to close.
          Use <em>Calibrate</em> to draw a reference line and enter its real length. In <em>Edit</em>, drag vertices to move; double-click a vertex/segment to delete.
        </div>

        {mode === 'CALIBRATE' && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <div className="text-slate-300">Reference length (ft):</div>
            <input
              value={calibration.realFt}
              onChange={(e) => setCalibration((c) => ({ ...c, realFt: e.target.value }))}
              className="w-32 px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white"
              placeholder="e.g. 20"
            />
            <button type="button" onClick={applyCalibration} className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded">
              Apply
            </button>
            <div className="text-xs text-slate-400">Tip: click two points to define the reference line.</div>
          </div>
        )}

        {mode === 'DRAW' && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={drawByMeasurement}
                onChange={(e) => setDrawByMeasurement(e.target.checked)}
              />
              Draw by measurement
            </label>
            {drawByMeasurement && (
              <>
                <div className="text-slate-300">Next segment length (ft):</div>
                <input
                  value={pendingLengthFt}
                  onChange={(e) => setPendingLengthFt(e.target.value)}
                  className="w-32 px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white"
                  placeholder="e.g. 8"
                />
                {!scaleFtPerUnit && (
                  <div className="text-xs text-amber-300">Calibrate first to enable measured lengths.</div>
                )}
                <div className="text-xs text-slate-400">Tip: click to set direction; the segment will snap to 0/90/180/270 and use the entered length.</div>
              </>
            )}
          </div>
        )}

        {validationError && (
          <div className="mb-3 p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
            {validationError}
          </div>
        )}

        <div className="h-[420px] bg-slate-950 rounded border border-slate-800 overflow-hidden">
          <Stage
            ref={stageRef}
            width={800}
            height={420}
            scaleX={stage.scale}
            scaleY={stage.scale}
            x={stage.x}
            y={stage.y}
            draggable={mode !== 'DRAW' && mode !== 'CALIBRATE'}
            onDragEnd={(e) => setStage((s) => ({ ...s, x: e.target.x(), y: e.target.y() }))}
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseDown={handleStageClick}
          >
            <Layer>
              <Rect x={0} y={0} width={800} height={420} fill="#020617" listening={false} />
              {gridLines}
              {segmentLines}
              {segmentLabels}
              {previewLine}
              {vertexDots}
              {calibrationLine}
              <Text
                x={10}
                y={10}
                text={
                  mode === 'DRAW'
                    ? 'Mode: Draw (click to add vertices, click near first to close)'
                    : mode === 'EDIT'
                      ? 'Mode: Edit (drag vertices; double-click to delete)'
                      : mode === 'CALIBRATE'
                        ? 'Mode: Calibrate (click two points)'
                        : 'Mode: Pan'
                }
                fontSize={12}
                fill="#cbd5e1"
              />
            </Layer>
          </Stage>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Snapping: endpoints within {SNAP_DIST}px snap • angles snap to 0/90/180/270 • grid {GRID_SIZE}px.
        </div>
      </div>
    </div>
  );
}