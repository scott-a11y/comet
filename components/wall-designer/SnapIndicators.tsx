"use client";

import { Circle, Group, Line, RegularPolygon } from 'react-konva';
import { SnapPoint, SnapType } from '@/lib/wall-designer/SnapManager';

interface SnapIndicatorsProps {
    snapPoint: SnapPoint | null;
    scale?: number;
}

/**
 * Visual indicators for snap points
 * Shows different shapes/colors for different snap types
 */
export function SnapIndicators({ snapPoint, scale = 1 }: SnapIndicatorsProps) {
    if (!snapPoint) return null;

    const baseSize = 8 / scale; // Adjust size based on zoom level
    const strokeWidth = 2 / scale;

    return (
        <Group>
            {/* Vertex snap - Green circle */}
            {snapPoint.type === 'vertex' && (
                <Circle
                    x={snapPoint.x}
                    y={snapPoint.y}
                    radius={baseSize}
                    stroke="#22c55e"
                    strokeWidth={strokeWidth}
                    fill="rgba(34, 197, 94, 0.2)"
                />
            )}

            {/* Midpoint snap - Blue triangle */}
            {snapPoint.type === 'midpoint' && (
                <RegularPolygon
                    x={snapPoint.x}
                    y={snapPoint.y}
                    sides={3}
                    radius={baseSize}
                    rotation={180}
                    stroke="#3b82f6"
                    strokeWidth={strokeWidth}
                    fill="rgba(59, 130, 246, 0.2)"
                />
            )}

            {/* Center snap - Purple cross */}
            {snapPoint.type === 'center' && (
                <Group>
                    <Line
                        points={[
                            snapPoint.x - baseSize, snapPoint.y,
                            snapPoint.x + baseSize, snapPoint.y
                        ]}
                        stroke="#a855f7"
                        strokeWidth={strokeWidth}
                    />
                    <Line
                        points={[
                            snapPoint.x, snapPoint.y - baseSize,
                            snapPoint.x, snapPoint.y + baseSize
                        ]}
                        stroke="#a855f7"
                        strokeWidth={strokeWidth}
                    />
                    <Circle
                        x={snapPoint.x}
                        y={snapPoint.y}
                        radius={baseSize * 0.3}
                        fill="#a855f7"
                    />
                </Group>
            )}

            {/* Intersection snap - Orange X */}
            {snapPoint.type === 'intersection' && (
                <Group>
                    <Line
                        points={[
                            snapPoint.x - baseSize, snapPoint.y - baseSize,
                            snapPoint.x + baseSize, snapPoint.y + baseSize
                        ]}
                        stroke="#f97316"
                        strokeWidth={strokeWidth}
                    />
                    <Line
                        points={[
                            snapPoint.x - baseSize, snapPoint.y + baseSize,
                            snapPoint.x + baseSize, snapPoint.y - baseSize
                        ]}
                        stroke="#f97316"
                        strokeWidth={strokeWidth}
                    />
                    <Circle
                        x={snapPoint.x}
                        y={snapPoint.y}
                        radius={baseSize}
                        stroke="#f97316"
                        strokeWidth={strokeWidth}
                        fill="rgba(249, 115, 22, 0.2)"
                    />
                </Group>
            )}

            {/* Grid snap - Gray square */}
            {snapPoint.type === 'grid' && (
                <RegularPolygon
                    x={snapPoint.x}
                    y={snapPoint.y}
                    sides={4}
                    radius={baseSize * 0.7}
                    stroke="#94a3b8"
                    strokeWidth={strokeWidth}
                    fill="rgba(148, 163, 184, 0.2)"
                />
            )}

            {/* Perpendicular snap - Cyan line with dot */}
            {snapPoint.type === 'perpendicular' && (
                <Group>
                    <Circle
                        x={snapPoint.x}
                        y={snapPoint.y}
                        radius={baseSize}
                        stroke="#06b6d4"
                        strokeWidth={strokeWidth}
                        fill="rgba(6, 182, 212, 0.2)"
                    />
                    <Line
                        points={[
                            snapPoint.x - baseSize * 0.5, snapPoint.y - baseSize * 0.5,
                            snapPoint.x + baseSize * 0.5, snapPoint.y + baseSize * 0.5
                        ]}
                        stroke="#06b6d4"
                        strokeWidth={strokeWidth}
                    />
                </Group>
            )}

            {/* Snap point label (optional - shows snap type) */}
            {/* Uncomment to show labels
      <Text
        x={snapPoint.x + baseSize + 5}
        y={snapPoint.y - baseSize}
        text={snapPoint.type}
        fontSize={10 / scale}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={0.5 / scale}
      />
      */}
        </Group>
    );
}

/**
 * Snap type legend component
 * Shows what each indicator means
 */
export function SnapLegend() {
    return (
        <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 space-y-2">
            <div className="text-xs font-semibold text-slate-300 mb-2">Snap Indicators</div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500/20"></div>
                <span>Vertex (corners)</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-blue-500"></div>
                </div>
                <span>Midpoint</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 flex items-center justify-center text-purple-500 font-bold">+</div>
                <span>Center</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-[10px]">×</div>
                <span>Intersection</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-500 bg-slate-500/20 rotate-45"></div>
                <span>Grid</span>
            </div>
        </div>
    );
}

/**
 * Snap settings panel
 * Allows users to toggle snap types on/off
 */
interface SnapSettingsPanelProps {
    enabledTypes: Set<SnapType>;
    onToggleType: (type: SnapType, enabled: boolean) => void;
    snapDistance: number;
    onSnapDistanceChange: (distance: number) => void;
}

export function SnapSettingsPanel({
    enabledTypes,
    onToggleType,
    snapDistance,
    onSnapDistanceChange
}: SnapSettingsPanelProps) {
    const snapTypes: { type: SnapType; label: string; color: string }[] = [
        { type: 'vertex', label: 'Vertices', color: 'green' },
        { type: 'midpoint', label: 'Midpoints', color: 'blue' },
        { type: 'center', label: 'Centers', color: 'purple' },
        { type: 'intersection', label: 'Intersections', color: 'orange' },
        { type: 'grid', label: 'Grid', color: 'slate' },
        { type: 'perpendicular', label: 'Perpendicular', color: 'cyan' }
    ];

    return (
        <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-4 space-y-4">
            <div className="text-sm font-semibold text-white">Snap Settings</div>

            {/* Snap distance slider */}
            <div className="space-y-2">
                <label className="text-xs text-slate-400">
                    Snap Distance: {snapDistance}px
                </label>
                <input
                    type="range"
                    min="5"
                    max="30"
                    value={snapDistance}
                    onChange={(e) => onSnapDistanceChange(parseInt(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Snap type toggles */}
            <div className="space-y-2">
                <div className="text-xs text-slate-400 mb-2">Snap Types:</div>
                {snapTypes.map(({ type, label, color }) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enabledTypes.has(type)}
                            onChange={(e) => onToggleType(type, e.target.checked)}
                            className="rounded"
                        />
                        <span className={`text-xs text-${color}-400`}>{label}</span>
                    </label>
                ))}
            </div>

            {/* Quick presets */}
            <div className="pt-2 border-t border-slate-700 space-y-2">
                <div className="text-xs text-slate-400 mb-2">Presets:</div>
                <button
                    onClick={() => {
                        snapTypes.forEach(({ type }) => onToggleType(type, true));
                    }}
                    className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                >
                    Enable All
                </button>
                <button
                    onClick={() => {
                        snapTypes.forEach(({ type }) => onToggleType(type, false));
                    }}
                    className="w-full px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded"
                >
                    Disable All
                </button>
            </div>
        </div>
    );
}
