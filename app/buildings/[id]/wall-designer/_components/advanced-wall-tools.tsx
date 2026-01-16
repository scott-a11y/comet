'use client';

import React, { useState } from 'react';
import { Lock, Unlock, Grid3x3, Ruler, Copy, FlipHorizontal, Scissors, Circle } from 'lucide-react';

// Advanced wall drawing modes
export type AdvancedDrawMode =
    | 'orthogonal'      // Lock to 90° angles
    | 'angle-lock'      // Lock to specific angle
    | 'parallel'        // Parallel to selected wall
    | 'perpendicular'   // Perpendicular to selected wall
    | 'offset'          // Offset from existing wall
    | 'arc'             // Curved wall segment
    | 'free';           // Free drawing (default)

export type WallType = 'exterior' | 'interior' | 'load-bearing' | 'partition' | 'curtain';

export interface WallProperties {
    type: WallType;
    thickness: number;
    height: number;
    material: 'brick' | 'concrete' | 'drywall' | 'wood' | 'steel' | 'glass';
    insulation?: {
        type: string;
        rValue: number;
    };
    finish?: {
        interior: string;
        exterior: string;
    };
}

export interface AdvancedWallToolsProps {
    drawMode: AdvancedDrawMode;
    onDrawModeChange: (mode: AdvancedDrawMode) => void;
    wallProperties: WallProperties;
    onWallPropertiesChange: (props: Partial<WallProperties>) => void;
    angleLock?: number;
    onAngleLockChange?: (angle: number) => void;
    offsetDistance?: number;
    onOffsetDistanceChange?: (distance: number) => void;
}

export function AdvancedWallTools({
    drawMode,
    onDrawModeChange,
    wallProperties,
    onWallPropertiesChange,
    angleLock = 0,
    onAngleLockChange,
    offsetDistance = 0,
    onOffsetDistanceChange,
}: AdvancedWallToolsProps) {
    const [showProperties, setShowProperties] = useState(false);

    const drawModeButtons = [
        { mode: 'free' as AdvancedDrawMode, icon: Unlock, label: 'Free', tooltip: 'Free drawing' },
        { mode: 'orthogonal' as AdvancedDrawMode, icon: Grid3x3, label: 'Ortho', tooltip: 'Lock to 90° angles' },
        { mode: 'angle-lock' as AdvancedDrawMode, icon: Lock, label: 'Angle', tooltip: 'Lock to specific angle' },
        { mode: 'parallel' as AdvancedDrawMode, icon: Copy, label: 'Parallel', tooltip: 'Parallel to selected wall' },
        { mode: 'perpendicular' as AdvancedDrawMode, icon: FlipHorizontal, label: 'Perp', tooltip: 'Perpendicular to selected wall' },
        { mode: 'offset' as AdvancedDrawMode, icon: Scissors, label: 'Offset', tooltip: 'Offset from existing wall' },
        { mode: 'arc' as AdvancedDrawMode, icon: Circle, label: 'Arc', tooltip: 'Curved wall' },
    ];

    const wallThicknessPresets = [
        { value: 0.33, label: '4"', description: 'Interior partition' },
        { value: 0.5, label: '6"', description: 'Standard interior' },
        { value: 0.67, label: '8"', description: 'Exterior/Load-bearing' },
        { value: 1.0, label: '12"', description: 'Heavy exterior' },
    ];

    const wallHeightPresets = [
        { value: 8, label: '8\'' },
        { value: 9, label: '9\'' },
        { value: 10, label: '10\'' },
        { value: 12, label: '12\'' },
        { value: 16, label: '16\'' },
        { value: 20, label: '20\'' },
    ];

    return (
        <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl">
            {/* Drawing Mode Selector */}
            <div className="p-3 border-b border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Drawing Mode</h3>
                <div className="grid grid-cols-4 gap-1">
                    {drawModeButtons.map(({ mode, icon: Icon, label, tooltip }) => (
                        <button
                            key={mode}
                            onClick={() => onDrawModeChange(mode)}
                            title={tooltip}
                            className={`p-2 rounded text-xs font-bold flex flex-col items-center gap-1 transition-all ${drawMode === mode
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                                }`}
                        >
                            <Icon size={16} />
                            <span className="text-[10px]">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Angle Lock Input */}
            {drawMode === 'angle-lock' && onAngleLockChange && (
                <div className="p-3 border-b border-slate-700">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        Lock Angle (degrees)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={angleLock}
                            onChange={(e) => onAngleLockChange(parseFloat(e.target.value) || 0)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                            step="15"
                            min="0"
                            max="360"
                        />
                        <div className="flex gap-1">
                            {[0, 45, 90, 135].map(angle => (
                                <button
                                    key={angle}
                                    onClick={() => onAngleLockChange(angle)}
                                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded"
                                >
                                    {angle}°
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Offset Distance Input */}
            {drawMode === 'offset' && onOffsetDistanceChange && (
                <div className="p-3 border-b border-slate-700">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        Offset Distance (ft)
                    </label>
                    <input
                        type="number"
                        value={offsetDistance}
                        onChange={(e) => onOffsetDistanceChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                        step="0.5"
                        min="0"
                    />
                </div>
            )}

            {/* Wall Properties */}
            <div className="p-3">
                <button
                    onClick={() => setShowProperties(!showProperties)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 hover:text-white transition-colors"
                >
                    <span>Wall Properties</span>
                    <span className="text-lg">{showProperties ? '−' : '+'}</span>
                </button>

                {showProperties && (
                    <div className="space-y-3 mt-3">
                        {/* Wall Type */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Type</label>
                            <select
                                value={wallProperties.type}
                                onChange={(e) => onWallPropertiesChange({ type: e.target.value as WallType })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                            >
                                <option value="interior">Interior</option>
                                <option value="exterior">Exterior</option>
                                <option value="load-bearing">Load-Bearing</option>
                                <option value="partition">Partition</option>
                                <option value="curtain">Curtain Wall</option>
                            </select>
                        </div>

                        {/* Wall Thickness */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Thickness</label>
                            <div className="grid grid-cols-4 gap-1 mb-2">
                                {wallThicknessPresets.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        onClick={() => onWallPropertiesChange({ thickness: value })}
                                        title={wallThicknessPresets.find(p => p.value === value)?.description}
                                        className={`px-2 py-1 text-xs rounded ${wallProperties.thickness === value
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                value={wallProperties.thickness}
                                onChange={(e) => onWallPropertiesChange({ thickness: parseFloat(e.target.value) || 0.5 })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                                step="0.1"
                                min="0.1"
                            />
                        </div>

                        {/* Wall Height */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Height (ft)</label>
                            <div className="grid grid-cols-6 gap-1 mb-2">
                                {wallHeightPresets.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        onClick={() => onWallPropertiesChange({ height: value })}
                                        className={`px-2 py-1 text-xs rounded ${wallProperties.height === value
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                value={wallProperties.height}
                                onChange={(e) => onWallPropertiesChange({ height: parseFloat(e.target.value) || 8 })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                                step="1"
                                min="1"
                            />
                        </div>

                        {/* Wall Material */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Material</label>
                            <select
                                value={wallProperties.material}
                                onChange={(e) => onWallPropertiesChange({ material: e.target.value as any })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                            >
                                <option value="drywall">Drywall</option>
                                <option value="brick">Brick</option>
                                <option value="concrete">Concrete</option>
                                <option value="wood">Wood Frame</option>
                                <option value="steel">Steel Frame</option>
                                <option value="glass">Glass</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper functions for advanced drawing modes

export function calculateOrthogonalPoint(
    start: { x: number; y: number },
    current: { x: number; y: number }
): { x: number; y: number } {
    const dx = Math.abs(current.x - start.x);
    const dy = Math.abs(current.y - start.y);

    // Lock to horizontal or vertical based on which is larger
    if (dx > dy) {
        return { x: current.x, y: start.y };
    } else {
        return { x: start.x, y: current.y };
    }
}

export function calculateAngleLockedPoint(
    start: { x: number; y: number },
    current: { x: number; y: number },
    angleDegrees: number
): { x: number; y: number } {
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const angleRad = (angleDegrees * Math.PI) / 180;

    return {
        x: start.x + distance * Math.cos(angleRad),
        y: start.y + distance * Math.sin(angleRad)
    };
}

export function calculateParallelPoint(
    referenceStart: { x: number; y: number },
    referenceEnd: { x: number; y: number },
    start: { x: number; y: number },
    current: { x: number; y: number }
): { x: number; y: number } {
    // Calculate angle of reference line
    const refAngle = Math.atan2(
        referenceEnd.y - referenceStart.y,
        referenceEnd.x - referenceStart.x
    );

    // Calculate distance from start to current
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Project along reference angle
    return {
        x: start.x + distance * Math.cos(refAngle),
        y: start.y + distance * Math.sin(refAngle)
    };
}

export function calculatePerpendicularPoint(
    referenceStart: { x: number; y: number },
    referenceEnd: { x: number; y: number },
    start: { x: number; y: number },
    current: { x: number; y: number }
): { x: number; y: number } {
    // Calculate angle perpendicular to reference line
    const refAngle = Math.atan2(
        referenceEnd.y - referenceStart.y,
        referenceEnd.x - referenceStart.x
    );
    const perpAngle = refAngle + Math.PI / 2;

    // Calculate distance from start to current
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Project along perpendicular angle
    return {
        x: start.x + distance * Math.cos(perpAngle),
        y: start.y + distance * Math.sin(perpAngle)
    };
}

export function calculateOffsetWall(
    wallStart: { x: number; y: number },
    wallEnd: { x: number; y: number },
    offsetDistance: number,
    side: 'left' | 'right' = 'right'
): { start: { x: number; y: number }; end: { x: number; y: number } } {
    // Calculate perpendicular direction
    const dx = wallEnd.x - wallStart.x;
    const dy = wallEnd.y - wallStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Normalize and rotate 90 degrees
    const perpX = -dy / length;
    const perpY = dx / length;

    // Apply offset in the correct direction
    const direction = side === 'right' ? 1 : -1;
    const offsetX = perpX * offsetDistance * direction;
    const offsetY = perpY * offsetDistance * direction;

    return {
        start: {
            x: wallStart.x + offsetX,
            y: wallStart.y + offsetY
        },
        end: {
            x: wallEnd.x + offsetX,
            y: wallEnd.y + offsetY
        }
    };
}
