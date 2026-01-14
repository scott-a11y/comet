"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Line, Circle, Text, Group, Rect } from 'react-konva';
import useImage from 'use-image';
import type { BuildingFloorGeometry, BuildingVertex, BuildingWallSegment, SystemRun } from '@/lib/types/building-geometry';
import { validateSimplePolygon } from '@/lib/geometry/polygon';
import { dist, segmentExists, pointToSegmentDistance } from '@/lib/canvas-utils';
import { useServerAction } from 'zsa-react';
import { generateEquipmentPlacement } from '@/actions/generate-layout';
import toast from 'react-hot-toast';
import { SystemsLayer } from './systems-layer';

type Mode = 'PAN' | 'DRAW' | 'CALIBRATE' | 'EDIT' | 'SYSTEMS';

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

type Guide = { x1: number; y1: number; x2: number; y2: number };
type GhostPoint = { x: number; y: number; isSnapped: boolean; guides: Guide[] };

const GRID_SIZE = 25;
const SNAP_DIST = 10;
const HIT_DIST = 10;

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
  const [ringVertexIds, setRingVertexIds] = useState<string[] | undefined>(initialGeometry?.ringVertexIds);
  const [components, setComponents] = useState<NonNullable<BuildingFloorGeometry['components']>>(initialGeometry?.components ?? []);
  const [systemRuns, setSystemRuns] = useState<NonNullable<BuildingFloorGeometry['systemRuns']>>(initialGeometry?.systemRuns ?? []);
  const [drawingRunPoints, setDrawingRunPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const { execute: executePlacement, isPending: isPlacing } = useServerAction(generateEquipmentPlacement);

  // History for undo
  const [history, setHistory] = useState<Array<{ vertices: BuildingVertex[]; segments: BuildingWallSegment[] }>>([]);

  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [calibration, setCalibration] = useState<{ a: { x: number; y: number } | null; b: { x: number; y: number } | null; realFt: string }>(
    { a: null, b: null, realFt: '' }
  );

  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showMaterials, setShowMaterials] = useState(false);
  const [brickImage] = useImage('/textures/brick.png');
  const [concreteImage] = useImage('/textures/concrete.png');
  const [drywallImage] = useImage('/textures/drywall.png');
  const [drawByMeasurement, setDrawByMeasurement] = useState(false);
  const [pendingLengthFt, setPendingLengthFt] = useState<string>('');
  const [editLengthFt, setEditLengthFt] = useState<string>('');

  // Interaction State (Advanced Editing)
  const [dragState, setDragState] = useState<
    | { type: 'NONE' }
    | { type: 'VERTEX'; id: string; startPos: { x: number; y: number } }
    | { type: 'SEGMENT'; id: string; startA: { x: number; y: number }; startB: { x: number; y: number }; startPointer: { x: number; y: number } }
  >({ type: 'NONE' });

  // 0. Base Memos
  const vertexMap = useMemo(() => new Map(vertices.map((v) => [v.id, v])), [vertices]);
  const vertexById = useMemo(() => {
    const map = new Map<string, BuildingVertex>();
    for (const v of vertices) map.set(v.id, v);
    return map;
  }, [vertices]);

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

  // 1. Shift Key Tracking
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 2. Ghost Point (Depends on Shift, Vertices, Pointer)
  const ghostPoint: GhostPoint | null = useMemo(() => {
    if (mode !== 'DRAW' || !pointerPos) return null;
    let p = snapToGrid(pointerPos);

    // 1. Snap to existing vertices
    const snapV = findSnapVertex(p);
    if (snapV) return { x: snapV.x, y: snapV.y, isSnapped: true, guides: [] };

    if (vertices.length > 0) {
      const prev = vertices[vertices.length - 1];
      // 2. Ortho Snap (Shift)
      let lockedAxis: 'x' | 'y' | null = null;
      if (isShiftHeld) {
        const dx = Math.abs(p.x - prev.x);
        const dy = Math.abs(p.y - prev.y);
        if (dx > dy) { p.y = prev.y; lockedAxis = 'y'; }
        else { p.x = prev.x; lockedAxis = 'x'; }
      }

      // 3. Length Constraint
      const lenFt = parseFloat(pendingLengthFt);
      if (drawByMeasurement && scaleFtPerUnit && scaleFtPerUnit > 0 && isFinite(lenFt) && lenFt > 0) {
        let angle = Math.atan2(p.y - prev.y, p.x - prev.x);
        const angleSnap = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
        if (Math.abs(angle - angleSnap) < 0.2 || isShiftHeld) {
          angle = angleSnap;
        }
        const lenUnits = lenFt / scaleFtPerUnit;
        p = {
          x: prev.x + Math.cos(angle) * lenUnits,
          y: prev.y + Math.sin(angle) * lenUnits
        };
        return { x: p.x, y: p.y, isSnapped: false, guides: [] };
      }

      // 4. Smart Guides
      const guides: Guide[] = [];
      const SNAP_ALIGN = 10 / (stage.scale || 1);
      if (lockedAxis !== 'x') {
        for (const v of vertices) {
          if (v === prev) continue;
          if (Math.abs(p.x - v.x) < SNAP_ALIGN) {
            p.x = v.x;
            guides.push({ x1: v.x, y1: v.y, x2: v.x, y2: p.y });
            break;
          }
        }
      }
      if (lockedAxis !== 'y') {
        for (const v of vertices) {
          if (v === prev) continue;
          if (Math.abs(p.y - v.y) < SNAP_ALIGN) {
            p.y = v.y;
            guides.push({ x1: v.x, y1: v.y, x2: p.x, y2: v.y });
            break;
          }
        }
      }
      if (!isShiftHeld && guides.length === 0 && !drawByMeasurement) {
        p = snapAngle(prev, p);
      }
      return { x: p.x, y: p.y, isSnapped: false, guides };
    }
    return { x: p.x, y: p.y, isSnapped: false, guides: [] };
  }, [mode, pointerPos, vertices, isShiftHeld, pendingLengthFt, drawByMeasurement, scaleFtPerUnit, stage.scale]);


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


  // -- Action Handlers --

  const addVertex = useCallback(
    (pRaw: { x: number; y: number }) => {
      const p = pRaw;
      const prev = vertices[vertices.length - 1]; // Needed for segments

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

  // Helpers for Split/Join Buttons
  const splitSegment = (segId: string) => {
    const s = segments.find(i => i.id === segId);
    if (!s) return;
    const a = vertexById.get(s.a);
    const b = vertexById.get(s.b);
    if (!a || !b) return;

    pushHistory({ vertices, segments });

    const mid = midpoint(a, b);
    const newV: BuildingVertex = { id: newId('v'), x: mid.x, y: mid.y };

    // Inherit thickness from parent segment
    const thick = s.thickness;

    const s1: BuildingWallSegment = { id: newId('seg'), a: s.a, b: newV.id, thickness: thick };
    const s2: BuildingWallSegment = { id: newId('seg'), a: newV.id, b: s.b, thickness: thick };

    const nextVertices = [...vertices, newV];
    const nextSegments = segments.filter(x => x.id !== segId).concat([s1, s2]);

    setVertices(nextVertices);
    setSegments(nextSegments);
    emitChange({ vertices: nextVertices, segments: nextSegments });
    setSelectedSegmentId(null);
  };

  const applySelectedSegmentLength = () => {
    if (mode !== 'EDIT') return;
    if (!selectedSegmentId) return;
    if (!scaleFtPerUnit || scaleFtPerUnit <= 0) return;

    const nextFt = parseFloat(editLengthFt);
    if (!Number.isFinite(nextFt) || nextFt <= 0) return;

    const seg = segments.find(s => s.id === selectedSegmentId);
    if (!seg) return;

    const a = vertexMap.get(seg.a);
    const b = vertexMap.get(seg.b);
    if (!a || !b) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const currentLen = Math.hypot(dx, dy);
    if (currentLen <= 0.0001) return;

    const targetLenUnits = nextFt / scaleFtPerUnit;

    const ux = dx / currentLen;
    const uy = dy / currentLen;

    const newBx = a.x + ux * targetLenUnits;
    const newBy = a.y + uy * targetLenUnits;

    pushHistory({ vertices, segments });
    const nextVertices = vertices.map(v => (v.id === seg.b ? { ...v, x: newBx, y: newBy } : v));
    setVertices(nextVertices);
    emitChange({ vertices: nextVertices });
  };

  const handleCloseLoop = () => {
    if (vertices.length < 3) return;
    if (ringVertexIds?.length) return;

    const first = vertices[0];
    const last = vertices[vertices.length - 1];

    const aId = last.id;
    const bId = first.id;

    // Add closing segment if not already present
    setSegments(prev => {
      if (segmentExists(prev, aId, bId)) return prev;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          a: aId,
          b: bId,
        },
      ];
    });

    const ring = vertices.map(v => v.id);
    setRingVertexIds(ring);
    setMode('EDIT');
    queueMicrotask(() => {
      const updatedSegments = segmentExists(segments, aId, bId)
        ? segments
        : [...segments, { id: crypto.randomUUID(), a: aId, b: bId }];
      emitChange({ vertices, segments: updatedSegments });
    });
  };

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


  const handleAutoPlace = async () => {
    if (!scaleFtPerUnit) {
      toast.error("Please calibrate the floor plan first.");
      return;
    }

    // Mock Building ID for prototype - in real app, this comes from props or context
    const buildingId = 1;

    // Mock Specs - normally passed from selection or sidebar
    const mockSpecs = {
      manufacturer: "Proto",
      dimensions: { width: 5, depth: 3, unit: "ft" as const }
    };

    const [data, err] = await executePlacement({
      buildingId: buildingId, // This might fail if ID 1 doesn't exist. 
      specs: mockSpecs
    });

    if (err) {
      // Fallback for prototype if DB lookup fails: Use client-side logic or mock
      console.error(err);
      toast.error("AI Placement failed (Check console). Placing at center.");
      // Fallback placement
      const newEq = {
        id: newId('eq'),
        category: 'machinery' as const,
        name: "Mock Machine",
        x: 0,
        y: 0,
        width: 5 / scaleFtPerUnit,
        depth: 3 / scaleFtPerUnit,
        rotation: 0
      };
      setComponents(prev => [...prev, newEq]);
      return;
    }

    if (data && data.success && data.placement) {
      const { x, y, rotation } = data.placement;
      // Convert feet to units
      // x,y from AI are in feet.
      // We need to map them to canvas units.
      // Assuming (0,0) in feet maps to bounding box top-left? 
      // Or strictly relative to origin (0,0) of canvas?
      // Let's assume canvas (0,0) is origin.

      const unitX = x / scaleFtPerUnit;
      const unitY = y / scaleFtPerUnit;

      const newEq = {
        id: newId('eq'),
        category: 'machinery' as const,
        name: "AI Machine",
        x: unitX,
        y: unitY,
        width: (mockSpecs.dimensions.width) / scaleFtPerUnit,
        depth: (mockSpecs.dimensions.depth) / scaleFtPerUnit,
        rotation: rotation || 0
      };
      setComponents(prev => [...prev, newEq]);
      toast.success("Machine placed!");
    }
  };

  const addMockDuct = () => {
    // Add a simple L-shaped duct for testing
    const newRun: NonNullable<BuildingFloorGeometry['systemRuns']>[0] = {
      id: newId('run'),
      type: 'DUST_COLLECTION',
      points: [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 300, y: 250 }],
      diameter: 12
    };
    setSystemRuns(prev => [...prev, newRun]);
    setMode('SYSTEMS');
  };

  // -- Interaction Handlers (Drag, Click, Move) --

  const handleEditDragStart = (type: 'VERTEX' | 'SEGMENT', id: string, e: any) => {
    if (mode !== 'EDIT') return;
    e.cancelBubble = true;
    const p = worldPointer(e);
    if (!p) return;

    pushHistory({ vertices, segments });

    if (type === 'VERTEX') {
      const v = vertexById.get(id);
      if (v) setDragState({ type: 'VERTEX', id, startPos: { x: v.x, y: v.y } });
    } else if (type === 'SEGMENT') {
      const s = segments.find(seg => seg.id === id);
      if (s) {
        const a = vertexById.get(s.a);
        const b = vertexById.get(s.b);
        if (a && b) {
          setDragState({
            type: 'SEGMENT',
            id,
            startA: { x: a.x, y: a.y },
            startB: { x: b.x, y: b.y },
            startPointer: p
          });
          setSelectedSegmentId(id);
        }
      }
    }
  };

  const handleEditDragMove = (e: any) => {
    if (dragState.type === 'NONE') return;
    const p = worldPointer(e);
    if (!p) return;

    // Always snap drag moves to grid
    const snapped = snapToGrid(p);

    if (dragState.type === 'VERTEX') {
      // Move vertex to snapped pointer
      setVertices(prev => prev.map(v => v.id === dragState.id ? { ...v, x: snapped.x, y: snapped.y } : v));
    } else if (dragState.type === 'SEGMENT') {
      const rawDelta = { x: p.x - dragState.startPointer.x, y: p.y - dragState.startPointer.y };
      const targetA = { x: dragState.startA.x + rawDelta.x, y: dragState.startA.y + rawDelta.y };
      const snappedA = snapToGrid(targetA);

      const vectorAB = { x: dragState.startB.x - dragState.startA.x, y: dragState.startB.y - dragState.startA.y };
      const newB = { x: snappedA.x + vectorAB.x, y: snappedA.y + vectorAB.y };

      const s = segments.find(seg => seg.id === dragState.id)!;

      setVertices(prev => prev.map(v => {
        if (v.id === s.a) return { ...v, x: snappedA.x, y: snappedA.y };
        if (v.id === s.b) return { ...v, x: newB.x, y: newB.y };
        return v;
      }));
    }
  };

  const handleEditDragEnd = () => {
    if (dragState.type === 'NONE') return;
    emitChange({ vertices, segments });
    setDragState({ type: 'NONE' });
  };

  const handleCanvasClickSelect = (world: { x: number; y: number }) => {
    if (mode === 'DRAW') return;

    let best: { id: string; d: number } | null = null;
    for (const s of segments) {
      const a = vertexById.get(s.a);
      const b = vertexById.get(s.b);
      if (!a || !b) continue;
      const d = pointToSegmentDistance(world, a, b);
      if (d <= HIT_DIST && (!best || d < best.d)) best = { id: s.id, d };
    }
    setSelectedSegmentId(best ? best.id : null);
  };

  const handleStageMouseDown = (e: any) => {
    if (e.target.getClassName() !== 'Stage') {
      return;
    }

    const p = worldPointer(e);
    if (!p) return;

    if (mode === 'EDIT') {
      handleCanvasClickSelect(p);
      return;
    }

    if (mode === 'SYSTEMS') {
      setDrawingRunPoints(prev => [...prev, p]);
      return;
    }

    if (mode === 'DRAW') {
      if (ghostPoint) {
        addVertex({ x: ghostPoint.x, y: ghostPoint.y });
        setPendingLengthFt('');
      } else if (pointerPos) {
        addVertex(pointerPos);
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

  const handleMouseMove = (e: any) => {
    if (dragState.type !== 'NONE') {
      handleEditDragMove(e);
      return;
    }
    const p = worldPointer(e);
    if (!p) return;
    setPointerPos(p);
  };

  const handleStageMouseUp = () => {
    handleEditDragEnd();
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

  // Keyboard Event Listeners (Shift, Typing)
  // Capture numeric input
  useEffect(() => {
    if (mode !== 'DRAW') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        setDrawByMeasurement(true);
        setPendingLengthFt(prev => {
          if (e.key === '.' && prev.includes('.')) return prev;
          return prev + e.key;
        });
      } else if (e.key === 'Backspace') {
        setPendingLengthFt(prev => prev.slice(0, -1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Commit on Enter
  useEffect(() => {
    if (mode !== 'DRAW') return;
    const handleCommit = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Enter' && ghostPoint) {
        addVertex({ x: ghostPoint.x, y: ghostPoint.y });
        setPendingLengthFt('');
      }
    };
    window.addEventListener('keydown', handleCommit);
    return () => window.removeEventListener('keydown', handleCommit);
  }, [mode, ghostPoint, addVertex]);

  // Systems Drawing Commit/Cancel
  useEffect(() => {
    if (mode !== 'SYSTEMS') {
      setDrawingRunPoints([]);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (drawingRunPoints.length >= 2) {
          // Commit run
          const newRun: NonNullable<BuildingFloorGeometry['systemRuns']>[0] = {
            id: newId('run'),
            type: 'DUST_COLLECTION',
            points: drawingRunPoints,
            diameter: 12 // Default
          };
          setSystemRuns(prev => [...prev, newRun]);
          setDrawingRunPoints([]);
          toast.success("Duct run created");
        }
      } else if (e.key === 'Escape') {
        setDrawingRunPoints([]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, drawingRunPoints]);

  // Rendering Memos

  const previewContent = useMemo(() => {
    if (mode !== 'DRAW' || vertices.length === 0 || !ghostPoint) return null;
    const prev = vertices[vertices.length - 1];
    return (
      <>
        {ghostPoint.guides.map((g, i) => (
          <Line key={`guide-${i}`} points={[g.x1, g.y1, g.x2, g.y2]} stroke="#22c55e" strokeWidth={1} dash={[4, 4]} listening={false} />
        ))}
        <Line points={[prev.x, prev.y, ghostPoint.x, ghostPoint.y]} stroke="#fb7185" strokeWidth={2} dash={[10, 6]} listening={false} />
      </>
    );
  }, [mode, vertices, ghostPoint]);

  const segmentLabels = useMemo(() => {
    if (!showMeasurements) return [];
    return segments.map((s) => {
      const a = vertexMap.get(s.a);
      const b = vertexMap.get(s.b);
      if (!a || !b) return null;
      const lenUnits = dist(a, b);
      const m = midpoint(a, b);
      let label = `${Math.round(lenUnits)} px`;
      if (scaleFtPerUnit && scaleFtPerUnit > 0) {
        const lenFt = lenUnits * scaleFtPerUnit;
        label = `${lenFt.toFixed(1)} ft`;
      }
      return (
        <Text key={`label-${s.id}`} x={m.x + 6} y={m.y + 6} text={label} fontSize={12} fill="#e2e8f0" listening={false} />
      );
    });
  }, [segments, vertexMap, showMeasurements, scaleFtPerUnit]);

  const segmentLines = useMemo(() => {
    const DEFAULT_WALL_THICKNESS_FT = 0.5;
    return segments.map((s) => {
      const a = vertexMap.get(s.a);
      const b = vertexMap.get(s.b);
      if (!a || !b) return null;
      const isSelected = s.id === selectedSegmentId;
      const thicknessFt = s.thickness ?? DEFAULT_WALL_THICKNESS_FT;
      const pxWidth = (scaleFtPerUnit && scaleFtPerUnit > 0) ? thicknessFt / scaleFtPerUnit : 6;

      // Calculate geometry for Rect
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = angleRad * 180 / Math.PI;

      // Ensure we draw the rect centered on the line
      // Konva Rect draws from top-left.
      // We want to rotate around the midpoint or start?
      // Easiest: Group at 'a', rotate, then Draw rect.

      return (
        <Group
          key={s.id}
          onMouseDown={(e) => handleEditDragStart('SEGMENT', s.id, e)}
        >
          {/* Main Wall Body */}
          <Group x={a.x} y={a.y} rotation={angleDeg}>
            <Rect
              x={0}
              y={-pxWidth / 2}
              width={len}
              height={pxWidth}
              fill={showMaterials ? undefined : "#94a3b8"}
              fillPatternImage={
                showMaterials
                  ? (s.material === 'concrete' ? concreteImage
                    : s.material === 'drywall' ? drywallImage
                      : brickImage) // default to brick or maybe specific default?
                  : undefined
              }
              fillPatternScaleX={0.05}
              fillPatternScaleY={0.05}
              stroke="black"
              strokeWidth={1}
              hitStrokeWidth={Math.max(pxWidth, 14)}
              onDblClick={() => mode === 'EDIT' && deleteSegment(s.id)}
            />
          </Group>

          {isSelected && (
            <Line points={[a.x, a.y, b.x, b.y]} stroke="#fbbf24" strokeWidth={Math.max(2, pxWidth * 0.2)} strokeOpacity={1} lineCap="round" listening={false} />
          )}
          {isSelected && (
            <Line points={[a.x, a.y, b.x, b.y]} stroke="#fbbf24" strokeWidth={pxWidth + 4} strokeOpacity={0.3} lineCap="round" listening={false} />
          )}
        </Group>
      );
    });
  }, [segments, vertexMap, mode, selectedSegmentId, scaleFtPerUnit, handleEditDragStart, deleteSegment, showMaterials]);

  const equipmentShapes = useMemo(() => {
    return components.map(eq => (
      <Group key={eq.id} x={eq.x} y={eq.y} rotation={eq.rotation} draggable={mode === 'EDIT'}
        onDragEnd={(e) => {
          const nx = e.target.x();
          const ny = e.target.y();
          setComponents(prev => prev.map(item => item.id === eq.id ? { ...item, x: nx, y: ny } : item));
        }}
      >
        <Rect
          width={eq.width}
          height={eq.depth}
          offsetX={eq.width / 2}
          offsetY={eq.depth / 2}
          fill="#8b5cf6"
          stroke="#fff"
          strokeWidth={2}
          opacity={0.8}
        />
        <Text
          text={eq.name}
          fontSize={10}
          fill="white"
          offsetX={10}
          offsetY={-eq.depth / 2 - 12}
        />
      </Group>
    ));
  }, [components, mode]);

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
        onMouseDown={(e) => handleEditDragStart('VERTEX', v.id, e)}
        onDblClick={() => mode === 'EDIT' && deleteVertex(v.id)}
      />
    ));
  }, [vertices, mode, pushHistory, segments, handleEditDragStart, deleteVertex]);

  const calibrationLine = useMemo(() => {
    if (mode !== 'CALIBRATE' || !calibration.a) return null;
    const a = calibration.a;
    const b = calibration.b ?? (pointerPos ? snapToGrid(pointerPos) : null);
    if (!b) return null;
    return <Line points={[a.x, a.y, b.x, b.y]} stroke="#fbbf24" strokeWidth={3} dash={[6, 4]} listening={false} />;
  }, [mode, calibration, pointerPos]);

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

  return (
    <div className="bg-slate-900/30 border border-slate-700 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setMode('DRAW')} className={`px-3 py-1 text-xs rounded ${mode === 'DRAW' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>Draw</button>
          <button type="button" onClick={() => setMode('EDIT')} className={`px-3 py-1 text-xs rounded ${mode === 'EDIT' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>Edit</button>
          <button type="button" onClick={() => setMode('SYSTEMS')} className={`px-3 py-1 text-xs rounded ${mode === 'SYSTEMS' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>Systems</button>
          <button type="button" onClick={() => setMode('CALIBRATE')} className={`px-3 py-1 text-xs rounded ${mode === 'CALIBRATE' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-200'}`}>Calibrate</button>

          {mode === 'DRAW' && !ringVertexIds?.length && vertices.length >= 3 && (
            <button type="button" onClick={handleCloseLoop} className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white" title="Close the wall loop">Close Loop</button>
          )}
          <button type="button" onClick={() => setShowGrid((g) => !g)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-200">{showGrid ? 'Hide grid' : 'Show grid'}</button>
          <button type="button" onClick={() => setShowMeasurements((m) => !m)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-200">{showMeasurements ? 'Hide lengths' : 'Show lengths'}</button>
          <button type="button" onClick={() => setShowMaterials((m) => !m)} className={`px-3 py-1 text-xs rounded ${showMaterials ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-200'}`}>Material</button>
          <button type="button" onClick={handleAutoPlace} disabled={isPlacing || !scaleFtPerUnit} className="px-3 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50">
            {isPlacing ? 'Thinking...' : 'Auto-Place (AI)'}
          </button>
          <button type="button" onClick={undo} disabled={history.length === 0} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-200 disabled:opacity-50">Undo</button>
          <button type="button" onClick={clearAll} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-200">Clear</button>
        </div>

        <div className="text-xs text-slate-300">
          Scale: {scaleFtPerUnit ? `${scaleFtPerUnit.toFixed(4)} ft/unit` : 'not set'} • Zoom: {(stage.scale * 100).toFixed(0)}%
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-slate-400 mb-3">
          <strong>How to use:</strong> Draw walls by clicking. Click near start to close.
          Use <em>Calibrate</em> for scaling. In <em>Edit</em>, drag vertices or walls to move. Double-click to delete.
        </div>

        {mode === 'CALIBRATE' && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <div className="text-slate-300">Reference length (ft):</div>
            <input value={calibration.realFt} onChange={(e) => setCalibration((c) => ({ ...c, realFt: e.target.value }))} className="w-32 px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white" placeholder="e.g. 20" />
            <button type="button" onClick={applyCalibration} className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded">Apply</button>
          </div>
        )}

        {mode === 'DRAW' && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" checked={drawByMeasurement} onChange={(e) => setDrawByMeasurement(e.target.checked)} />
              Draw by measurement
            </label>
            {drawByMeasurement && (
              <>
                <div className="text-slate-300">Next segment length (ft):</div>
                <input value={pendingLengthFt} onChange={(e) => setPendingLengthFt(e.target.value)} className="w-32 px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white" placeholder="e.g. 8" />
                {!scaleFtPerUnit && <div className="text-xs text-amber-300">Calibrate first.</div>}
              </>
            )}
          </div>
        )}

        {mode === 'EDIT' && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <div className="text-slate-300">Selected wall length (ft):</div>
            <input
              value={editLengthFt}
              onChange={(e) => setEditLengthFt(e.target.value)}
              className="w-32 px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-white"
              placeholder="e.g. 10"
              disabled={!selectedSegmentId || !scaleFtPerUnit}
              onKeyDown={(e) => { if (e.key === 'Enter') applySelectedSegmentLength(); }}
            />
            <button type="button" onClick={applySelectedSegmentLength} disabled={!selectedSegmentId || !scaleFtPerUnit} className="rounded px-3 py-1 border text-slate-100 disabled:opacity-50">Apply</button>

            {/* Split Button */}
            {selectedSegmentId && (
              <>
                <button
                  type="button"
                  onClick={() => splitSegment(selectedSegmentId)}
                  className="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-white ml-2"
                >
                  Split Wall
                </button>
                <select
                  className="px-2 py-1 ml-2 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                  value={segments.find(s => s.id === selectedSegmentId)?.material || 'brick'}
                  onChange={(e) => {
                    const mat = e.target.value as any;
                    const id = selectedSegmentId;
                    pushHistory({ vertices, segments });
                    const next = segments.map(s => s.id === id ? { ...s, material: mat } : s);
                    setSegments(next);
                    emitChange({ vertices, segments: next });
                  }}
                >
                  <option value="brick">Brick</option>
                  <option value="concrete">Concrete</option>
                  <option value="drywall">Drywall</option>
                </select>
              </>
            )}

            {!selectedSegmentId && <div className="text-xs text-slate-400">Select a wall to edit.</div>}
          </div>
        )}

        {mode === 'SYSTEMS' && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <button type="button" onClick={addMockDuct} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded">Add Test Duct (Mock)</button>
            <div className="text-xs text-slate-400">System visualization active.</div>
          </div>
        )}

        {validationError && <div className="mb-3 p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">{validationError}</div>}

        <div className="h-[420px] bg-slate-950 rounded border border-slate-800 overflow-hidden">
          <Stage
            ref={stageRef}
            width={800}
            height={420}
            scaleX={stage.scale}
            scaleY={stage.scale}
            x={stage.x}
            y={stage.y}
            draggable={mode !== 'DRAW' && mode !== 'CALIBRATE' && dragState.type === 'NONE'}
            onDragEnd={(e) => setStage((s) => ({ ...s, x: e.target.x(), y: e.target.y() }))}
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseDown={handleStageMouseDown}
            onMouseUp={handleStageMouseUp}
          >
            <Layer>
              <Rect x={0} y={0} width={800} height={420} fill="#020617" listening={false} />
              {gridLines}
              {segmentLines}
              {equipmentShapes}
              <SystemsLayer runs={systemRuns} />
              {drawingRunPoints.length > 0 && pointerPos && (
                <>
                  <Line points={drawingRunPoints.flatMap(p => [p.x, p.y])} stroke="#64748b" strokeWidth={2} dash={[5, 5]} />
                  <Line points={[drawingRunPoints[drawingRunPoints.length - 1].x, drawingRunPoints[drawingRunPoints.length - 1].y, pointerPos.x, pointerPos.y]} stroke="#64748b" strokeWidth={1} dash={[2, 2]} />
                </>
              )}
              {previewContent}
              {vertexDots}
              {calibrationLine}
              {/* Labels overlay */}
              {segmentLabels}

              <Text x={10} y={10} text={`Mode: ${mode}`} fontSize={12} fill="#cbd5e1" />
            </Layer>
          </Stage>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Snapping: endpoints within {SNAP_DIST}px. Grid {GRID_SIZE}px.
        </div>
      </div>
    </div>
  );
}