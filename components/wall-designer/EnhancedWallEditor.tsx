"use client";

import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Group, Rect, Text } from 'react-konva';
import { SnapManager, SnapPoint } from '@/lib/wall-designer/SnapManager';
import { LayerManager } from '@/lib/wall-designer/LayerManager';
import { SelectionManager, BulkOperations, SelectableElement } from '@/lib/wall-designer/SelectionManager';
import { SnapIndicators, SnapLegend, SnapSettingsPanel } from '@/components/wall-designer/SnapIndicators';
import { LayerPanel, LayerSwitcher } from '@/components/wall-designer/LayerPanel';
import { SelectionToolbar, SelectionBox, LassoPath } from '@/components/wall-designer/SelectionToolbar';
import { Maximize2, Minimize2, Save, Undo, Redo, Grid, Eye, EyeOff } from 'lucide-react';

interface Wall {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness: number; // inches
    length?: number; // feet (calculated or user-specified)
}

interface Equipment {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    rotation?: number;
}

export function EnhancedWallEditor() {
    // Managers
    const [snapManager] = useState(() => new SnapManager({
        enabled: true,
        snapDistance: 15,
        showIndicators: true
    }));

    const [layerManager] = useState(() => new LayerManager());
    const [selectionManager] = useState(() => new SelectionManager());

    // Canvas state
    const stageRef = useRef<any>(null);
    const [walls, setWalls] = useState<Wall[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Interaction state
    const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

    // UI state
    const [showGrid, setShowGrid] = useState(true);
    const [showSnapSettings, setShowSnapSettings] = useState(false);
    const [showLayers, setShowLayers] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);
    const [windowDimensions, setWindowDimensions] = useState({ width: 1200, height: 800 });

    // Wall settings
    const [wallThickness, setWallThickness] = useState(6); // inches
    const [showMeasurements, setShowMeasurements] = useState(true);
    const [measurementInput, setMeasurementInput] = useState('');
    const [showMeasurementDialog, setShowMeasurementDialog] = useState(false);

    // History
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Set window dimensions on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });

            const handleResize = () => {
                setWindowDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    /**
     * Handle mouse move - update snap point
     */
    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        // Convert to world coordinates
        const worldX = (pointer.x - position.x) / scale;
        const worldY = (pointer.y - position.y) / scale;

        // Find snap point
        const wallSegments = walls.map(w => ({
            id: w.id,
            start: { x: w.x1, y: w.y1 },
            end: { x: w.x2, y: w.y2 }
        }));

        const snapObjects = equipment.map(eq => ({
            id: eq.id,
            x: eq.x,
            y: eq.y,
            width: eq.width,
            height: eq.height
        }));

        const snap = snapManager.findSnapPoint(
            { x: worldX, y: worldY },
            wallSegments,
            snapObjects,
            12 // 1 foot grid
        );

        setCurrentSnapPoint(snap);
        setCurrentPoint({ x: worldX, y: worldY });

        // Update selection box if dragging
        if (selectionBox && selectionBox.start) {
            setSelectionBox({
                start: selectionBox.start,
                end: { x: worldX, y: worldY }
            });
        }
    };

    /**
     * Handle click - add wall or select
     */
    const handleClick = (e: any) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const worldX = (pointer.x - position.x) / scale;
        const worldY = (pointer.y - position.y) / scale;

        // Use snap point if available
        const finalPoint = currentSnapPoint || { x: worldX, y: worldY };

        // Get selection mode
        const mode = selectionManager.getOptions().mode;

        if (mode === 'single') {
            // Drawing mode
            if (!isDrawing) {
                setIsDrawing(true);
                setDrawStart(finalPoint);
            } else {
                // Complete wall
                if (drawStart) {
                    // Calculate length in feet (12 pixels = 1 foot)
                    const dx = finalPoint.x - drawStart.x;
                    const dy = finalPoint.y - drawStart.y;
                    const lengthInPixels = Math.sqrt(dx * dx + dy * dy);
                    const lengthInFeet = lengthInPixels / 12;

                    const newWall: Wall = {
                        id: `wall-${Date.now()}`,
                        x1: drawStart.x,
                        y1: drawStart.y,
                        x2: finalPoint.x,
                        y2: finalPoint.y,
                        thickness: wallThickness,
                        length: Math.round(lengthInFeet * 10) / 10 // Round to 1 decimal
                    };
                    setWalls([...walls, newWall]);

                    // Add to walls layer
                    const wallsLayer = layerManager.getLayerByType('walls');
                    if (wallsLayer) {
                        layerManager.addElement(wallsLayer.id, newWall.id);
                    }

                    setIsDrawing(false);
                    setDrawStart(null);
                    saveToHistory();
                }
            }
        }
    };

    /**
     * Handle mouse down - start selection box
     */
    const handleMouseDown = (e: any) => {
        const mode = selectionManager.getOptions().mode;

        if (mode === 'box') {
            const stage = e.target.getStage();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const worldX = (pointer.x - position.x) / scale;
            const worldY = (pointer.y - position.y) / scale;

            setSelectionBox({
                start: { x: worldX, y: worldY },
                end: { x: worldX, y: worldY }
            });
        }
    };

    /**
     * Handle mouse up - complete selection
     */
    const handleMouseUp = () => {
        const mode = selectionManager.getOptions().mode;

        if (mode === 'box' && selectionBox) {
            // Convert elements to selectable format
            const selectableElements: SelectableElement[] = [
                ...walls.map(w => ({
                    id: w.id,
                    type: 'wall',
                    bounds: {
                        x: Math.min(w.x1, w.x2),
                        y: Math.min(w.y1, w.y2),
                        width: Math.abs(w.x2 - w.x1),
                        height: Math.abs(w.y2 - w.y1)
                    }
                })),
                ...equipment.map(eq => ({
                    id: eq.id,
                    type: 'equipment',
                    bounds: {
                        x: eq.x,
                        y: eq.y,
                        width: eq.width,
                        height: eq.height
                    }
                }))
            ];

            const selected = selectionManager.selectBox(
                selectionBox.start,
                selectionBox.end,
                selectableElements,
                'intersect',
                false
            );

            setSelectedIds(selected);
            setSelectionBox(null);
        }
    };

    /**
     * Handle bulk operations
     */
    const handleBulkOperation = (operation: string, params?: any) => {
        const selectableElements: SelectableElement[] = [
            ...walls.map(w => ({
                id: w.id,
                type: 'wall',
                bounds: {
                    x: Math.min(w.x1, w.x2),
                    y: Math.min(w.y1, w.y2),
                    width: Math.abs(w.x2 - w.x1),
                    height: Math.abs(w.y2 - w.y1)
                }
            })),
            ...equipment.map(eq => ({
                id: eq.id,
                type: 'equipment',
                bounds: {
                    x: eq.x,
                    y: eq.y,
                    width: eq.width,
                    height: eq.height
                }
            }))
        ];

        if (operation === 'align') {
            const newPositions = BulkOperations.align(selectableElements, selectedIds, params);

            // Apply new positions to equipment
            setEquipment(equipment.map(eq => {
                const newPos = newPositions.get(eq.id);
                return newPos ? { ...eq, x: newPos.x, y: newPos.y } : eq;
            }));

            saveToHistory();
        } else if (operation === 'distribute') {
            const newPositions = BulkOperations.distribute(selectableElements, selectedIds, params);

            setEquipment(equipment.map(eq => {
                const newPos = newPositions.get(eq.id);
                return newPos ? { ...eq, x: newPos.x, y: newPos.y } : eq;
            }));

            saveToHistory();
        }
    };

    /**
     * Save to history
     */
    const saveToHistory = () => {
        const state = { walls, equipment };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(state);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    /**
     * Undo
     */
    const undo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setWalls(prevState.walls);
            setEquipment(prevState.equipment);
            setHistoryIndex(historyIndex - 1);
        }
    };

    /**
     * Redo
     */
    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setWalls(nextState.walls);
            setEquipment(nextState.equipment);
            setHistoryIndex(historyIndex + 1);
        }
    };

    /**
     * Zoom
     */
    const handleWheel = (e: any) => {
        e.evt.preventDefault();

        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = scale;
        const pointer = stage.getPointerPosition();

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        setScale(newScale);
        setPosition({
            x: pointer.x - ((pointer.x - position.x) / oldScale) * newScale,
            y: pointer.y - ((pointer.y - position.y) / oldScale) * newScale
        });
    };

    return (
        <div className={`relative ${fullscreen ? 'fixed inset-0 z-50' : 'h-screen'} bg-slate-900`}>
            {/* Top Toolbar */}
            <div className="absolute top-0 left-0 right-0 bg-slate-800/95 border-b border-slate-700 p-2 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <h2 className="text-white font-semibold">Enhanced Wall Designer</h2>
                    <LayerSwitcher
                        layerManager={layerManager}
                        onLayerChange={() => { }}
                    />

                    <div className="w-px h-6 bg-slate-600 mx-2" />

                    {/* Wall Thickness Control */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Wall Thickness:</label>
                        <select
                            value={wallThickness}
                            onChange={(e) => setWallThickness(parseInt(e.target.value))}
                            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        >
                            <option value="4">4" (2x4)</option>
                            <option value="6">6" (2x6)</option>
                            <option value="8">8" (2x8)</option>
                            <option value="12">12" (2x12)</option>
                        </select>
                    </div>

                    {/* Show Measurements Toggle */}
                    <button
                        onClick={() => setShowMeasurements(!showMeasurements)}
                        className={`px-3 py-1 rounded text-xs ${showMeasurements ? 'bg-green-600' : 'bg-slate-700'}`}
                        title="Toggle Measurements"
                    >
                        {showMeasurements ? '📏 Measurements ON' : '📏 Measurements OFF'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={16} />
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={16} />
                    </button>

                    <div className="w-px h-6 bg-slate-600" />

                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-2 rounded ${showGrid ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                        title="Toggle Grid"
                    >
                        <Grid size={16} />
                    </button>

                    <button
                        onClick={() => setShowLayers(!showLayers)}
                        className={`p-2 rounded ${showLayers ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                        title="Toggle Layers Panel"
                    >
                        {showLayers ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>

                    <button
                        onClick={() => setFullscreen(!fullscreen)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                        title="Toggle Fullscreen"
                    >
                        {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    <button
                        onClick={() => console.log('Save', { walls, equipment })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
                    >
                        <Save size={16} />
                        <span>Save</span>
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <Stage
                ref={stageRef}
                width={windowDimensions.width}
                height={windowDimensions.height - 48}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                className="mt-12"
            >
                <Layer>
                    {/* Grid */}
                    {showGrid && (
                        <Group>
                            {Array.from({ length: 100 }).map((_, i) => (
                                <Line
                                    key={`grid-v-${i}`}
                                    points={[i * 12, 0, i * 12, 1200]}
                                    stroke="#334155"
                                    strokeWidth={0.5 / scale}
                                    opacity={0.3}
                                />
                            ))}
                            {Array.from({ length: 100 }).map((_, i) => (
                                <Line
                                    key={`grid-h-${i}`}
                                    points={[0, i * 12, 1200, i * 12]}
                                    stroke="#334155"
                                    strokeWidth={0.5 / scale}
                                    opacity={0.3}
                                />
                            ))}
                        </Group>
                    )}

                    {/* Walls */}
                    {walls.map(wall => {
                        const isSelected = selectedIds.includes(wall.id);
                        const wallLayer = layerManager.getElementLayer(wall.id);
                        const visible = wallLayer ? wallLayer.visible : true;
                        const opacity = wallLayer ? wallLayer.opacity : 1;

                        // Calculate midpoint for measurement label
                        const midX = (wall.x1 + wall.x2) / 2;
                        const midY = (wall.y1 + wall.y2) / 2;

                        return visible ? (
                            <Group key={wall.id}>
                                {/* Main wall line */}
                                <Line
                                    points={[wall.x1, wall.y1, wall.x2, wall.y2]}
                                    stroke={isSelected ? '#3b82f6' : '#94a3b8'}
                                    strokeWidth={(wall.thickness / 2) / scale} // Show thickness
                                    opacity={opacity}
                                />

                                {/* Measurement label */}
                                {showMeasurements && wall.length && (
                                    <Group>
                                        {/* Background for text */}
                                        <Rect
                                            x={midX - 25 / scale}
                                            y={midY - 12 / scale}
                                            width={50 / scale}
                                            height={20 / scale}
                                            fill="#1e293b"
                                            opacity={0.9}
                                            cornerRadius={4 / scale}
                                        />
                                        {/* Length text */}
                                        <Text
                                            x={midX}
                                            y={midY}
                                            text={`${wall.length}'`}
                                            fontSize={12 / scale}
                                            fill="#22c55e"
                                            align="center"
                                            verticalAlign="middle"
                                            offsetX={20 / scale}
                                            offsetY={6 / scale}
                                        />
                                    </Group>
                                )}
                            </Group>
                        ) : null;
                    })}

                    {/* Equipment */}
                    {equipment.map(eq => {
                        const isSelected = selectedIds.includes(eq.id);
                        const eqLayer = layerManager.getElementLayer(eq.id);
                        const visible = eqLayer ? eqLayer.visible : true;
                        const opacity = eqLayer ? eqLayer.opacity : 1;

                        return visible ? (
                            <Group key={eq.id}>
                                <Rect
                                    x={eq.x}
                                    y={eq.y}
                                    width={eq.width}
                                    height={eq.height}
                                    fill={isSelected ? '#3b82f6' : '#8b5cf6'}
                                    opacity={opacity * 0.5}
                                    stroke={isSelected ? '#3b82f6' : '#8b5cf6'}
                                    strokeWidth={2 / scale}
                                />
                                <Text
                                    x={eq.x}
                                    y={eq.y - 15 / scale}
                                    text={eq.name}
                                    fontSize={12 / scale}
                                    fill="#ffffff"
                                />
                            </Group>
                        ) : null;
                    })}

                    {/* Drawing preview */}
                    {isDrawing && drawStart && currentPoint && (
                        <Line
                            points={[drawStart.x, drawStart.y, currentPoint.x, currentPoint.y]}
                            stroke="#22c55e"
                            strokeWidth={2 / scale}
                            dash={[5 / scale, 5 / scale]}
                        />
                    )}

                    {/* Snap indicators */}
                    <SnapIndicators
                        snapPoint={currentSnapPoint}
                        scale={scale}
                    />

                    {/* Selection box */}
                    {selectionBox && (
                        <Rect
                            x={Math.min(selectionBox.start.x, selectionBox.end.x)}
                            y={Math.min(selectionBox.start.y, selectionBox.end.y)}
                            width={Math.abs(selectionBox.end.x - selectionBox.start.x)}
                            height={Math.abs(selectionBox.end.y - selectionBox.start.y)}
                            stroke="#3b82f6"
                            strokeWidth={2 / scale}
                            fill="rgba(59, 130, 246, 0.1)"
                            dash={[5 / scale, 5 / scale]}
                        />
                    )}
                </Layer>
            </Stage>

            {/* Left Panel - Selection Tools */}
            <div className="absolute top-16 left-4 space-y-4">
                <SelectionToolbar
                    selectionManager={selectionManager}
                    selectedCount={selectedIds.length}
                    onModeChange={(mode) => {
                        selectionManager.updateOptions({ mode });
                    }}
                    onBulkOperation={handleBulkOperation}
                />
            </div>

            {/* Right Panel - Layers */}
            {showLayers && (
                <div className="absolute top-16 right-4 space-y-4">
                    <LayerPanel
                        layerManager={layerManager}
                        onLayerChange={() => {
                            // Force re-render
                            setWalls([...walls]);
                        }}
                    />
                    <SnapLegend />
                </div>
            )}

            {/* Bottom Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-800/95 border-t border-slate-700 p-2 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                    <span>Walls: {walls.length}</span>
                    <span>Equipment: {equipment.length}</span>
                    <span>Selected: {selectedIds.length}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>Zoom: {Math.round(scale * 100)}%</span>
                    {currentSnapPoint && (
                        <span className="text-green-400">
                            Snap: {currentSnapPoint.type}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
