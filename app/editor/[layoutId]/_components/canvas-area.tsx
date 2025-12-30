"use client";

import { useRef, useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Stage, Layer, Rect, Text, Image, Circle, Line } from "react-konva";
import { useLayoutStore, snapToGrid } from "@/lib/store/layout-store";
import useImage from "use-image";
import Konva from "konva";
import type { EquipmentPort, RunSegment, SystemType } from "@/lib/validations/layout";

interface CanvasAreaProps {
  buildingDims: {
    width: number;
    length: number;
  };
  pdfUrl?: string | null;
  blueprintOpacity?: number;
}

const BlueprintImage = ({ url, width, height, opacity }: { url: string; width: number; height: number; opacity: number }) => {
  const [image, status] = useImage(url);
  
  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (image && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [image, url]);
  
  if (status === 'loading') {
    return <Rect fill="#374151" width={width} height={height} opacity={0.3} listening={false} />;
  }
  
  return <Image image={image} width={width} height={height} opacity={opacity} listening={false} />;
};

const SCALE_FACTOR = 10; // pixels per foot
const CANVAS_OFFSET = 50;

type DraftRoute = {
  system: SystemType;
  from: { itemId: string; portId: string; x: number; y: number };
  points: Array<{ x: number; y: number }>; // world coords (px) without CANVAS_OFFSET
};

function snapOrtho(prev: { x: number; y: number }, next: { x: number; y: number }) {
  const dx = Math.abs(next.x - prev.x);
  const dy = Math.abs(next.y - prev.y);
  return dx >= dy ? { x: next.x, y: prev.y } : { x: prev.x, y: next.y };
}

function toSegments(points: Array<{ x: number; y: number }>): RunSegment[] {
  const segs: RunSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a.x === b.x && a.y === b.y) continue;
    segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }
  return segs;
}

export const CanvasArea = forwardRef<Konva.Stage, CanvasAreaProps>(
  function CanvasArea({ buildingDims, pdfUrl, blueprintOpacity = 0.5 }, ref) {
  const stageRef = useRef<Konva.Stage>(null);
  // Forward the internal Konva stage to parent for export.
  useImperativeHandle(ref, () => stageRef.current as Konva.Stage, []);
  const { items, runs, addRun, selectedId, selectItem, updateItem, stage, setStage } = useLayoutStore();
  const [tool, setTool] = useState<"SELECT" | "ROUTE">("SELECT");
  const [draft, setDraft] = useState<DraftRoute | null>(null);

  const buildingWidthPx = buildingDims.width * SCALE_FACTOR;
  const buildingLengthPx = buildingDims.length * SCALE_FACTOR;

  const portNodes = useMemo(() => {
    const out: Array<{
      itemId: string;
      port: EquipmentPort;
      x: number;
      y: number;
    }> = [];

    for (const item of items) {
      if (item.type !== "EQUIPMENT") continue;
      const ports = ((item.metadata as any)?.ports ?? []) as EquipmentPort[];
      for (const p of ports) {
        out.push({
          itemId: item.id,
          port: p,
          x: item.x + p.offsetX,
          y: item.y + p.offsetY,
        });
      }
    }
    return out;
  }, [items]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;

    setStage({
      scale: Math.max(0.1, Math.min(3, newScale)),
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const cancelDraft = () => setDraft(null);

  const handlePortClick = (p: { itemId: string; port: EquipmentPort; x: number; y: number }) => {
    if (tool !== "ROUTE") {
      // In select mode, clicking a port selects the owning item.
      selectItem(p.itemId);
      return;
    }

    if (!draft) {
      setDraft({
        system: p.port.system,
        from: { itemId: p.itemId, portId: p.port.id, x: p.x, y: p.y },
        points: [{ x: p.x, y: p.y }],
      });
      return;
    }

    // must match system
    if (p.port.system !== draft.system) {
      return;
    }

    // finish on end port
    const last = draft.points[draft.points.length - 1];
    const end = { x: p.x, y: p.y };
    const snapped = snapOrtho(last, end);
    const pts = [...draft.points, snapped, end];
    const segs = toSegments(pts);
    if (segs.length === 0) {
      setDraft(null);
      return;
    }
    addRun({
      id: crypto.randomUUID(),
      system: draft.system,
      from: { itemId: draft.from.itemId, portId: draft.from.portId },
      to: { itemId: p.itemId, portId: p.port.id },
      segments: segs,
    });
    setDraft(null);
  };

  const handleStageClick = (e: any) => {
    if (tool !== "ROUTE") return;
    if (!draft) return;

    // Only respond to background clicks (not shapes)
    if (e.target && e.target !== e.target.getStage()) return;

    const st = stageRef.current;
    if (!st) return;
    const pos = st.getPointerPosition();
    if (!pos) return;
    const transform = st.getAbsoluteTransform().copy();
    transform.invert();
    const world = transform.point(pos);

    const pt = { x: world.x - CANVAS_OFFSET, y: world.y - CANVAS_OFFSET };
    const snappedPt = { x: snapToGrid(pt.x), y: snapToGrid(pt.y) };
    const last = draft.points[draft.points.length - 1];
    const ortho = snapOrtho(last, snappedPt);
    setDraft({ ...draft, points: [...draft.points, ortho] });
  };

  const handleDragEnd = (e: any, itemId: string) => {
    const node = e.target;
    updateItem(itemId, {
      x: node.x(),
      y: node.y(),
    });
  };

  const handleTransformEnd = (e: any, itemId: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    updateItem(itemId, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: node.width() * scaleX,
      length: node.height() * scaleY,
    });
  };

  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden">
      <Stage
        ref={stageRef}
        width={window.innerWidth - 256} // Sidebar width
        height={window.innerHeight - 80} // Header height
        scaleX={stage.scale}
        scaleY={stage.scale}
        x={stage.x}
        y={stage.y}
        onWheel={handleWheel}
        draggable
        onDragEnd={(e) => {
          setStage({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onMouseDown={handleStageClick}
      >
        <Layer>
          {/* Blueprint Image */}
          {pdfUrl && (
            <BlueprintImage
              url={pdfUrl}
              width={buildingWidthPx}
              height={buildingLengthPx}
              opacity={blueprintOpacity}
            />
          )}

          {/* Building Floor */}
          <Rect
            x={CANVAS_OFFSET}
            y={CANVAS_OFFSET}
            width={buildingWidthPx}
            height={buildingLengthPx}
            fill={pdfUrl ? "transparent" : "#1e293b"}
            stroke="#475569"
            strokeWidth={2}
            cornerRadius={4}
          />

          {/* Building Label */}
          <Text
            x={60}
            y={30}
            text={`Building Floor (${buildingDims.width}' × ${buildingDims.length}')`}
            fontSize={14}
            fill="#cbd5e1"
            fontFamily="Inter, sans-serif"
          />

          {/* Grid Lines */}
          {Array.from({ length: Math.ceil(buildingDims.width) }, (_, i) => (
            <Rect
              key={`v-grid-${i}`}
              x={CANVAS_OFFSET + i * SCALE_FACTOR}
              y={CANVAS_OFFSET}
              width={1}
              height={buildingLengthPx}
              fill="#334155"
              opacity={0.3}
            />
          ))}
          {Array.from({ length: Math.ceil(buildingDims.length) }, (_, i) => (
            <Rect
              key={`h-grid-${i}`}
              x={CANVAS_OFFSET}
              y={CANVAS_OFFSET + i * SCALE_FACTOR}
              width={buildingWidthPx}
              height={1}
              fill="#334155"
              opacity={0.3}
            />
          ))}

          {/* Runs */}
          {runs.map((r) => (
            <Line
              key={r.id}
              points={r.segments.flatMap((s) => [CANVAS_OFFSET + s.x1, CANVAS_OFFSET + s.y1, CANVAS_OFFSET + s.x2, CANVAS_OFFSET + s.y2])}
              stroke={
                r.system === "ELECTRICAL" ? "#ef4444" :
                r.system === "AIR" ? "#3b82f6" :
                r.system === "DUST" ? "#f59e0b" :
                r.system === "DUCT" ? "#22c55e" :
                "#a78bfa"
              }
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          ))}

          {/* Draft run */}
          {draft && draft.points.length > 0 && (
            <Line
              points={draft.points.flatMap((p) => [CANVAS_OFFSET + p.x, CANVAS_OFFSET + p.y])}
              stroke="#fbbf24"
              strokeWidth={2}
              dash={[10, 6]}
              listening={false}
            />
          )}

          {/* Canvas Items */}
          {items.map((item) => {
            // Use catalog color if available, otherwise default by type
            let fillColor = "#0891b2"; // default cyan
            if (item.type === "WALL") {
              fillColor = "#dc2626"; // red
            } else if (item.type === "EQUIPMENT") {
              // Check if item has a catalog color
              const catalogColor = (item.metadata as any)?.catalogColor;
              fillColor = catalogColor || "#7c3aed"; // purple
            }

            return (
              <Rect
                key={item.id}
                x={CANVAS_OFFSET + item.x}
                y={CANVAS_OFFSET + item.y}
                width={item.width}
                height={item.length}
                rotation={item.rotation}
                fill={fillColor}
                stroke={selectedId === item.id ? "#fbbf24" : "#ffffff"}
                strokeWidth={selectedId === item.id ? 3 : 1}
                draggable
                dragBoundFunc={(pos) => ({
                  x: CANVAS_OFFSET + snapToGrid(pos.x - CANVAS_OFFSET),
                  y: CANVAS_OFFSET + snapToGrid(pos.y - CANVAS_OFFSET),
                })}
                onClick={() => selectItem(item.id)}
                onDragEnd={(e) => handleDragEnd(e, item.id)}
                onTransformEnd={(e) => handleTransformEnd(e, item.id)}
              />
            );
          })}

          {/* Equipment ports */}
          {portNodes.map((p) => (
            <Circle
              key={`${p.itemId}:${p.port.id}`}
              x={CANVAS_OFFSET + p.x}
              y={CANVAS_OFFSET + p.y}
              radius={6}
              fill={
                p.port.system === "ELECTRICAL" ? "#ef4444" :
                p.port.system === "AIR" ? "#3b82f6" :
                p.port.system === "DUST" ? "#f59e0b" :
                p.port.system === "DUCT" ? "#22c55e" :
                "#a78bfa"
              }
              stroke="#0f172a"
              strokeWidth={2}
              onClick={() => handlePortClick(p)}
            />
          ))}

          {/* Selected Item Info */}
          {selectedId && (
            <Text
              x={60}
              y={buildingLengthPx + 80}
              text={`Selected: ${items.find(i => i.id === selectedId)?.type || 'Unknown'}`}
              fontSize={12}
              fill="#fbbf24"
              fontFamily="Inter, sans-serif"
            />
          )}

          {/* Instructions */}
          <Text
            x={60}
            y={buildingLengthPx + 100}
            text={`Tool: ${tool} • Scroll to zoom • Drag to pan • Click items/ports`}
            fontSize={11}
            fill="#64748b"
            fontFamily="Inter, sans-serif"
          />
        </Layer>
      </Stage>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-slate-800 rounded-lg p-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTool("SELECT");
              cancelDraft();
            }}
            className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${tool === "SELECT" ? "bg-slate-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"}`}
          >
            Select
          </button>
          <button
            onClick={() => {
              setTool("ROUTE");
              selectItem(null);
            }}
            className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${tool === "ROUTE" ? "bg-amber-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"}`}
          >
            Route
          </button>
        </div>

        {draft && (
          <button
            onClick={cancelDraft}
            className="block w-full px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Cancel draft
          </button>
        )}
        <button
          onClick={() => setStage({ scale: 1, x: 0, y: 0 })}
          className="block w-full px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
        >
          Reset View
        </button>
        <div className="text-xs text-slate-400">
          Zoom: {(stage.scale * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
});