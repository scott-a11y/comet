'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MaterialFlowPath {
    id: number;
    name: string;
    pathType: string;
    fromEntryPointId: number | null;
    toEntryPointId: number | null;
    pathData: { x: number; y: number }[];
    color: string;
    notes: string | null;
}

interface EntryPoint {
    id: number;
    name: string;
    type: string;
    x: number;
    y: number;
}

interface MaterialFlowPathEditorProps {
    layoutId: number;
    buildingWidth: number;
    buildingDepth: number;
    entryPoints: EntryPoint[];
    materialFlowPaths: MaterialFlowPath[];
    equipmentPositions: Array<{
        id: number;
        x: number;
        y: number;
        equipment: {
            name: string;
            widthFt: number;
            depthFt: number;
        };
    }>;
}

const PATH_TYPES = [
    { value: 'receiving', label: '📦 Receiving', color: '#3b82f6' },
    { value: 'processing', label: '⚙️ Processing', color: '#8b5cf6' },
    { value: 'shipping', label: '🚚 Shipping', color: '#10b981' },
    { value: 'waste', label: '🗑️ Waste/Scrap', color: '#ef4444' },
];

export default function MaterialFlowPathEditor({
    layoutId,
    buildingWidth,
    buildingDepth,
    entryPoints,
    materialFlowPaths: initialPaths,
    equipmentPositions,
}: MaterialFlowPathEditorProps) {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [paths, setPaths] = useState<MaterialFlowPath[]>(initialPaths);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
    const [selectedPathType, setSelectedPathType] = useState('receiving');
    const [pathName, setPathName] = useState('');
    const [fromEntryPoint, setFromEntryPoint] = useState<number | null>(null);
    const [toEntryPoint, setToEntryPoint] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const SCALE = Math.min(CANVAS_WIDTH / buildingWidth, CANVAS_HEIGHT / buildingDepth);

    useEffect(() => {
        drawCanvas();
    }, [paths, currentPath, entryPoints, equipmentPositions]);

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw building outline
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, buildingWidth * SCALE, buildingDepth * SCALE);

        // Draw equipment
        equipmentPositions.forEach((pos) => {
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            const x = pos.x * SCALE;
            const y = pos.y * SCALE;
            const w = pos.equipment.widthFt * SCALE;
            const h = pos.equipment.depthFt * SCALE;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Equipment label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText(pos.equipment.name, x + 2, y + 12);
        });

        // Draw entry points
        entryPoints.forEach((point) => {
            const x = point.x * SCALE;
            const y = point.y * SCALE;

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fbbf24';
            ctx.font = '11px sans-serif';
            ctx.fillText(point.name, x + 10, y + 4);
        });

        // Draw existing paths
        paths.forEach((path) => {
            if (path.pathData.length < 2) return;

            ctx.strokeStyle = path.color;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(path.pathData[0].x * SCALE, path.pathData[0].y * SCALE);
            for (let i = 1; i < path.pathData.length; i++) {
                ctx.lineTo(path.pathData[i].x * SCALE, path.pathData[i].y * SCALE);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw arrow at end
            if (path.pathData.length >= 2) {
                const last = path.pathData[path.pathData.length - 1];
                const prev = path.pathData[path.pathData.length - 2];
                const angle = Math.atan2((last.y - prev.y) * SCALE, (last.x - prev.x) * SCALE);
                const x = last.x * SCALE;
                const y = last.y * SCALE;

                ctx.fillStyle = path.color;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - 10 * Math.cos(angle - Math.PI / 6), y - 10 * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(x - 10 * Math.cos(angle + Math.PI / 6), y - 10 * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                ctx.fill();
            }
        });

        // Draw current path being drawn
        if (currentPath.length > 0) {
            const pathType = PATH_TYPES.find((t) => t.value === selectedPathType);
            ctx.strokeStyle = pathType?.color || '#3b82f6';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(currentPath[0].x * SCALE, currentPath[0].y * SCALE);
            for (let i = 1; i < currentPath.length; i++) {
                ctx.lineTo(currentPath[i].x * SCALE, currentPath[i].y * SCALE);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw points
            currentPath.forEach((point, i) => {
                ctx.fillStyle = i === 0 ? '#10b981' : pathType?.color || '#3b82f6';
                ctx.beginPath();
                ctx.arc(point.x * SCALE, point.y * SCALE, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / SCALE;
        const y = (e.clientY - rect.top) / SCALE;

        setCurrentPath([...currentPath, { x, y }]);
    };

    const startDrawing = () => {
        if (!pathName) {
            alert('Please enter a path name first');
            return;
        }
        setIsDrawing(true);
        setCurrentPath([]);
    };

    const finishDrawing = async () => {
        if (currentPath.length < 2) {
            alert('Please draw at least 2 points for the path');
            return;
        }

        setSaving(true);
        try {
            const pathType = PATH_TYPES.find((t) => t.value === selectedPathType);
            const response = await fetch(`/api/layouts/${layoutId}/material-flow-paths`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: pathName,
                    pathType: selectedPathType,
                    pathData: currentPath,
                    color: pathType?.color || '#3b82f6',
                    fromEntryPointId: fromEntryPoint,
                    toEntryPointId: toEntryPoint,
                }),
            });

            if (!response.ok) throw new Error('Failed to save path');

            setIsDrawing(false);
            setCurrentPath([]);
            setPathName('');
            setFromEntryPoint(null);
            setToEntryPoint(null);
            router.refresh();
        } catch (error) {
            console.error('Error saving path:', error);
            alert('Failed to save material flow path');
        } finally {
            setSaving(false);
        }
    };

    const cancelDrawing = () => {
        setIsDrawing(false);
        setCurrentPath([]);
    };

    const deletePath = async (pathId: number) => {
        if (!confirm('Delete this material flow path?')) return;

        try {
            const response = await fetch(`/api/layouts/${layoutId}/material-flow-paths/${pathId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete path');

            router.refresh();
        } catch (error) {
            console.error('Error deleting path:', error);
            alert('Failed to delete path');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Material Flow Paths</h3>
            </div>

            {/* Drawing Controls */}
            {!isDrawing ? (
                <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold mb-3">Draw New Flow Path</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Path Name</label>
                            <input
                                type="text"
                                value={pathName}
                                onChange={(e) => setPathName(e.target.value)}
                                placeholder="e.g., Raw Material to Cutting"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Path Type</label>
                            <select
                                value={selectedPathType}
                                onChange={(e) => setSelectedPathType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                {PATH_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">From Entry Point (Optional)</label>
                            <select
                                value={fromEntryPoint || ''}
                                onChange={(e) => setFromEntryPoint(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">None</option>
                                {entryPoints.map((point) => (
                                    <option key={point.id} value={point.id}>
                                        {point.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">To Entry Point (Optional)</label>
                            <select
                                value={toEntryPoint || ''}
                                onChange={(e) => setToEntryPoint(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">None</option>
                                {entryPoints.map((point) => (
                                    <option key={point.id} value={point.id}>
                                        {point.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={startDrawing}
                        disabled={!pathName}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Start Drawing Path
                    </button>
                </div>
            ) : (
                <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                    <h4 className="font-semibold mb-2">Drawing: {pathName}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                        Click on the canvas to add points to your path. Click at least 2 points.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={finishDrawing}
                            disabled={currentPath.length < 2 || saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Finish Path'}
                        </button>
                        <button
                            onClick={cancelDrawing}
                            disabled={saving}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <span className="text-sm text-gray-600 self-center ml-2">
                            Points: {currentPath.length}
                        </span>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onClick={handleCanvasClick}
                    className={isDrawing ? 'cursor-crosshair' : 'cursor-default'}
                />
            </div>

            {/* Existing Paths List */}
            {paths.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Existing Flow Paths</h4>
                    <div className="space-y-2">
                        {paths.map((path) => {
                            const pathType = PATH_TYPES.find((t) => t.value === path.pathType);
                            return (
                                <div
                                    key={path.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: path.color }}
                                        />
                                        <div>
                                            <div className="font-medium">{path.name}</div>
                                            <div className="text-sm text-gray-500">{pathType?.label || path.pathType}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deletePath(path.id)}
                                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
