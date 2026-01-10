'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Equipment {
    id: number;
    name: string;
    widthFt: number;
    depthFt: number;
    category: string;
}

interface EquipmentPosition {
    id: number;
    equipmentId: number;
    x: number;
    y: number;
    orientation: number;
    locked: boolean;
    equipment: Equipment;
}

interface InteractiveLayoutCanvasProps {
    buildingId: string;
    layoutId: string;
    buildingWidth: number;
    buildingHeight: number;
    equipmentPositions: EquipmentPosition[];
}

export default function InteractiveLayoutCanvas({
    buildingId,
    layoutId,
    buildingWidth,
    buildingHeight,
    equipmentPositions: initialPositions,
}: InteractiveLayoutCanvasProps) {
    const router = useRouter();
    const canvasRef = useRef<HTMLDivElement>(null);

    const [positions, setPositions] = useState(initialPositions);
    const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
    const [dragging, setDragging] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [editingPosition, setEditingPosition] = useState<number | null>(null);
    const [tempX, setTempX] = useState('');
    const [tempY, setTempY] = useState('');
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [history, setHistory] = useState<EquipmentPosition[][]>([initialPositions]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [clipboard, setClipboard] = useState<EquipmentPosition | null>(null);

    // Add to history for undo/redo
    const addToHistory = (newPositions: EquipmentPosition[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPositions);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Undo
    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPositions(history[historyIndex - 1]);
            setHasChanges(true);
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPositions(history[historyIndex + 1]);
            setHasChanges(true);
        }
    };

    // Handle mouse down on equipment
    const handleMouseDown = (e: React.MouseEvent, posId: number, pos: EquipmentPosition) => {
        if (pos.locked) return;

        e.stopPropagation();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Calculate position in feet
        const equipmentX = (pos.x / buildingWidth) * rect.width;
        const equipmentY = (pos.y / buildingHeight) * rect.height;

        setDragging(posId);
        setSelectedEquipment(posId);
        setDragOffset({
            x: clickX - equipmentX,
            y: clickY - equipmentY,
        });
    };

    // Handle mouse move
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (dragging === null) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Convert to feet
            const newX = Math.max(0, Math.min(buildingWidth, ((mouseX - dragOffset.x) / rect.width) * buildingWidth));
            const newY = Math.max(0, Math.min(buildingHeight, ((mouseY - dragOffset.y) / rect.height) * buildingHeight));

            setPositions(prev =>
                prev.map(p =>
                    p.id === dragging
                        ? { ...p, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 }
                        : p
                )
            );
            setHasChanges(true);
        };

        const handleMouseUp = () => {
            setDragging(null);
        };

        if (dragging !== null) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, dragOffset, buildingWidth, buildingHeight]);

    // Save positions to database
    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/buildings/${buildingId}/layouts/${layoutId}/positions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    positions: positions.map(p => ({
                        id: p.id,
                        x: p.x,
                        y: p.y,
                        orientation: p.orientation,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save positions');
            }

            setHasChanges(false);
            router.refresh();
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save positions. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Update position with specific measurements
    const handleUpdatePosition = (posId: number) => {
        const x = parseFloat(tempX);
        const y = parseFloat(tempY);

        if (isNaN(x) || isNaN(y)) {
            alert('Please enter valid numbers for X and Y coordinates');
            return;
        }

        if (x < 0 || x > buildingWidth || y < 0 || y > buildingHeight) {
            alert(`Coordinates must be within building dimensions (0-${buildingWidth}' × 0-${buildingHeight}')`);
            return;
        }

        setPositions(prev =>
            prev.map(p =>
                p.id === posId ? { ...p, x, y } : p
            )
        );
        setHasChanges(true);
        setEditingPosition(null);
        setTempX('');
        setTempY('');
    };

    // Rotate equipment
    const handleRotate = (posId: number) => {
        setPositions(prev =>
            prev.map(p =>
                p.id === posId ? { ...p, orientation: (p.orientation + 90) % 360 } : p
            )
        );
        setHasChanges(true);
    };

    // Toggle lock
    const handleToggleLock = (posId: number) => {
        setPositions(prev =>
            prev.map(p =>
                p.id === posId ? { ...p, locked: !p.locked } : p
            )
        );
        setHasChanges(true);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-300">
                        <span className="font-semibold">Interactive Mode:</span> Drag equipment to move • Click for options
                    </div>
                    {selectedEquipment && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRotate(selectedEquipment)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                title="Rotate 90°"
                            >
                                🔄 Rotate
                            </button>
                            <button
                                onClick={() => handleToggleLock(selectedEquipment)}
                                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                                title="Lock/Unlock position"
                            >
                                {positions.find(p => p.id === selectedEquipment)?.locked ? '🔓 Unlock' : '🔒 Lock'}
                            </button>
                        </div>
                    )}
                </div>

                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>💾 Save Changes</>
                        )}
                    </button>
                )}
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="bg-slate-900 rounded-lg p-4 relative select-none"
                style={{ minHeight: '600px', cursor: dragging !== null ? 'grabbing' : 'default' }}
            >
                <div
                    className="absolute inset-4 border-2 border-slate-700 rounded"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(71, 85, 105, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 85, 105, 0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                >
                    {/* Equipment */}
                    {positions.map((pos) => (
                        <div
                            key={pos.id}
                            className={`absolute rounded p-2 transition-all ${pos.locked
                                ? 'bg-slate-600/30 border-2 border-slate-500 cursor-not-allowed'
                                : dragging === pos.id
                                    ? 'bg-blue-600/50 border-2 border-blue-400 cursor-grabbing shadow-lg shadow-blue-500/50'
                                    : selectedEquipment === pos.id
                                        ? 'bg-blue-600/40 border-2 border-blue-500 cursor-grab hover:bg-blue-600/50'
                                        : 'bg-blue-600/30 border-2 border-blue-500 cursor-grab hover:bg-blue-600/40'
                                }`}
                            style={{
                                left: `${(pos.x / buildingWidth) * 100}%`,
                                top: `${(pos.y / buildingHeight) * 100}%`,
                                width: `${(pos.equipment.widthFt / buildingWidth) * 100}%`,
                                height: `${(pos.equipment.depthFt / buildingHeight) * 100}%`,
                                transform: `rotate(${pos.orientation}deg)`,
                                transformOrigin: 'center',
                            }}
                            onMouseDown={(e) => handleMouseDown(e, pos.id, pos)}
                            onClick={() => setSelectedEquipment(pos.id)}
                        >
                            <div className="text-white text-xs font-semibold truncate">
                                {pos.equipment.name}
                                {pos.locked && ' 🔒'}
                            </div>
                            <div className="text-slate-300 text-xs mt-1">
                                {pos.equipment.widthFt}' × {pos.equipment.depthFt}'
                            </div>
                            <div className="text-slate-400 text-xs">
                                ({pos.x.toFixed(1)}', {pos.y.toFixed(1)}')
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Equipment List with Position Editor */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Equipment Positions</h3>
                <div className="space-y-3">
                    {positions.map((pos) => (
                        <div
                            key={pos.id}
                            className={`bg-slate-700/50 p-4 rounded-lg ${selectedEquipment === pos.id ? 'ring-2 ring-blue-500' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-semibold text-white flex items-center gap-2">
                                        {pos.equipment.name}
                                        {pos.locked && <span className="text-yellow-500">🔒</span>}
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1">
                                        Size: {pos.equipment.widthFt}' × {pos.equipment.depthFt}' • Rotation: {pos.orientation}°
                                    </div>

                                    {editingPosition === pos.id ? (
                                        <div className="mt-3 flex items-center gap-3">
                                            <div>
                                                <label className="text-xs text-slate-400 block mb-1">X (feet)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={tempX}
                                                    onChange={(e) => setTempX(e.target.value)}
                                                    className="w-24 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                                                    placeholder={pos.x.toString()}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-400 block mb-1">Y (feet)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={tempY}
                                                    onChange={(e) => setTempY(e.target.value)}
                                                    className="w-24 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                                                    placeholder={pos.y.toString()}
                                                />
                                            </div>
                                            <div className="flex gap-2 mt-5">
                                                <button
                                                    onClick={() => handleUpdatePosition(pos.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                                                >
                                                    ✓ Apply
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingPosition(null);
                                                        setTempX('');
                                                        setTempY('');
                                                    }}
                                                    className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded"
                                                >
                                                    ✕ Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-300 mt-2">
                                            Position: ({pos.x.toFixed(1)}', {pos.y.toFixed(1)}')
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {editingPosition !== pos.id && (
                                        <button
                                            onClick={() => {
                                                setEditingPosition(pos.id);
                                                setTempX(pos.x.toString());
                                                setTempY(pos.y.toString());
                                            }}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                                        >
                                            📐 Edit Position
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
