"use client";

import { useState } from 'react';
import { SelectionMode, SelectionManager, BulkOperations } from '@/lib/wall-designer/SelectionManager';
import {
    MousePointer,
    Square,
    Lasso,
    Wand2,
    Paintbrush,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd,
    DistributeHorizontal,
    DistributeVertical,
    Group,
    Ungroup
} from 'lucide-react';

interface SelectionToolbarProps {
    selectionManager: SelectionManager;
    selectedCount: number;
    onModeChange?: (mode: SelectionMode) => void;
    onBulkOperation?: (operation: string, params?: any) => void;
}

export function SelectionToolbar({
    selectionManager,
    selectedCount,
    onModeChange,
    onBulkOperation
}: SelectionToolbarProps) {
    const [currentMode, setCurrentMode] = useState<SelectionMode>('single');

    const modes: { mode: SelectionMode; icon: any; label: string; shortcut: string }[] = [
        { mode: 'single', icon: MousePointer, label: 'Select', shortcut: 'V' },
        { mode: 'box', icon: Square, label: 'Box Select', shortcut: 'B' },
        { mode: 'lasso', icon: Lasso, label: 'Lasso', shortcut: 'L' },
        { mode: 'magic-wand', icon: Wand2, label: 'Magic Wand', shortcut: 'W' },
        { mode: 'paint', icon: Paintbrush, label: 'Paint Select', shortcut: 'P' }
    ];

    const handleModeChange = (mode: SelectionMode) => {
        setCurrentMode(mode);
        selectionManager.updateOptions({ mode });
        onModeChange?.(mode);
    };

    return (
        <div className="bg-slate-800/95 border border-slate-700 rounded-lg shadow-xl">
            {/* Selection modes */}
            <div className="p-2 border-b border-slate-700">
                <div className="text-xs text-slate-400 mb-2">Selection Mode</div>
                <div className="flex gap-1">
                    {modes.map(({ mode, icon: Icon, label, shortcut }) => (
                        <button
                            key={mode}
                            onClick={() => handleModeChange(mode)}
                            className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded transition-all
                ${currentMode === mode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }
              `}
                            title={`${label} (${shortcut})`}
                        >
                            <Icon size={16} />
                            <span className="text-[10px]">{shortcut}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk operations */}
            {selectedCount > 1 && (
                <>
                    {/* Alignment */}
                    <div className="p-2 border-b border-slate-700">
                        <div className="text-xs text-slate-400 mb-2">
                            Align ({selectedCount} selected)
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <button
                                onClick={() => onBulkOperation?.('align', 'left')}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                                title="Align Left"
                            >
                                <AlignLeft size={14} />
                            </button>
                            <button
                                onClick={() => onBulkOperation?.('align', 'center')}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                                title="Align Center"
                            >
                                <AlignCenter size={14} />
                            </button>
                            <button
                                onClick={() => onBulkOperation?.('align', 'right')}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                                title="Align Right"
                            >
                                <AlignRight size={14} />
                            </button>
                            <button
                                onClick={() => onBulkOperation?.('align', 'top')}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                                title="Align Top"
                            >
                                <AlignVerticalJustifyStart size={14} />
                            </button>
                            <button
                                onClick={() => onBulkOperation?.('align', 'middle')}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                                title="Align Middle"
                            >
                                <AlignVerticalJustifyCenter size={14} />
                            </button>
                            <button
                                onClick={() => onBulkOperation?.('align', 'bottom')}
                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                                title="Align Bottom"
                            >
                                <AlignVerticalJustifyEnd size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Distribution */}
                    {selectedCount >= 3 && (
                        <div className="p-2 border-b border-slate-700">
                            <div className="text-xs text-slate-400 mb-2">Distribute</div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => onBulkOperation?.('distribute', 'horizontal')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                                >
                                    <DistributeHorizontal size={14} />
                                    <span>Horizontal</span>
                                </button>
                                <button
                                    onClick={() => onBulkOperation?.('distribute', 'vertical')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                                >
                                    <DistributeVertical size={14} />
                                    <span>Vertical</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Grouping */}
                    <div className="p-2">
                        <div className="flex gap-1">
                            <button
                                onClick={() => onBulkOperation?.('group')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                            >
                                <Group size={14} />
                                <span>Group</span>
                            </button>
                            <button
                                onClick={() => onBulkOperation?.('ungroup')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                            >
                                <Ungroup size={14} />
                                <span>Ungroup</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Selection info */}
            <div className="p-2 border-t border-slate-700 text-xs text-slate-400">
                {selectedCount === 0 && 'No selection'}
                {selectedCount === 1 && '1 item selected'}
                {selectedCount > 1 && `${selectedCount} items selected`}
            </div>
        </div>
    );
}

/**
 * Selection box indicator (for box selection mode)
 */
interface SelectionBoxProps {
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
}

export function SelectionBox({ start, end }: SelectionBoxProps) {
    if (!start || !end) return null;

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    return (
        <div
            className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
            style={{
                left: x,
                top: y,
                width,
                height
            }}
        />
    );
}

/**
 * Lasso path indicator
 */
interface LassoPathProps {
    points: { x: number; y: number }[];
}

export function LassoPath({ points }: LassoPathProps) {
    if (points.length < 2) return null;

    const pathData = points.reduce((path, point, index) => {
        if (index === 0) {
            return `M ${point.x} ${point.y}`;
        }
        return `${path} L ${point.x} ${point.y}`;
    }, '');

    return (
        <svg className="absolute inset-0 pointer-events-none">
            <path
                d={pathData + ' Z'}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
            />
        </svg>
    );
}

/**
 * Paint brush cursor
 */
interface PaintCursorProps {
    position: { x: number; y: number } | null;
    size: number;
}

export function PaintCursor({ position, size }: PaintCursorProps) {
    if (!position) return null;

    return (
        <div
            className="absolute rounded-full border-2 border-purple-500 bg-purple-500/20 pointer-events-none"
            style={{
                left: position.x - size,
                top: position.y - size,
                width: size * 2,
                height: size * 2
            }}
        />
    );
}

/**
 * Selection count badge
 */
interface SelectionBadgeProps {
    count: number;
}

export function SelectionBadge({ count }: SelectionBadgeProps) {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg">
            <span className="font-semibold">{count}</span>
            <span className="ml-2 text-sm">
                {count === 1 ? 'item selected' : 'items selected'}
            </span>
        </div>
    );
}
