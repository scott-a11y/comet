"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Rect, Text, Image } from "react-konva";
import { useLayoutStore, snapToGrid } from "@/lib/store/layout-store";
import useImage from "use-image";
import Konva from "konva";

interface CanvasAreaProps {
  buildingDims: {
    width: number;
    length: number;
  };
  pdfUrl?: string | null;
  blueprintOpacity?: number;
}

const BlueprintImage = ({ url, width, height, opacity }: { url: string; width: number; height: number; opacity: number }) => {
  const [image] = useImage(url);
  return <Image image={image} width={width} height={height} opacity={opacity} listening={false} />;
};

const SCALE_FACTOR = 10; // pixels per foot

export const CanvasArea = forwardRef<Konva.Stage, CanvasAreaProps>(
  function CanvasArea({ buildingDims, pdfUrl, blueprintOpacity = 0.5 }, ref) {
  const stageRef = useRef<Konva.Stage>(null);
  const { items, selectedId, selectItem, updateItem, stage, setStage } = useLayoutStore();

  const buildingWidthPx = buildingDims.width * SCALE_FACTOR;
  const buildingLengthPx = buildingDims.length * SCALE_FACTOR;

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
            x={50}
            y={50}
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
              x={50 + i * SCALE_FACTOR}
              y={50}
              width={1}
              height={buildingLengthPx}
              fill="#334155"
              opacity={0.3}
            />
          ))}
          {Array.from({ length: Math.ceil(buildingDims.length) }, (_, i) => (
            <Rect
              key={`h-grid-${i}`}
              x={50}
              y={50 + i * SCALE_FACTOR}
              width={buildingWidthPx}
              height={1}
              fill="#334155"
              opacity={0.3}
            />
          ))}

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
                x={50 + item.x}
                y={50 + item.y}
                width={item.width}
                height={item.length}
                rotation={item.rotation}
                fill={fillColor}
                stroke={selectedId === item.id ? "#fbbf24" : "#ffffff"}
                strokeWidth={selectedId === item.id ? 3 : 1}
                draggable
                dragBoundFunc={(pos) => ({
                  x: 50 + snapToGrid(pos.x - 50),
                  y: 50 + snapToGrid(pos.y - 50),
                })}
                onClick={() => selectItem(item.id)}
                onDragEnd={(e) => handleDragEnd(e, item.id)}
                onTransformEnd={(e) => handleTransformEnd(e, item.id)}
              />
            );
          })}

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
            text="Scroll to zoom • Drag to pan • Click items to select • Drag corners to resize"
            fontSize={11}
            fill="#64748b"
            fontFamily="Inter, sans-serif"
          />
        </Layer>
      </Stage>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-slate-800 rounded-lg p-3 space-y-2">
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
