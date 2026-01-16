'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Text, Rect, Arc, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Settings, Undo2, Redo2, Trash2, Maximize, Target, MousePointer2, Move, DoorOpen, Square, Zap, Cable, Box, Link, FileUp, Ruler, Layers, Menu, Grid3x3, Calculator, Home } from 'lucide-react';
import type { BuildingFloorGeometry, BuildingVertex, BuildingWallSegment, BuildingOpening, ElectricalEntry, Component, ComponentCategory, LayerVisibility } from '@/lib/types/building-geometry';
import { COMPONENT_CATALOG, createComponentFromTemplate, type ComponentTemplate } from '@/lib/wall-designer/component-catalog';
import { convertPDFToImage, validatePDFFile } from '@/lib/wall-designer/pdf-upload-handler';
import { analyzeBlueprintWithAI, validateAnalysisResult } from '@/lib/wall-designer/blueprint-analyzer';
import { upload } from '@vercel/blob/client';
import { useWorkspaceStore } from '@/hooks/use-workspace-store';
import { DockableToolbar, DockableWorkspace } from '@/components/layout/DockableToolbar';
import { WorkspaceSettingsModal } from './WorkspaceSettingsModal';
import { AdvancedWallTools, type AdvancedDrawMode, type WallProperties, calculateOrthogonalPoint, calculateAngleLockedPoint, calculateParallelPoint, calculatePerpendicularPoint, calculateOffsetWall } from './advanced-wall-tools';
import { DimensionInputBox, type CoordinateInputMode, type DimensionInput, dimensionToCoordinates, QuickDimensionPresets } from './dimension-input';
import { detectRooms, cleanupWalls, autoCloseRoom, findWallGaps, suggestRoomName, type Room } from './smart-wall-utils';

/**
 * SketchUp-style Top Menu Bar
 */
const TopMenuBar = ({
    activeToolbars,
    onToggleToolbar,
    onAction
}: {
    activeToolbars: any,
    onToggleToolbar: (key: string) => void,
    onAction: (action: string) => void
}) => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const MenuButton = ({ label, menuId }: { label: string, menuId: string }) => (
        <div className="relative">
            <button
                className={`px-3 py-1 text-sm rounded hover:bg-slate-700 transition-colors ${openMenu === menuId ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                onClick={() => setOpenMenu(openMenu === menuId ? null : menuId)}
            >
                {label}
            </button>
            {openMenu === menuId && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded shadow-2xl z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {menuId === 'file' && (
                        <>
                            <button onClick={() => { onAction('upload-pdf'); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-blue-600 hover:text-white">Upload Blueprint (PDF)</button>
                            <button onClick={() => { onAction('save'); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-blue-600 hover:text-white">Save Workspace</button>
                            <div className="border-t border-slate-700 my-1"></div>
                            <button onClick={() => { onAction('clear'); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white">Clear All</button>
                        </>
                    )}
                    {menuId === 'view' && (
                        <>
                            <label className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer">
                                <input type="checkbox" checked={activeToolbars.layers} onChange={() => onToggleToolbar('layers')} className="mr-3" />
                                Layers Panel
                            </label>
                            <label className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer">
                                <input type="checkbox" checked={activeToolbars.stats} onChange={() => onToggleToolbar('stats')} className="mr-3" />
                                Stats Panel
                            </label>
                            <div className="border-t border-slate-700 my-1"></div>
                            <button onClick={() => { onAction('zoom-reset'); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Reset Viewport</button>
                        </>
                    )}
                    {menuId === 'tools' && (
                        <>
                            <button onClick={() => { onAction('measure'); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Tape Measure (M)</button>
                            <button onClick={() => { onAction('calibrate'); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Calibrate Scale</button>
                            <button onClick={() => { onAction('detect-rooms'); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Room Detection</button>
                            <div className="border-t border-slate-700 my-1"></div>
                            <label className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer">
                                <input type="checkbox" checked={activeToolbars.advanced} onChange={() => onToggleToolbar('advanced')} className="mr-3" />
                                Advanced Drawing Tools
                            </label>
                            <label className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer">
                                <input type="checkbox" checked={activeToolbars.dimensions} onChange={() => onToggleToolbar('dimensions')} className="mr-3" />
                                Dimension Tooltips
                            </label>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    useEffect(() => {
        const handleClickOutside = () => setOpenMenu(null);
        if (openMenu) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openMenu]);

    return (
        <div className="flex items-center h-10 px-2 bg-slate-900 border-b border-slate-800 gap-1 select-none">
            <div className="flex items-center gap-2 mr-4 ml-1">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold text-white">C</div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-tighter">Comet Architect</span>
            </div>

            <MenuButton label="File" menuId="file" />
            <MenuButton label="Edit" menuId="edit" />
            <MenuButton label="View" menuId="view" />
            <MenuButton label="Tools" menuId="tools" />
            <MenuButton label="Window" menuId="window" />
            <MenuButton label="Help" menuId="help" />
        </div>
    );
};

interface Props {
    buildingWidth?: number;
    buildingDepth?: number;
    initialGeometry?: BuildingFloorGeometry | null;
    initialScaleFtPerUnit?: number | null;
    initialPdfUrl?: string | null;
    onChange: (payload: {
        geometry: BuildingFloorGeometry | null;
        scaleFtPerUnit: number | null;
        validationError: string | null;
    }) => void;
}

type Mode = 'DRAW' | 'EDIT' | 'SELECT' | 'PAN' | 'DOOR' | 'WINDOW' | 'POWER' | 'ELECTRIC_RUN' | 'COMPONENT' | 'CALIBRATE' | 'MEASURE';
type ToolbarDockPosition = 'top-left' | 'top-center' | 'bottom-center' | 'left-bar';

const GRID_SIZE = 20; // pixels
const SNAP_DIST = 15; // pixels
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

function newId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function snapToGrid(p: { x: number; y: number }, gridSize = GRID_SIZE) {
    return {
        x: Math.round(p.x / gridSize) * gridSize,
        y: Math.round(p.y / gridSize) * gridSize,
    };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Blueprint Image Component - Uses useImage hook to load image for Konva
function BlueprintImage({ src }: { src: string }) {
    const [image, status] = useImage(src);

    if (status === 'loading') {
        return null; // Or could show a loading placeholder
    }

    if (status === 'failed') {
        console.error('Failed to load blueprint image');
        return null;
    }

    return <KonvaImage image={image} />;
}

export function ImprovedWallEditor({
    buildingWidth,
    buildingDepth,
    initialGeometry,
    initialScaleFtPerUnit,
    initialPdfUrl,
    onChange,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);

    // Canvas state
    const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [scaleFtPerUnit, setScaleFtPerUnit] = useState<number | null>(initialScaleFtPerUnit || null);
    const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
    const [scaleInputFt, setScaleInputFt] = useState('1');
    const [showScaleDialog, setShowScaleDialog] = useState(false);

    // Drawing state
    const [mode, setMode] = useState<Mode>('DRAW');
    const [vertices, setVertices] = useState<BuildingVertex[]>([]);
    const [segments, setSegments] = useState<BuildingWallSegment[]>([]);
    const [lastWallVertexId, setLastWallVertexId] = useState<string | null>(null);

    // History state
    const [history, setHistory] = useState<Array<{
        vertices: BuildingVertex[],
        segments: BuildingWallSegment[],
        openings: BuildingOpening[],
        electricalEntries: ElectricalEntry[],
        systemRuns: any[],
        components: Component[]
    }>>([]);
    const [redoStack, setRedoStack] = useState<Array<{
        vertices: BuildingVertex[],
        segments: BuildingWallSegment[],
        openings: BuildingOpening[],
        electricalEntries: ElectricalEntry[],
        systemRuns: any[],
        components: Component[]
    }>>([]);
    const [selectedVertexId, setSelectedVertexId] = useState<string | null>(null);
    const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
    const [ghostPoint, setGhostPoint] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const hasLoadedInitialRef = useRef(false);

    const [openings, setOpenings] = useState<BuildingOpening[]>([]);
    const [electricalEntries, setElectricalEntries] = useState<ElectricalEntry[]>([]);
    const [systemRuns, setSystemRuns] = useState<any[]>([]);
    const [activeRunPoints, setActiveRunPoints] = useState<{ x: number, y: number }[]>([]);
    const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { visibleTools, dockPosition, isCompact } = useWorkspaceStore();
    const setDockPosition = useWorkspaceStore((state) => state.setDockPosition);

    // Component library state
    const [components, setComponents] = useState<Component[]>([]);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [componentToPlace, setComponentToPlace] = useState<ComponentTemplate | null>(null);
    const [componentRotation, setComponentRotation] = useState(0);
    const [showComponentBrowser, setShowComponentBrowser] = useState(false);

    // Panel visibility state
    const [showScalePanel, setShowScalePanel] = useState(true);
    const [showLayerPanel, setShowLayerPanel] = useState(true);

    // Room detection state
    const [detectedRooms, setDetectedRooms] = useState<Room[]>([]);
    const [showRoomLabels, setShowRoomLabels] = useState(true);

    // Layer visibility state
    const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
        walls: true,
        openings: true,
        electrical: true,
        hvac: true,
        plumbing: true,
        dustCollection: true,
        compressedAir: true,
        components: true,
        measurements: true
    });

    // PDF Blueprint overlay state
    const [blueprintImage, setBlueprintImage] = useState<string | null>(null);
    const [blueprintOpacity, setBlueprintOpacity] = useState(0.5);
    const [blueprintPosition, setBlueprintPosition] = useState({ x: 0, y: 0 });
    const [blueprintScale, setBlueprintScale] = useState(1);
    const [blueprintRotation, setBlueprintRotation] = useState(0);
    const [showBlueprint, setShowBlueprint] = useState(true);
    const [uploadingPDF, setUploadingPDF] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Spacebar Panning State
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    const [isCtrlPressed, setIsCtrlPressed] = useState(false);

    // Measurement tool state
    const [measurementPoints, setMeasurementPoints] = useState<Array<{ x: number; y: number }>>([]);
    const [measurementDistance, setMeasurementDistance] = useState<number | null>(null);

    // Top menu bar state
    const [showTopMenu, setShowTopMenu] = useState(true);
    const [activeToolbars, setActiveToolbars] = useState({
        main: true,
        advanced: false,
        dimensions: false,
        layers: true,
        stats: true
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                if (e.target === document.body || e.target === containerRef.current) {
                    e.preventDefault();
                }
                setIsSpacePressed(true);
            }
            if (e.key === 'Control' || e.metaKey) {
                setIsCtrlPressed(true);
            }

            // Advanced drawing mode shortcuts (only when in DRAW mode)
            if (mode === 'DRAW' && !e.ctrlKey && !e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'o':
                        e.preventDefault();
                        setAdvancedDrawMode(prev => prev === 'orthogonal' ? 'free' : 'orthogonal');
                        break;
                    case 'a':
                        e.preventDefault();
                        setAdvancedDrawMode(prev => prev === 'angle-lock' ? 'free' : 'angle-lock');
                        break;
                    case 'p':
                        e.preventDefault();
                        if (e.shiftKey) {
                            setAdvancedDrawMode(prev => prev === 'perpendicular' ? 'free' : 'perpendicular');
                        } else {
                            setAdvancedDrawMode(prev => prev === 'parallel' ? 'free' : 'parallel');
                        }
                        break;
                    case 'f':
                        e.preventDefault();
                        setAdvancedDrawMode(prev => prev === 'offset' ? 'free' : 'offset');
                        break;
                    case 'c':
                        e.preventDefault();
                        setAdvancedDrawMode(prev => prev === 'arc' ? 'free' : 'arc');
                        break;
                }
            }

            // ESC key - Exit current mode to SELECT
            if (e.key === 'Escape') {
                e.preventDefault();
                setMode('SELECT');
                setLastWallVertexId(null);
                setMeasurementPoints([]);
                setMeasurementDistance(null);
                setSelectedVertexId(null);
                setSelectedSegmentId(null);
            }

            // UI toggle shortcuts
            if (!e.ctrlKey && !e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 't':
                        e.preventDefault();
                        setShowAdvancedTools(prev => !prev);
                        break;
                    case 'd':
                        if (mode === 'DRAW') {
                            e.preventDefault();
                            setShowDimensionInputBox(prev => !prev);
                        }
                        break;
                    case 'm':
                        e.preventDefault();
                        setMode('MEASURE');
                        setMeasurementPoints([]);
                        setMeasurementDistance(null);
                        break;
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
            if (e.key === 'Control' || !e.metaKey) {
                // Logic slightly imperfect for metaKey release on some OS/browsers, 
                // but checking explicitly if it was the keyup helps.
                // Simpler: Just unset if key is Control. 
                // For Mac Meta key, we might need e.key === 'Meta'.
                if (e.key === 'Control' || e.key === 'Meta') {
                    setIsCtrlPressed(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const pushHistory = useCallback(() => {
        setHistory(prev => {
            const snapshot = JSON.parse(JSON.stringify({
                vertices,
                segments,
                openings,
                electricalEntries,
                systemRuns,
                components
            }));
            const next = [...prev, snapshot];
            if (next.length > 50) return next.slice(1);
            return next;
        });
        setRedoStack([]);
    }, [vertices, segments, openings, electricalEntries, systemRuns, components]);

    // Dimension input while drawing
    const [showDimensionInput, setShowDimensionInput] = useState(false);
    const [pendingWallStart, setPendingWallStart] = useState<BuildingVertex | null>(null);
    const [wallLengthInput, setWallLengthInput] = useState('');
    const [wallAngleInput, setWallAngleInput] = useState('0');

    // SketchUp-style measurement input box (lower-right corner)
    const [sketchupInput, setSketchupInput] = useState('');
    const [showSketchupInput, setShowSketchupInput] = useState(false);
    const sketchupInputRef = useRef<HTMLInputElement>(null);
    const [uploadingModel, setUploadingModel] = useState(false);
    const modelInputRef = useRef<HTMLInputElement>(null);

    // Quick dimension input
    const [showQuickDimension, setShowQuickDimension] = useState(false);
    const [quickWidth, setQuickWidth] = useState(buildingWidth?.toString() || '40');
    const [quickDepth, setQuickDepth] = useState(buildingDepth?.toString() || '60');

    // Grid settings
    const [showGrid, setShowGrid] = useState(true);
    const [gridSpacingFt, setGridSpacingFt] = useState(5);

    // Wall properties editor
    const [showWallProperties, setShowWallProperties] = useState(false);
    const [wallThickness, setWallThickness] = useState('0.5');
    const [wallMaterial, setWallMaterial] = useState<'brick' | 'concrete' | 'drywall'>('drywall');

    // Calibration state
    const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([]);

    // Advanced wall drawing state
    const [advancedDrawMode, setAdvancedDrawMode] = useState<AdvancedDrawMode>('free');
    const [wallProperties, setWallProperties] = useState<WallProperties>({
        type: 'interior',
        thickness: 0.5,
        height: 8,
        material: 'drywall'
    });
    const [angleLock, setAngleLock] = useState(0);
    const [offsetDistance, setOffsetDistance] = useState(2);
    const [referenceSegmentId, setReferenceSegmentId] = useState<string | null>(null);

    // Dimension input state
    const [dimensionInputMode, setDimensionInputMode] = useState<CoordinateInputMode>('length');
    const [showDimensionInputBox, setShowDimensionInputBox] = useState(false);

    const [showAdvancedTools, setShowAdvancedTools] = useState(false);
    const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
    const [calibrationDistancePx, setCalibrationDistancePx] = useState(0);
    const [calibrationLengthFt, setCalibrationLengthFt] = useState('');

    // Responsive stage size handling
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setStageSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Load initial PDF if provided (e.g. from New Building wizard)
    useEffect(() => {
        const loadInitialPdf = async () => {
            if (initialPdfUrl && !blueprintImage && !uploadingPDF) {
                setUploadingPDF(true);
                try {
                    const response = await fetch(initialPdfUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    const result = await convertPDFToImage(arrayBuffer);
                    setBlueprintImage(result.imageUrl);
                    // Center the blueprint
                    setBlueprintPosition({ x: 0, y: 0 });

                    // Auto-calculate scale if we have building dimensions and no existing scale
                    if (buildingWidth && !scaleFtPerUnit) {
                        // scaleFtPerUnit = feet / pixel
                        const calculatedScale = buildingWidth / result.width;
                        setScaleFtPerUnit(calculatedScale);
                        // Also notify parent of the new scale
                        onChange({
                            geometry: initialGeometry || null,
                            scaleFtPerUnit: calculatedScale,
                            validationError: null
                        });
                    }
                } catch (error) {
                    console.error('Failed to load initial PDF:', error);
                } finally {
                    setUploadingPDF(false);
                }
            }
        };
        loadInitialPdf();
    }, [initialPdfUrl]);

    // Global keyboard listener for SketchUp-style input
    const applySketchupMeasurement = useCallback(() => {
        const length = parseFloat(sketchupInput);
        if (isNaN(length) || length <= 0) {
            setSketchupInput('');
            setShowSketchupInput(false);
            return;
        }

        // Case 1: Resizing a selected segment (EDIT mode)
        if (selectedSegmentId) {
            pushHistory();
            setSegments(prev => prev.map(seg => {
                if (seg.id === selectedSegmentId) {
                    const v1 = vertices.find(v => v.id === seg.a);
                    const v2 = vertices.find(v => v.id === seg.b);
                    if (v1 && v2) {
                        const dx = v2.x - v1.x;
                        const dy = v2.y - v1.y;
                        const angle = Math.atan2(dy, dx);
                        const ratio = scaleFtPerUnit || 0.05;
                        const lengthPx = length / ratio;

                        const newEndX = v1.x + lengthPx * Math.cos(angle);
                        const newEndY = v1.y + lengthPx * Math.sin(angle);

                        setVertices(vPrev => vPrev.map(v =>
                            v.id === seg.b ? { ...v, x: newEndX, y: newEndY } : v
                        ));
                    }
                }
                return seg;
            }));
            setSketchupInput('');
            setShowSketchupInput(false);
            return;
        }

        // Case 2: Adding a new wall (DRAW mode)
        const lastVertex = vertices[vertices.length - 1];
        if (!lastVertex) {
            setSketchupInput('');
            setShowSketchupInput(false);
            return;
        }

        pushHistory();
        // Determine direction: use ghostPoint if available, otherwise default to right (0 rad)
        let currentAngleRad = 0;
        if (ghostPoint) {
            const dx = ghostPoint.x - lastVertex.x;
            const dy = ghostPoint.y - lastVertex.y;
            if (dx !== 0 || dy !== 0) {
                currentAngleRad = Math.atan2(dy, dx);
            }
        }

        // Calculate end point based on typed length and angle
        const pixelsPerFoot = scaleFtPerUnit ? (1 / scaleFtPerUnit) : 20;
        const lengthPx = length * pixelsPerFoot;

        const endX = lastVertex.x + lengthPx * Math.cos(currentAngleRad);
        const endY = lastVertex.y + lengthPx * Math.sin(currentAngleRad);

        const pos = { x: endX, y: endY };
        const snappedPos = snapToGridEnabled ? snapToGrid(pos, GRID_SIZE) : pos;

        // Create new vertex
        const newVertexID = newId('v');
        const newVertex: BuildingVertex = {
            id: newVertexID,
            x: snappedPos.x,
            y: snappedPos.y,
        };

        setVertices(prev => [...prev, newVertex]);

        // Create segment with current default thickness
        const newSegment: BuildingWallSegment = {
            id: newId('s'),
            a: lastVertex.id,
            b: newVertexID,
            material: wallMaterial,
            thickness: parseFloat(wallThickness),
        };

        setSegments(prev => [...prev, newSegment]);

        // Reset input
        setSketchupInput('');
        setShowSketchupInput(false);
        // Blur and return focus
        if (sketchupInputRef.current) {
            sketchupInputRef.current.blur();
        }
        stageRef.current?.container()?.focus();
    }, [sketchupInput, vertices, ghostPoint, scaleFtPerUnit, snapToGridEnabled, wallMaterial, wallThickness, selectedSegmentId, pushHistory]);

    // Handle PDF blueprint upload
    const handlePDFUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file
        const validation = validatePDFFile(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        setUploadingPDF(true);

        try {
            // Convert PDF to image
            const result = await convertPDFToImage(file);

            // Set blueprint image
            setBlueprintImage(result.imageUrl);
            setBlueprintOpacity(0.5);
            setBlueprintPosition({ x: 0, y: 0 });
            setBlueprintScale(1);
            setBlueprintRotation(0);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('PDF upload error:', error);
            alert(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploadingPDF(false);
        }
    }, []);


    // Handle Calibration Click
    const handleCalibrationClick = useCallback((pos: { x: number; y: number }) => {
        setCalibrationPoints(prev => {
            const next = [...prev, pos];
            if (next.length === 2) {
                // Calculate pixel distance
                const distPx = distance(next[0], next[1]);
                setCalibrationDistancePx(distPx);
                setShowCalibrationDialog(true);
            }
            return next;
        });
    }, []);

    const applyCalibration = () => {
        const distFt = parseFloat(calibrationLengthFt);
        if (isNaN(distFt) || distFt <= 0) {
            alert('Please enter a valid distance in feet.');
            return;
        }

        // ft / px
        const newScale = distFt / calibrationDistancePx;
        setScaleFtPerUnit(newScale);
        onChange({
            geometry: null, // Don't wipe geometry, just update scale
            scaleFtPerUnit: newScale,
            validationError: null
        });

        // Reset
        setCalibrationPoints([]);
        setShowCalibrationDialog(false);
        setCalibrationLengthFt('');
        setMode('SELECT');
        alert(`Scale calibrated! 1 pixel = ${newScale.toFixed(4)} ft`);
    };

    const handleModelUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedComponentId) return;

        setUploadingModel(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });

            setComponents(prev => prev.map(c =>
                c.id === selectedComponentId ? {
                    ...c,
                    metadata: {
                        ...c.metadata,
                        notes: `model:${newBlob.url}`
                    }
                } : c
            ));
        } catch (error) {
            console.error('Model upload error:', error);
            alert('Failed to upload model');
        } finally {
            setUploadingModel(false);
            if (modelInputRef.current) modelInputRef.current.value = '';
        }
    }, [selectedComponentId]);

    // Handle blueprint analysis
    const [analyzing, setAnalyzing] = useState(false);

    const handleAnalyzeBlueprint = useCallback(async () => {
        if (!blueprintImage) {
            alert('Please upload a blueprint first');
            return;
        }

        console.log('🔍 Starting blueprint analysis...');
        console.log('Request Payload:', { imageLength: blueprintImage.length });

        try {
            const result = await analyzeBlueprintWithAI(blueprintImage);

            console.log('✅ Raw AI Response:', result);
            console.log('📊 Validation Result:', validateAnalysisResult(result) ? 'VALID' : 'INVALID');
            console.log('🧱 Walls detected:', result.walls.length);
            console.log('🚪 Doors detected:', result.doors.length);
            console.log('🪟 Windows detected:', result.windows.length);
            console.log('📏 Scale info:', result.scale);
            console.log('🎯 Confidence:', result.confidence);

            if (result.walls.length > 0) {
                console.log('Sample wall:', result.walls[0]);
            }

            alert(`Analysis complete! Found ${result.walls.length} walls. Check console for details.`);
        } catch (error) {
            console.error('❌ Analysis error:', error);
            setAnalyzing(false);
            alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [blueprintImage, pushHistory]);

    // Get world coordinates from stage event
    const getWorldPos = useCallback((e: any) => {
        const stage = e.target?.getStage();
        if (!stage) return { x: 0, y: 0 };
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return { x: 0, y: 0 };
        const transform = stage.getAbsoluteTransform().copy().invert();
        return transform.point(pointerPos);
    }, []);

    // Find vertex near point
    const findNearbyVertex = useCallback((p: { x: number; y: number }) => {
        return vertices.find(v => distance(v, p) < SNAP_DIST / scale);
    }, [vertices, scale]);

    // Create rectangle from dimensions
    const createRectangle = useCallback(() => {
        const width = parseFloat(quickWidth);
        const depth = parseFloat(quickDepth);

        if (isNaN(width) || isNaN(depth) || width <= 0 || depth <= 0) {
            alert('Please enter valid dimensions');
            return;
        }

        // Clear existing
        setVertices([]);
        setSegments([]);
        setOpenings([]);
        setElectricalEntries([]);
        setSystemRuns([]);

        // Create 4 vertices for rectangle (centered)
        const centerX = stageSize.width / 2;
        const centerY = stageSize.height / 2;
        const pixelsPerFoot = 10; // Default scale before calibration

        const w = width * pixelsPerFoot;
        const h = depth * pixelsPerFoot;

        const v1 = { id: newId('v'), x: centerX - w / 2, y: centerY - h / 2 };
        const v2 = { id: newId('v'), x: centerX + w / 2, y: centerY - h / 2 };
        const v3 = { id: newId('v'), x: centerX + w / 2, y: centerY + h / 2 };
        const v4 = { id: newId('v'), x: centerX - w / 2, y: centerY + h / 2 };

        const newVertices = [v1, v2, v3, v4];
        const newSegments = [
            { id: newId('s'), a: v1.id, b: v2.id, material: 'drywall' as const, thickness: 0.5 },
            { id: newId('s'), a: v2.id, b: v3.id, material: 'drywall' as const, thickness: 0.5 },
            { id: newId('s'), a: v3.id, b: v4.id, material: 'drywall' as const, thickness: 0.5 },
            { id: newId('s'), a: v4.id, b: v1.id, material: 'drywall' as const, thickness: 0.5 },
        ];

        setVertices(newVertices);
        setSegments(newSegments);
        setShowQuickDimension(false);

        // Auto-set scale
        setScaleFtPerUnit(1 / pixelsPerFoot);
    }, [quickWidth, quickDepth, stageSize]);

    // Handle mouse down
    const handleMouseDown = useCallback((e: any) => {
        // If panning (via spacebar or mode), don't do other actions
        if (isSpacePressed || mode === 'PAN') return;

        const pos = getWorldPos(e);
        // Disable snap if snap disabled globally OR if modifier held
        const shouldSnap = snapToGridEnabled && !isCtrlPressed;
        const snappedPos = shouldSnap ? snapToGrid(pos, GRID_SIZE) : pos;
        const nearbyVertex = findNearbyVertex(snappedPos);

        // Clear selections if clicking on empty space
        if (e.target === e.target.getStage()) {
            setSelectedVertexId(null);
            setSelectedSegmentId(null);
            setSelectedOpeningId(null);
            setSelectedEntryId(null);
            setSelectedRunId(null);
            setSelectedComponentId(null);
        }

        // Logic for specialized design tools
        if (mode === 'CALIBRATE') {
            handleCalibrationClick(pos);
            return;
        }

        if (mode === 'MEASURE') {
            if (measurementPoints.length === 0) {
                setMeasurementPoints([pos]);
                setMeasurementDistance(null);
            } else if (measurementPoints.length === 1) {
                const start = measurementPoints[0];
                const distPx = distance(start, pos);
                const distFt = distPx * (scaleFtPerUnit || 0.05);
                setMeasurementPoints([start, pos]);
                setMeasurementDistance(distFt);
            } else {
                setMeasurementPoints([pos]);
                setMeasurementDistance(null);
            }
            return;
        }

        if (mode === 'DRAW' || mode === 'EDIT' || mode === 'DOOR' || mode === 'WINDOW' || mode === 'POWER' || mode === 'ELECTRIC_RUN') {
            // Handle door/window placement
            if (mode === 'DOOR' || mode === 'WINDOW') {
                // Find segment near click
                const clickedSegment = segments.find(seg => {
                    const v1 = vertices.find(v => v.id === seg.a);
                    const v2 = vertices.find(v => v.id === seg.b);
                    if (!v1 || !v2) return false;
                    // Distance from point to line segment
                    const L2 = (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2;
                    if (L2 === 0) return false;
                    const t = ((pos.x - v1.x) * (v2.x - v1.x) + (pos.y - v1.y) * (v2.y - v1.y)) / L2;
                    const actualT = Math.max(0, Math.min(1, t));
                    const proj = { x: v1.x + actualT * (v2.x - v1.x), y: v1.y + actualT * (v2.y - v1.y) };
                    return distance(pos, proj) < 10; // 10px tolerance
                });

                if (clickedSegment) {
                    pushHistory();
                    const v1 = vertices.find(v => v.id === clickedSegment.a)!;
                    const v2 = vertices.find(v => v.id === clickedSegment.b)!;
                    const L2 = (v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2;
                    const t = ((pos.x - v1.x) * (v2.x - v1.x) + (pos.y - v1.y) * (v2.y - v1.y)) / L2;
                    const opId = newId('op');
                    const opening: BuildingOpening = {
                        id: opId,
                        segmentId: clickedSegment.id,
                        type: mode === 'DOOR' ? 'door' : 'window',
                        position: Math.max(0, Math.min(1, t)),
                        width: mode === 'DOOR' ? 3 : 4, // default widths in feet
                    };
                    setOpenings(prev => [...prev, opening]);
                    setSelectedOpeningId(opId); // Auto-select for feedback
                }
                return;
            }

            // Handle power entry placement
            if (mode === 'POWER') {
                pushHistory();
                const entryId = newId('ee');
                const entry: ElectricalEntry = {
                    id: entryId,
                    x: snappedPos.x,
                    y: snappedPos.y,
                    type: 'single-phase',
                    voltage: 120,
                    amps: 20
                };
                setElectricalEntries(prev => [...prev, entry]);
                setSelectedEntryId(entryId); // Auto-select for feedback
                // Don't switch to SELECT mode immediately to allow placing multiple entries
                return;
            }

            // Handle electrical run drawing
            if (mode === 'ELECTRIC_RUN') {
                // Check if clicking near a power entry to snap
                const nearbyEntry = electricalEntries.find(ee => distance(pos, ee) < SNAP_DIST / scale);
                const runPos = nearbyEntry ? { x: nearbyEntry.x, y: nearbyEntry.y } : snappedPos;

                if (e.evt.detail === 2) { // Double click to finish run
                    if (activeRunPoints.length > 0) {
                        pushHistory();
                        const newRun = {
                            id: newId('run'),
                            type: 'ELECTRICAL',
                            points: [...activeRunPoints, runPos], // Add final point on double click
                            status: 'planned'
                        };
                        setSystemRuns(prev => [...prev, newRun]);
                        setActiveRunPoints([]);
                        setMode('SELECT');
                    }
                    return;
                }

                if (activeRunPoints.length === 0) {
                    setActiveRunPoints([runPos]);
                } else {
                    const lastPoint = activeRunPoints[activeRunPoints.length - 1];
                    if (distance(runPos, lastPoint) > 5) { // Prevent adding points too close
                        setActiveRunPoints(prev => [...prev, runPos]);
                    }
                }
                return;
            }

            if (mode === 'DRAW') {
                if (nearbyVertex) {
                    if (lastWallVertexId) {
                        if (lastWallVertexId !== nearbyVertex.id) {
                            pushHistory();
                            const newSegment: BuildingWallSegment = {
                                id: newId('s'),
                                a: lastWallVertexId,
                                b: nearbyVertex.id,
                                material: wallMaterial,
                                thickness: parseFloat(wallThickness),
                            };
                            setSegments(prev => [...prev, newSegment]);
                            setLastWallVertexId(nearbyVertex.id);
                        }
                    } else {
                        // Start a chain from an existing vertex
                        setLastWallVertexId(nearbyVertex.id);
                    }
                } else {
                    pushHistory();
                    const shouldSnap = snapToGridEnabled && !isCtrlPressed;
                    const snappedPos = shouldSnap ? snapToGrid(pos, GRID_SIZE) : pos;
                    const newVertex: BuildingVertex = {
                        id: newId('v'),
                        x: snappedPos.x,
                        y: snappedPos.y,
                    };

                    setVertices(prev => {
                        const updated = [...prev, newVertex];
                        if (lastWallVertexId) {
                            const newSegment: BuildingWallSegment = {
                                id: newId('s'),
                                a: lastWallVertexId,
                                b: newVertex.id,
                                material: wallMaterial,
                                thickness: parseFloat(wallThickness),
                            };
                            setSegments(s => [...s, newSegment]);
                        }
                        return updated;
                    });
                    setLastWallVertexId(newVertex.id);
                }
            }

        } else if (mode === 'COMPONENT' && componentToPlace) {
            // Handle component placement
            pushHistory();
            const compId = newId('comp');
            const newComponent = createComponentFromTemplate(
                componentToPlace,
                snappedPos.x,
                snappedPos.y,
                componentRotation
            );
            // Ensure unique ID for this instance
            newComponent.id = compId;
            setComponents(prev => [...prev, newComponent]);
            setSelectedComponentId(compId); // Auto-select for feedback
            // Don't clear componentToPlace to allow multiple placements
        } else if (mode === 'SELECT' && e.target === e.target.getStage()) {
            // Only start marquee if clicking the stage background
            setDragStart(pos);
            setSelectionRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
        }
    }, [mode, getWorldPos, snapToGridEnabled, findNearbyVertex, vertices, wallMaterial, wallThickness, electricalEntries, activeRunPoints, pushHistory, scale, componentToPlace, componentRotation, components]);

    // Throttle ghost point updates using requestAnimationFrame
    const rafIdRef = useRef<number | null>(null);

    const handleMouseMove = useCallback((e: any) => {
        if (mode !== 'DRAW' && mode !== 'ELECTRIC_RUN' && mode !== 'COMPONENT' && mode !== 'CALIBRATE' && mode !== 'MEASURE' && !(mode === 'SELECT' && isDragging)) return;

        const pos = getWorldPos(e);

        if (mode === 'DRAW' || mode === 'ELECTRIC_RUN' || mode === 'COMPONENT' || mode === 'CALIBRATE' || mode === 'MEASURE') {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
            rafIdRef.current = requestAnimationFrame(() => {
                let finalPos = pos;

                // Apply advanced drawing modes
                if (mode === 'DRAW' && lastWallVertexId) {
                    const lastVertex = vertices.find(v => v.id === lastWallVertexId);

                    if (lastVertex) {
                        switch (advancedDrawMode) {
                            case 'orthogonal':
                                finalPos = calculateOrthogonalPoint(lastVertex, pos);
                                break;
                            case 'angle-lock':
                                finalPos = calculateAngleLockedPoint(lastVertex, pos, angleLock);
                                break;
                            case 'parallel':
                            case 'perpendicular':
                                if (referenceSegmentId) {
                                    const refSeg = segments.find(s => s.id === referenceSegmentId);
                                    if (refSeg) {
                                        const refStart = vertices.find(v => v.id === refSeg.a);
                                        const refEnd = vertices.find(v => v.id === refSeg.b);
                                        if (refStart && refEnd) {
                                            finalPos = advancedDrawMode === 'parallel'
                                                ? calculateParallelPoint(refStart, refEnd, lastVertex, pos)
                                                : calculatePerpendicularPoint(refStart, refEnd, lastVertex, pos);
                                        }
                                    }
                                }
                                break;
                        }
                    }
                }

                // Apply snapping
                const shouldSnap = snapToGridEnabled && !isCtrlPressed;
                const snappedPos = shouldSnap ? snapToGrid(finalPos, GRID_SIZE) : finalPos;
                setGhostPoint(snappedPos);
                rafIdRef.current = null;
            });
        } else if (mode === 'SELECT' && isDragging && dragStart) {
            setSelectionRect({
                x1: dragStart.x,
                y1: dragStart.y,
                x2: pos.x,
                y2: pos.y
            });
        }
    }, [mode, getWorldPos, snapToGridEnabled, isDragging, dragStart]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        if (mode === 'SELECT' && selectionRect && dragStart) {
            const x1 = Math.min(selectionRect.x1, selectionRect.x2);
            const x2 = Math.max(selectionRect.x1, selectionRect.x2);
            const y1 = Math.min(selectionRect.y1, selectionRect.y2);
            const y2 = Math.max(selectionRect.y1, selectionRect.y2);

            // Prioritize selection: Vertex > Entry > Component > Segment > Opening > Run
            let selectedId: string | null = null;
            let selectedType: 'vertex' | 'entry' | 'component' | 'segment' | 'opening' | 'run' | null = null;

            const foundVertex = vertices.find(v => v.x >= x1 && v.x <= x2 && v.y >= y1 && v.y <= y2);
            if (foundVertex) {
                selectedId = foundVertex.id;
                selectedType = 'vertex';
            } else {
                const foundEntry = electricalEntries.find(ee => ee.x >= x1 && ee.x <= x2 && ee.y >= y1 && ee.y <= y2);
                if (foundEntry) {
                    selectedId = foundEntry.id;
                    selectedType = 'entry';
                } else {
                    const foundComp = components.find(c => c.x >= x1 && c.x <= x2 && c.y >= y1 && c.y <= y2);
                    if (foundComp) {
                        selectedId = foundComp.id;
                        selectedType = 'component';
                    } else {
                        const foundSegment = segments.find(seg => {
                            const v1 = vertices.find(v => v.id === seg.a);
                            const v2 = vertices.find(v => v.id === seg.b);
                            if (!v1 || !v2) return false;
                            // Check if both endpoints are in the marquee for a wall to be "selected"
                            return (v1.x >= x1 && v1.x <= x2 && v1.y >= y1 && v1.y <= y2) ||
                                (v2.x >= x1 && v2.x <= x2 && v2.y >= y1 && v2.y <= y2);
                        });
                        if (foundSegment) {
                            selectedId = foundSegment.id;
                            selectedType = 'segment';
                        } else {
                            const foundOpening = openings.find(op => {
                                const seg = segments.find(s => s.id === op.segmentId);
                                if (!seg) return false;
                                const v1 = vertices.find(v => v.id === seg.a);
                                const v2 = vertices.find(v => v.id === seg.b);
                                if (!v1 || !v2) return false;

                                const dx = v2.x - v1.x;
                                const dy = v2.y - v1.y;
                                const centerX = v1.x + dx * op.position;
                                const centerY = v1.y + dy * op.position;

                                // Simple check: is the center of the opening within the marquee?
                                return centerX >= x1 && centerX <= x2 && centerY >= y1 && centerY <= y2;
                            });
                            if (foundOpening) {
                                selectedId = foundOpening.id;
                                selectedType = 'opening';
                            } else {
                                const foundRun = systemRuns.find(run => {
                                    // Check if any point of the run is within the marquee
                                    return run.points.some((p: { x: number, y: number }) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2);
                                });
                                if (foundRun) {
                                    selectedId = foundRun.id;
                                    selectedType = 'run';
                                }
                            }
                        }
                    }
                }
            }

            // Apply selection based on priority
            setSelectedVertexId(selectedType === 'vertex' ? selectedId : null);
            setSelectedEntryId(selectedType === 'entry' ? selectedId : null);
            setSelectedComponentId(selectedType === 'component' ? selectedId : null);
            setSelectedSegmentId(selectedType === 'segment' ? selectedId : null);
            setSelectedOpeningId(selectedType === 'opening' ? selectedId : null);
            setSelectedRunId(selectedType === 'run' ? selectedId : null);
        }

        setIsDragging(false);
        setDragStart(null);
        setSelectionRect(null);
    }, [mode, selectionRect, dragStart, vertices, electricalEntries, components, segments, openings, systemRuns]);

    // Handle wheel (zoom)
    const handleWheel = useCallback((e: any) => {
        e.evt?.preventDefault();

        const stage = e.target?.getStage();
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const scaleBy = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };

        setScale(clampedScale);
        setStagePos(newPos);
    }, []);

    // Undo/Redo system
    const handleUndo = useCallback(() => {
        if (history.length === 0) return;

        const current = {
            vertices: [...vertices],
            segments: [...segments],
            openings: [...openings],
            electricalEntries: [...electricalEntries],
            systemRuns: [...systemRuns],
            components: [...components]
        };
        const previous = history[history.length - 1];

        setRedoStack(prev => [...prev, current]);
        setHistory(prev => prev.slice(0, -1));

        setVertices(previous.vertices);
        setSegments(previous.segments);
        setOpenings(previous.openings || []);
        setElectricalEntries(previous.electricalEntries || []);
        setSystemRuns(previous.systemRuns || []);
        setComponents(previous.components || []);
    }, [history, vertices, segments, openings, electricalEntries, systemRuns, components]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;

        const current = {
            vertices: [...vertices],
            segments: [...segments],
            openings: [...openings],
            electricalEntries: [...electricalEntries],
            systemRuns: [...systemRuns],
            components: [...components]
        };
        const next = redoStack[redoStack.length - 1];

        setHistory(prev => [...prev, current]);
        setRedoStack(prev => prev.slice(0, -1));

        setVertices(next.vertices);
        setSegments(next.segments);
        setOpenings(next.openings || []);
        setElectricalEntries(next.electricalEntries || []);
        setSystemRuns(next.systemRuns || []);
        setComponents(next.components || []);
    }, [redoStack, vertices, segments, openings, electricalEntries, systemRuns, components]);

    // Clear all
    const handleClear = useCallback(() => {
        if (confirm('Clear all walls? This cannot be undone.')) {
            pushHistory();
            setVertices([]);
            setSegments([]);
            setOpenings([]);
            setElectricalEntries([]);
            setSystemRuns([]);
            setComponents([]);
            setSelectedVertexId(null);
            setSelectedSegmentId(null);
            setSelectedOpeningId(null);
            setSelectedEntryId(null);
            setSelectedRunId(null);
            setSelectedComponentId(null);
        }
    }, [pushHistory]);

    // Close loop
    const handleCloseLoop = useCallback(() => {
        if (vertices.length < 3) {
            alert('Need at least 3 vertices to close a loop');
            return;
        }

        const firstVertex = vertices[0];
        const lastVertex = vertices[vertices.length - 1];

        // Check if already connected
        const alreadyConnected = segments.some(
            s => (s.a === firstVertex.id && s.b === lastVertex.id) ||
                (s.a === lastVertex.id && s.b === firstVertex.id)
        );

        if (!alreadyConnected) {
            pushHistory();
            const newSegment: BuildingWallSegment = {
                id: newId('s'),
                a: lastVertex.id,
                b: firstVertex.id,
                material: wallMaterial,
                thickness: parseFloat(wallThickness),
            };
            setSegments(prev => [...prev, newSegment]);
        }
    }, [vertices, segments, wallMaterial, wallThickness, pushHistory]);

    // Calculate segment length in feet
    const getSegmentLengthFt = useCallback((seg: BuildingWallSegment) => {
        const v1 = vertices.find(v => v.id === seg.a);
        const v2 = vertices.find(v => v.id === seg.b);
        if (!v1 || !v2) return null;

        const pixelDist = distance(v1, v2);
        const ratio = scaleFtPerUnit || 0.05; // Fallback to 20px = 1ft if scale not set
        return (pixelDist * ratio).toFixed(1);
    }, [vertices, scaleFtPerUnit]);

    // EFFECTS - Grouped at the bottom of the logic section to allow function usage

    // Global keyboard listener for SketchUp-style input and shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.ctrlKey || e.metaKey;

            // Delete shortcut - works in DRAW/EDIT/SELECT if something is selected
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

                if (selectedVertexId) {
                    pushHistory();
                    setSegments(prev => prev.filter(s => s.a !== selectedVertexId && s.b !== selectedVertexId));
                    setVertices(prev => prev.filter(v => v.id !== selectedVertexId));
                    setOpenings(prev => prev.filter(op => {
                        const seg = segments.find(s => s.id === op.segmentId);
                        return seg && seg.a !== selectedVertexId && seg.b !== selectedVertexId;
                    }));
                    setSelectedVertexId(null);
                    return;
                }
                if (selectedSegmentId) {
                    pushHistory();
                    setSegments(prev => prev.filter(s => s.id !== selectedSegmentId));
                    setOpenings(prev => prev.filter(op => op.segmentId !== selectedSegmentId));
                    setSelectedSegmentId(null);
                    return;
                }
                if (selectedOpeningId) {
                    pushHistory();
                    setOpenings(prev => prev.filter(op => op.id !== selectedOpeningId));
                    setSelectedOpeningId(null);
                    return;
                }
                if (selectedEntryId) {
                    pushHistory();
                    setElectricalEntries(prev => prev.filter(ee => ee.id !== selectedEntryId));
                    setSelectedEntryId(null);
                    return;
                }
                if (selectedRunId) {
                    pushHistory();
                    setSystemRuns(prev => prev.filter(run => run.id !== selectedRunId));
                    setSelectedRunId(null);
                    return;
                }
                if (selectedComponentId) {
                    pushHistory();
                    setComponents(prev => prev.filter(c => c.id !== selectedComponentId));
                    setSelectedComponentId(null);
                    return;
                }
            }

            // Enter to finish electrical run
            if (e.key === 'Enter' && mode === 'ELECTRIC_RUN' && activeRunPoints.length > 1) {
                pushHistory();
                const newRun = {
                    id: newId('run'),
                    type: 'ELECTRICAL',
                    points: activeRunPoints,
                    status: 'planned'
                };
                setSystemRuns(prev => [...prev, newRun]);
                setActiveRunPoints([]);
                setMode('SELECT');
                return;
            }

            // Escape to cancel current run or deselect
            if (e.key === 'Escape') {
                if (mode === 'ELECTRIC_RUN' && activeRunPoints.length > 0) {
                    setActiveRunPoints([]);
                    return;
                }
                if (mode === 'DRAW') {
                    setLastWallVertexId(null);
                    return;
                }
                setSelectedVertexId(null);
                setSelectedSegmentId(null);
                setSelectedOpeningId(null);
                setSelectedEntryId(null);
                setSelectedRunId(null);
                setSketchupInput('');
                setShowSketchupInput(false);
                stageRef.current?.container()?.focus();
                return;
            }

            // Undo shortcut
            if (isMod && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
                return;
            }

            // 'R' key to rotate component
            if (e.key === 'r' || e.key === 'R') {
                if (mode === 'COMPONENT') {
                    setComponentRotation(prev => (prev + 90) % 360);
                    return;
                }
            }

            // Redo shortcut (Ctrl+Y)
            if (isMod && e.key === 'y') {
                e.preventDefault();
                handleRedo();
                return;
            }

            // Capture numbers for SketchUp input (in DRAW mode OR if a segment is selected)
            if ((mode === 'DRAW' && vertices.length > 0) || (selectedSegmentId)) {
                // If user is already in an input field
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                    if (e.key === 'Enter' && e.target === sketchupInputRef.current) {
                        e.preventDefault();
                        applySketchupMeasurement();
                    }
                    return;
                }

                if (/^[0-9.]$/.test(e.key)) {
                    setSketchupInput(prev => prev + e.key);
                    setShowSketchupInput(true);
                    setTimeout(() => sketchupInputRef.current?.focus(), 0);
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode, vertices, applySketchupMeasurement, handleUndo, handleRedo, selectedSegmentId, selectedVertexId, selectedOpeningId, selectedEntryId, selectedRunId, activeRunPoints, pushHistory]);

    // Update stage size on mount and resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setStageSize({ width, height });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Load initial geometry - check for changes to allow template switching
    useEffect(() => {
        if (initialGeometry) {
            const currentGeometry = { vertices, segments, openings, electricalEntries, systemRuns, components };
            const incomingGeometry = {
                vertices: initialGeometry.vertices || [],
                segments: initialGeometry.segments || [],
                openings: initialGeometry.openings || [],
                electricalEntries: initialGeometry.electricalEntries || [],
                systemRuns: initialGeometry.systemRuns || [],
                components: initialGeometry.components || []
            };

            // Deep comparison to check if geometry has actually changed
            if (JSON.stringify(currentGeometry) !== JSON.stringify(incomingGeometry)) {
                setVertices(incomingGeometry.vertices);
                setSegments(incomingGeometry.segments);
                setOpenings(incomingGeometry.openings);
                setElectricalEntries(incomingGeometry.electricalEntries);
                setSystemRuns(incomingGeometry.systemRuns);
                setComponents(incomingGeometry.components);
                if (initialGeometry.layerVisibility) {
                    setLayerVisibility(initialGeometry.layerVisibility);
                }
            }
        }
    }, [initialGeometry]);

    // Cleanup animation frame
    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    // Notify parent of changes
    useEffect(() => {
        const geometry: BuildingFloorGeometry | null = (vertices.length > 0 || openings.length > 0 || electricalEntries.length > 0 || systemRuns.length > 0 || components.length > 0) ? {
            vertices,
            segments,
            openings,
            electricalEntries,
            systemRuns,
            components,
            layerVisibility,
            version: 1,
        } : null;

        let validationError: string | null = null;
        if (geometry && !scaleFtPerUnit) {
            validationError = 'Please set the scale (ft per grid unit) before saving';
        }

        onChange({ geometry, scaleFtPerUnit, validationError });
    }, [vertices, segments, openings, electricalEntries, systemRuns, components, layerVisibility, scaleFtPerUnit, onChange]);

    const renderToolbar = () => {
        const toolButtonStyle = (active: boolean, color: string) => `
            p-2.5 rounded-lg font-bold text-[11px] transition-all border flex items-center gap-2 group relative
            ${active
                ? `${color} text-white shadow-lg`
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}
        `;

        const isHorizontal = dockPosition === 'top';
        const showLabels = !isCompact || isHorizontal;

        return (
            <DockableToolbar
                title="Architect"
                subtitle="Workspace v2.0"
                showDockControls={true}
                showSettings={true}
                onSettingsClick={() => setIsSettingsOpen(true)}
            >
                {/* Scale Setting Panel - Always Visible */}
                <div className={`mb-4 overflow-hidden rounded-xl border border-blue-500/30 bg-blue-600/10 backdrop-blur-md shadow-lg shadow-blue-500/10 ${isCompact ? 'p-1' : 'p-3'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                            <Target size={18} />
                        </div>
                        {!isCompact && (
                            <div>
                                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Calibration</h4>
                                <p className="text-[11px] font-medium text-slate-200">
                                    {scaleFtPerUnit ? `1px = ${scaleFtPerUnit.toFixed(3)}'` : 'Not Scaled'}
                                </p>
                            </div>
                        )}
                    </div>

                    {!isCompact && (
                        <button
                            onClick={() => {
                                setMode('CALIBRATE');
                                setCalibrationPoints([]);
                                setShowCalibrationDialog(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-600/20 group"
                        >
                            <Ruler size={14} className="group-hover:rotate-12 transition-transform" />
                            Calibrate
                        </button>
                    )}
                </div>

                {/* Main Tool Grid */}
                <div className={`flex ${isHorizontal ? 'flex-row items-center gap-2' : 'flex-col gap-4'}`}>

                    {/* Setup Tools */}
                    {(visibleTools.includes('blueprint') || visibleTools.includes('generate')) && (
                        <div className={`flex ${isHorizontal ? 'flex-row gap-2' : 'flex-col gap-2'}`}>
                            {visibleTools.includes('blueprint') && (
                                <button
                                    title="Import Blueprint"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={toolButtonStyle(uploadingPDF, 'bg-blue-600 border-blue-400')}
                                >
                                    <FileUp size={16} />
                                    <span className={isHorizontal ? 'hidden' : 'hidden md:inline'}>Import</span>
                                </button>
                            )}
                            {visibleTools.includes('generate') && (
                                <button
                                    title="Generate Layout"
                                    onClick={() => setShowQuickDimension(true)}
                                    className={toolButtonStyle(false, 'bg-emerald-600 border-emerald-400')}
                                >
                                    <Maximize size={16} />
                                    <span className={isHorizontal ? 'hidden' : 'hidden md:inline'}>Generate</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Designer Tools */}
                    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1`}>
                        {visibleTools.includes('wall') && (
                            <button title="Draw Wall" onClick={() => setMode('DRAW')} className={toolButtonStyle(mode === 'DRAW', 'bg-blue-600 border-blue-400')}>
                                <Ruler size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Wall</span>
                            </button>
                        )}
                        {visibleTools.includes('edit') && (
                            <button title="Edit" onClick={() => setMode('EDIT')} className={toolButtonStyle(mode === 'EDIT', 'bg-indigo-600 border-indigo-400')}>
                                <Target size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Edit</span>
                            </button>
                        )}
                        {visibleTools.includes('select') && (
                            <button title="Select" onClick={() => setMode('SELECT')} className={toolButtonStyle(mode === 'SELECT', 'bg-violet-600 border-violet-400')}>
                                <MousePointer2 size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Select</span>
                            </button>
                        )}
                        {visibleTools.includes('pan') && (
                            <button title="Pan" onClick={() => setMode('PAN')} className={toolButtonStyle(mode === 'PAN', 'bg-slate-600 border-slate-400')}>
                                <Move size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Pan</span>
                            </button>
                        )}
                        <button
                            title="Tape Measure (M)"
                            onClick={() => {
                                setMode('MEASURE');
                                setMeasurementPoints([]);
                                setMeasurementDistance(null);
                            }}
                            className={toolButtonStyle(mode === 'MEASURE', 'bg-teal-600 border-teal-400')}
                        >
                            <Ruler size={16} />
                            <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Measure</span>
                        </button>
                    </div>

                    {/* Openings */}
                    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1`}>
                        {visibleTools.includes('door') && (
                            <button title="Door" onClick={() => setMode('DOOR')} className={toolButtonStyle(mode === 'DOOR', 'bg-orange-600 border-orange-400')}>
                                <DoorOpen size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Door</span>
                            </button>
                        )}
                        {visibleTools.includes('window') && (
                            <button title="Window" onClick={() => setMode('WINDOW')} className={toolButtonStyle(mode === 'WINDOW', 'bg-sky-600 border-sky-400')}>
                                <Square size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Window</span>
                            </button>
                        )}
                    </div>

                    {/* Systems */}
                    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1`}>
                        {visibleTools.includes('power') && (
                            <button title="Power" onClick={() => setMode('POWER')} className={toolButtonStyle(mode === 'POWER', 'bg-amber-600 border-amber-400')}>
                                <Zap size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Power</span>
                            </button>
                        )}
                        {visibleTools.includes('run') && (
                            <button title="Run" onClick={() => { setMode('ELECTRIC_RUN'); setActiveRunPoints([]); }} className={toolButtonStyle(mode === 'ELECTRIC_RUN', 'bg-yellow-600 border-yellow-400')}>
                                <Cable size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Run</span>
                            </button>
                        )}
                        {visibleTools.includes('components') && (
                            <button title="Components" onClick={() => setShowComponentBrowser(!showComponentBrowser)} className={toolButtonStyle(showComponentBrowser, 'bg-green-600 border-green-400')}>
                                <Box size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Components</span>
                            </button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1`}>
                        {visibleTools.includes('close_loop') && (
                            <button title="Close Loop" onClick={handleCloseLoop} disabled={vertices.length < 3} className={toolButtonStyle(false, 'bg-purple-600 border-purple-400 disabled:opacity-30')}>
                                <Link size={16} />
                                <span className={showLabels ? 'hidden' : 'hidden md:inline'}>Close</span>
                            </button>
                        )}
                        <div className={`flex ${isHorizontal ? 'flex-row gap-1' : 'grid grid-cols-3 gap-1'}`}>
                            {visibleTools.includes('undo') && (
                                <button title="Undo" onClick={handleUndo} disabled={history.length === 0} className={toolButtonStyle(false, 'bg-slate-700 border-slate-600')}>
                                    <Undo2 size={14} />
                                </button>
                            )}
                            {visibleTools.includes('redo') && (
                                <button title="Redo" onClick={handleRedo} disabled={redoStack.length === 0} className={toolButtonStyle(false, 'bg-slate-700 border-slate-600')}>
                                    <Redo2 size={14} />
                                </button>
                            )}
                            {visibleTools.includes('measure') && (
                                <button
                                    title="Calibrate Scale (Measure Known Distance)"
                                    onClick={() => {
                                        setMode('CALIBRATE');
                                        // Reset calibration state
                                        setCalibrationPoints([]);
                                        setShowCalibrationDialog(false);
                                    }}
                                    className={toolButtonStyle(mode === 'CALIBRATE', 'bg-purple-900 border-purple-700')}
                                >
                                    <Ruler size={14} />
                                </button>
                            )}
                            {/* Advanced Drawing Tools Toggle */}
                            <button
                                title="Advanced Drawing Tools (Orthogonal, Angle Lock, etc.)"
                                onClick={() => setShowAdvancedTools(!showAdvancedTools)}
                                className={toolButtonStyle(showAdvancedTools, 'bg-indigo-600 border-indigo-400')}
                            >
                                <Grid3x3 size={14} />
                            </button>
                            {/* Dimension Input Toggle */}
                            <button
                                title="Dimension Input Box (Type exact measurements)"
                                onClick={() => setShowDimensionInputBox(!showDimensionInputBox)}
                                className={toolButtonStyle(showDimensionInputBox, 'bg-cyan-600 border-cyan-400')}
                            >
                                <Calculator size={14} />
                            </button>
                            {/* Room Detection */}
                            <button
                                title="Detect Rooms & Cleanup Walls"
                                onClick={() => {
                                    const rooms = detectRooms(vertices, segments, scaleFtPerUnit || 0.05);
                                    setDetectedRooms(rooms);
                                    setShowRoomLabels(true);

                                    // Show notification
                                    alert(`Detected ${rooms.length} room(s):\n${rooms.map(r => `- ${suggestRoomName(r)} (${Math.round(r.area)} sq ft)`).join('\n')}`);
                                }}
                                disabled={vertices.length < 3 || segments.length < 3}
                                className={toolButtonStyle(false, 'bg-teal-600 border-teal-400 disabled:opacity-30')}
                            >
                                <Home size={14} />
                            </button>
                            {visibleTools.includes('delete') && (
                                <button title="Clear All" onClick={handleClear} className={toolButtonStyle(false, 'bg-red-900 border-red-700')}>
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Workspace Settings (Footer) */}
                {!isHorizontal && (
                    <div className="mt-auto pt-4 border-t border-slate-700 md:block hidden">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-[10px] font-bold uppercase tracking-wider group"
                        >
                            <div className="flex items-center gap-2">
                                <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                                {showLabels && <span>Settings</span>}
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </button>
                    </div>
                )}
            </DockableToolbar>
        );
    };

    return (
        <div className="flex flex-col w-full h-full overflow-hidden bg-slate-950">
            {/* SketchUp-style Top Menu Bar */}
            <TopMenuBar
                activeToolbars={{
                    advanced: showAdvancedTools,
                    dimensions: showDimensionInputBox,
                    layers: showLayerPanel,
                    stats: true // always on for now
                }}
                onToggleToolbar={(key) => {
                    if (key === 'advanced') setShowAdvancedTools(!showAdvancedTools);
                    if (key === 'dimensions') setShowDimensionInputBox(!showDimensionInputBox);
                    if (key === 'layers') setShowLayerPanel(!showLayerPanel);
                }}
                onAction={(action) => {
                    if (action === 'save') {
                        // Implement save logic here
                        alert('Workspace saved to local database.');
                    } else if (action === 'clear') {
                        handleClear();
                    } else if (action === 'upload-pdf') {
                        fileInputRef.current?.click();
                    } else if (action === 'zoom-reset') {
                        setStagePos({ x: 0, y: 0 });
                        setScale(1);
                    } else if (action === 'measure') {
                        setMode('MEASURE');
                        setMeasurementPoints([]);
                        setMeasurementDistance(null);
                    } else if (action === 'calibrate') {
                        setMode('CALIBRATE');
                        setCalibrationPoints([]);
                        setShowCalibrationDialog(false);
                    } else if (action === 'detect-rooms') {
                        const rooms = detectRooms(vertices, segments, scaleFtPerUnit || 0.05);
                        setDetectedRooms(rooms);
                        setShowRoomLabels(true);
                        alert(`Found ${rooms.length} room(s).`);
                    }
                }}
            />

            <DockableWorkspace
                toolbar={renderToolbar()}
                canvas={(
                    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
                        {/* Overlay Panels */}
                        {showComponentBrowser && (
                            <div className="absolute top-4 right-8 z-20 w-80 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                                <div className="p-3 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Component Library</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowComponentBrowser(false)}
                                        className="text-slate-500 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Category Tabs */}
                                <div className="flex gap-1 p-2 border-b border-slate-700 overflow-x-auto">
                                    {(['furniture', 'cabinet', 'machinery', 'equipment', 'storage'] as ComponentCategory[]).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                // Scroll to category logic
                                            }}
                                            className="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors whitespace-nowrap capitalize"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Component List */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {Object.entries(COMPONENT_CATALOG).map(([category, templates]) => (
                                        <div key={category}>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 capitalize">{category}</h4>
                                            <div className="space-y-2">
                                                {templates.map((template, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setComponentToPlace(template);
                                                            setMode('COMPONENT');
                                                            setComponentRotation(0);
                                                        }}
                                                        className={`w-full p-3 rounded-lg border transition-all text-left ${componentToPlace?.name === template.name
                                                            ? 'bg-blue-900/50 border-blue-500 shadow-lg'
                                                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-900'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className="w-12 h-12 rounded flex-shrink-0"
                                                                style={{ backgroundColor: template.color || '#6b7280' }}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-sm text-white">{template.name}</div>
                                                                <div className="text-xs text-slate-400 mt-1">
                                                                    {template.width}' × {template.depth}'
                                                                    {template.height && ` × ${template.height}'`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Selection Tooltip */}
                                {componentToPlace && (
                                    <div className="p-3 border-t border-slate-700 bg-slate-900/50">
                                        <div className="text-xs text-blue-400 font-bold mb-1">Active: {componentToPlace.name}</div>
                                        <div className="text-[10px] text-slate-400">• Click to place • 'R' to rotate</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Advanced Wall Tools Panel */}
                        {showAdvancedTools && mode === 'DRAW' && (
                            <div className="absolute top-4 left-4 z-20 w-80 animate-in slide-in-from-left duration-200">
                                <AdvancedWallTools
                                    drawMode={advancedDrawMode}
                                    onDrawModeChange={setAdvancedDrawMode}
                                    wallProperties={wallProperties}
                                    onWallPropertiesChange={(props) => setWallProperties(prev => ({ ...prev, ...props }))}
                                    angleLock={angleLock}
                                    onAngleLockChange={setAngleLock}
                                    offsetDistance={offsetDistance}
                                    onOffsetDistanceChange={setOffsetDistance}
                                />
                            </div>
                        )}

                        {/* Dimension Input Box - Moved to top-right to avoid overlap */}
                        {showDimensionInputBox && mode === 'DRAW' && (
                            <div className="absolute top-20 right-4 z-20 animate-in slide-in-from-right duration-200">
                                <DimensionInputBox
                                    mode={dimensionInputMode}
                                    onModeChange={setDimensionInputMode}
                                    onSubmit={(input) => {
                                        const lastVertex = lastWallVertexId
                                            ? vertices.find(v => v.id === lastWallVertexId)
                                            : null;

                                        if (lastVertex) {
                                            const coords = dimensionToCoordinates(
                                                input,
                                                lastVertex,
                                                ghostPoint ? Math.atan2(ghostPoint.y - lastVertex.y, ghostPoint.x - lastVertex.x) : 0
                                            );

                                            if (coords) {
                                                // Create new vertex and segment
                                                const newVertex: BuildingVertex = {
                                                    id: newId('v'),
                                                    x: coords.x,
                                                    y: coords.y
                                                };

                                                const newSegment: BuildingWallSegment = {
                                                    id: newId('seg'),
                                                    a: lastWallVertexId!,
                                                    b: newVertex.id,
                                                    material: wallProperties.material,
                                                    thickness: wallProperties.thickness
                                                };

                                                pushHistory();
                                                setVertices(prev => [...prev, newVertex]);
                                                setSegments(prev => [...prev, newSegment]);
                                                setLastWallVertexId(newVertex.id);
                                            }
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Quick Dimension Presets - Moved to left-center to avoid overlap */}
                        {mode === 'DRAW' && lastWallVertexId && (
                            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
                                <QuickDimensionPresets
                                    onSelect={(length) => {
                                        const lastVertex = vertices.find(v => v.id === lastWallVertexId);
                                        if (lastVertex && ghostPoint) {
                                            const angle = Math.atan2(ghostPoint.y - lastVertex.y, ghostPoint.x - lastVertex.x);
                                            const coords = {
                                                x: lastVertex.x + length * Math.cos(angle),
                                                y: lastVertex.y + length * Math.sin(angle)
                                            };

                                            const newVertex: BuildingVertex = {
                                                id: newId('v'),
                                                x: coords.x,
                                                y: coords.y
                                            };

                                            const newSegment: BuildingWallSegment = {
                                                id: newId('seg'),
                                                a: lastWallVertexId!,
                                                b: newVertex.id,
                                                material: wallProperties.material,
                                                thickness: wallProperties.thickness
                                            };

                                            pushHistory();
                                            setVertices(prev => [...prev, newVertex]);
                                            setSegments(prev => [...prev, newSegment]);
                                            setLastWallVertexId(newVertex.id);
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {showLayerPanel && (
                            <div className="absolute top-4 right-4 z-10 w-48 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl p-3 animate-in slide-in-from-right duration-200">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Layers</h3>
                                <div className="space-y-2">
                                    {(Object.keys(layerVisibility) as Array<keyof LayerVisibility>).map(layer => (
                                        <label key={layer} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={layerVisibility[layer]}
                                                onChange={() => setLayerVisibility(v => ({ ...v, [layer]: !v[layer] }))}
                                                className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-blue-500"
                                            />
                                            <span className="text-xs text-slate-400 group-hover:text-white capitalize transition-colors">
                                                {layer.replace(/([A-Z])/g, ' $1')}
                                            </span>
                                        </label>
                                    ))}

                                    {/* Blueprint Controls */}
                                    {blueprintImage && (
                                        <div className="pt-2 mt-2 border-t border-slate-700">
                                            <label className="flex items-center gap-2 cursor-pointer group mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={showBlueprint}
                                                    onChange={() => setShowBlueprint(!showBlueprint)}
                                                    className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-blue-500"
                                                />
                                                <span className="text-xs text-slate-400 group-hover:text-white capitalize transition-colors">
                                                    Blueprint Overlay
                                                </span>
                                            </label>

                                            {showBlueprint && (
                                                <div className="pl-5 pr-1">
                                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                        <span>Opacity</span>
                                                        <span>{Math.round(blueprintOpacity * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0.1"
                                                        max="1"
                                                        step="0.05"
                                                        value={blueprintOpacity}
                                                        onChange={(e) => setBlueprintOpacity(parseFloat(e.target.value))}
                                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Stats Panel - Bottom right to avoid all overlaps */}
                        <div className="absolute bottom-20 right-4 z-10 flex flex-col gap-2">
                            <div className="bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-700 p-3 shadow-xl text-[10px] font-mono text-slate-400 font-medium">
                                <div>VERTICES: {vertices.length}</div>
                                <div>WALLS: {segments.length}</div>
                                <div>COMPONENTS: {components.length}</div>
                                <div className="mt-2 text-blue-400 uppercase tracking-tighter font-bold">MODE: {mode}</div>
                            </div>
                        </div>

                        {/* Calibration Dialog */}
                        {showCalibrationDialog && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl w-80">
                                <h3 className="text-lg font-bold text-white mb-4">Calibrate Scale</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Enter the actual distance in feet for the line you just drew ({Math.round(calibrationDistancePx)}px).
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={calibrationLengthFt}
                                        onChange={(e) => setCalibrationLengthFt(e.target.value)}
                                        placeholder="Distance (ft)"
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={applyCalibration}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold"
                                    >
                                        Set
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCalibrationDialog(false);
                                        setCalibrationPoints([]);
                                    }}
                                    className="mt-4 text-xs text-slate-500 hover:text-slate-300 w-full text-center"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Drawing Helper */}
                        {mode === 'DRAW' && vertices.length > 0 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-blue-600/90 backdrop-blur-md rounded-full border border-blue-400 shadow-2xl text-white text-xs font-bold animate-bounce">
                                ESC to Cancel • DOUBLE CLICK to finish
                            </div>
                        )}

                        {/* Stage Component */}
                        <Stage
                            ref={stageRef}
                            width={stageSize.width}
                            height={stageSize.height}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onWheel={handleWheel}
                            onDragEnd={(e) => {
                                if (e.target === e.target.getStage()) {
                                    setStagePos(e.target.position());
                                }
                            }}
                            draggable={mode === 'PAN' || isSpacePressed}
                            scaleX={scale}
                            scaleY={scale}
                            x={stagePos.x}
                            y={stagePos.y}
                            className="bg-slate-900 canvas-stage"
                            style={{
                                cursor: isSpacePressed || mode === 'PAN'
                                    ? 'grab'
                                    : (mode === 'DRAW' || mode === 'ELECTRIC_RUN' || mode === 'COMPONENT')
                                        ? 'crosshair'
                                        : 'default'
                            }}
                        >
                            {/* Blueprint Background Layer */}
                            {blueprintImage && showBlueprint && (
                                <Layer>
                                    <Group
                                        x={blueprintPosition.x}
                                        y={blueprintPosition.y}
                                        scaleX={blueprintScale}
                                        scaleY={blueprintScale}
                                        rotation={blueprintRotation}
                                        opacity={blueprintOpacity}
                                    >
                                        <BlueprintImage src={blueprintImage} />
                                    </Group>
                                </Layer>
                            )}

                            <Layer>

                                {/* Grid */}
                                {showGrid && (
                                    <>
                                        {Array.from({ length: Math.ceil(stageSize.width / GRID_SIZE) + 1 }).map((_, i) => (
                                            <Line
                                                key={`grid-v-${i}`}
                                                points={[i * GRID_SIZE, 0, i * GRID_SIZE, stageSize.height]}
                                                stroke="#334155"
                                                strokeWidth={0.5}
                                            />
                                        ))}
                                        {/* Calibration Line */}
                                        {mode === 'CALIBRATE' && calibrationPoints.length > 0 && (
                                            <>
                                                {calibrationPoints.map((p, i) => (
                                                    <Circle key={i} x={p.x} y={p.y} radius={5} fill="purple" />
                                                ))}
                                                {calibrationPoints.length === 2 && (
                                                    <Line
                                                        points={[calibrationPoints[0].x, calibrationPoints[0].y, calibrationPoints[1].x, calibrationPoints[1].y]}
                                                        stroke="purple"
                                                        strokeWidth={2}
                                                        dash={[10, 5]}
                                                    />
                                                )}
                                            </>
                                        )}
                                        {Array.from({ length: Math.ceil(stageSize.height / GRID_SIZE) + 1 }).map((_, i) => (
                                            <Line
                                                key={`grid-h-${i}`}
                                                points={[0, i * GRID_SIZE, stageSize.width, i * GRID_SIZE]}
                                                stroke="#334155"
                                                strokeWidth={0.5}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* Segments (walls) - with thickness visualization */}
                                {layerVisibility.walls && segments.map(seg => {
                                    const v1 = vertices.find(v => v.id === seg.a);
                                    const v2 = vertices.find(v => v.id === seg.b);
                                    if (!v1 || !v2) return null;

                                    const isSelected = seg.id === selectedSegmentId;
                                    const lengthFt = getSegmentLengthFt(seg);

                                    // Calculate wall thickness in pixels (default 6" = 0.5ft)
                                    const thicknessFt = seg.thickness || 0.5;
                                    const thicknessPx = scaleFtPerUnit ? (thicknessFt / scaleFtPerUnit) : 6;

                                    return (
                                        <React.Fragment key={seg.id}>
                                            {/* Main wall line - ALWAYS VISIBLE */}
                                            <Line
                                                points={[v1.x, v1.y, v2.x, v2.y]}
                                                stroke={isSelected ? '#60a5fa' : '#f1f5f9'}
                                                strokeWidth={Math.max(thicknessPx, 6)}
                                                lineCap="round"
                                                lineJoin="round"
                                                onClick={(e) => {
                                                    e.cancelBubble = true;
                                                    setSelectedSegmentId(seg.id);
                                                    setSelectedVertexId(null);
                                                    setSelectedOpeningId(null);
                                                    setSelectedEntryId(null);
                                                    setSelectedRunId(null);
                                                    setSelectedComponentId(null);
                                                }}
                                                onDragStart={(e) => {
                                                    e.cancelBubble = true;
                                                    pushHistory();
                                                    setSelectedSegmentId(seg.id);
                                                }}
                                                onDragMove={(e) => {
                                                    if (mode !== 'EDIT') return;
                                                    // Move both vertices of the segment
                                                    const dx = e.target.x();
                                                    const dy = e.target.y();
                                                    // Reset shape position so it doesn't drift
                                                    e.target.x(0);
                                                    e.target.y(0);

                                                    setVertices(prev => prev.map(v => {
                                                        if (v.id === seg.a || v.id === seg.b) {
                                                            return { ...v, x: v.x + dx, y: v.y + dy };
                                                        }
                                                        return v;
                                                    }));
                                                }}
                                                onDragEnd={(e) => {
                                                    if (snapToGridEnabled) {
                                                        setVertices(prev => prev.map(vert => {
                                                            if (vert.id === seg.a || vert.id === seg.b) {
                                                                const snapped = snapToGrid(vert, GRID_SIZE);
                                                                return { ...vert, ...snapped };
                                                            }
                                                            return vert;
                                                        }));
                                                    }
                                                }}
                                                hitStrokeWidth={20}
                                                listening={true}
                                                perfectDrawEnabled={false}
                                            />
                                            {/* Length label */}
                                            {lengthFt && (
                                                <React.Fragment>
                                                    <Rect
                                                        x={(v1.x + v2.x) / 2 - 20}
                                                        y={(v1.y + v2.y) / 2 - 18}
                                                        width={40}
                                                        height={16}
                                                        fill="#1e293b"
                                                        opacity={0.6}
                                                        cornerRadius={2}
                                                        listening={false}
                                                    />
                                                    <Text
                                                        x={(v1.x + v2.x) / 2 - 20}
                                                        y={(v1.y + v2.y) / 2 - 15}
                                                        width={40}
                                                        text={`${lengthFt}'`}
                                                        fontSize={12}
                                                        fill={isSelected ? '#60a5fa' : '#f1f5f9'}
                                                        fontStyle="bold"
                                                        align="center"
                                                        listening={false}
                                                    />
                                                </React.Fragment>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {/* Rooms Visualization */}
                                {showRoomLabels && detectedRooms.map((room, idx) => {
                                    const points = room.vertices.flatMap((v: any) => [v.x, v.y]);
                                    return (
                                        <Group key={`room-${idx}`}>
                                            <Line
                                                points={points}
                                                fill="rgba(56, 189, 248, 0.1)"
                                                closed={true}
                                                stroke="rgba(56, 189, 248, 0.3)"
                                                strokeWidth={1}
                                                listening={false}
                                            />
                                            <Group x={room.center.x} y={room.center.y}>
                                                <Rect
                                                    x={-50}
                                                    y={-20}
                                                    width={100}
                                                    height={40}
                                                    fill="rgba(15, 23, 42, 0.8)"
                                                    cornerRadius={4}
                                                    stroke="rgba(56, 189, 248, 0.5)"
                                                    strokeWidth={1}
                                                />
                                                <Text
                                                    x={-50}
                                                    y={-15}
                                                    width={100}
                                                    text={suggestRoomName(room)}
                                                    fill="#38bdf8"
                                                    fontSize={12}
                                                    fontStyle="bold"
                                                    align="center"
                                                />
                                                <Text
                                                    x={-50}
                                                    y={2}
                                                    width={100}
                                                    text={`${Math.round(room.area)} sq ft`}
                                                    fill="#94a3b8"
                                                    fontSize={10}
                                                    align="center"
                                                />
                                            </Group>
                                        </Group>
                                    );
                                })}

                                {/* Openings (Doors/Windows) */}
                                {layerVisibility.openings && openings.map(op => {
                                    const seg = segments.find(s => s.id === op.segmentId);
                                    if (!seg) return null;
                                    const v1 = vertices.find(v => v.id === seg.a);
                                    const v2 = vertices.find(v => v.id === seg.b);
                                    if (!v1 || !v2) return null;

                                    const dx = v2.x - v1.x;
                                    const dy = v2.y - v1.y;
                                    const angle = Math.atan2(dy, dx);
                                    const isSelected = op.id === selectedOpeningId;

                                    const ratio = scaleFtPerUnit || 0.05;
                                    const widthPx = op.width / ratio;

                                    const centerX = v1.x + dx * op.position;
                                    const centerY = v1.y + dy * op.position;

                                    const startX = centerX - (widthPx / 2) * Math.cos(angle);
                                    const startY = centerY - (widthPx / 2) * Math.sin(angle);
                                    const endX = centerX + (widthPx / 2) * Math.cos(angle);
                                    const endY = centerY + (widthPx / 2) * Math.sin(angle);

                                    return (
                                        <Group
                                            key={op.id}
                                            onClick={(e) => {
                                                e.cancelBubble = true;
                                                setSelectedOpeningId(op.id);
                                                setSelectedSegmentId(null);
                                                setSelectedVertexId(null);
                                                setSelectedEntryId(null);
                                                setSelectedRunId(null);
                                                setSelectedComponentId(null);
                                            }}
                                        >
                                            {/* Opening Gap background (to clear wall lines visually, though we draw over) */}
                                            <Line
                                                points={[startX, startY, endX, endY]}
                                                stroke="#1e293b"
                                                strokeWidth={Math.max((seg.thickness || 0.5) / ratio + 2, 8)}
                                            />

                                            {op.type === 'door' ? (
                                                <>
                                                    {/* Door Swing */}
                                                    <Arc
                                                        x={startX}
                                                        y={startY}
                                                        innerRadius={0}
                                                        outerRadius={widthPx}
                                                        angle={90}
                                                        rotation={angle * 180 / Math.PI - 90}
                                                        stroke="#fb923c"
                                                        strokeWidth={2}
                                                        dash={[5, 5]}
                                                    />
                                                    {/* Door Panel */}
                                                    <Line
                                                        points={[startX, startY, startX + widthPx * Math.cos(angle - Math.PI / 2), startY + widthPx * Math.sin(angle - Math.PI / 2)]}
                                                        stroke={isSelected ? '#f97316' : '#fb923c'}
                                                        strokeWidth={3}
                                                    />
                                                </>
                                            ) : (
                                                /* Window */
                                                <Rect
                                                    x={startX}
                                                    y={startY}
                                                    width={widthPx}
                                                    height={6}
                                                    rotation={angle * 180 / Math.PI}
                                                    fill={isSelected ? '#0ea5e9' : '#7dd3fc'}
                                                    stroke="#38bdf8"
                                                    strokeWidth={1}
                                                    offsetY={3}
                                                />
                                            )}
                                        </Group>
                                    );
                                })}

                                {/* Electrical Entries */}
                                {layerVisibility.electrical && electricalEntries.map(ee => {
                                    const isSelected = ee.id === selectedEntryId;
                                    return (
                                        <Group
                                            key={ee.id}
                                            x={ee.x}
                                            y={ee.y}
                                            onClick={(e) => {
                                                e.cancelBubble = true;
                                                setSelectedEntryId(ee.id);
                                                setSelectedOpeningId(null);
                                                setSelectedSegmentId(null);
                                                setSelectedVertexId(null);
                                                setSelectedRunId(null);
                                                setSelectedComponentId(null);
                                            }}
                                        >
                                            <Circle
                                                radius={12}
                                                fill={isSelected ? '#eab308' : '#854d0e'}
                                                stroke="#facc15"
                                                strokeWidth={2}
                                            />
                                            <Text
                                                text="⚡"
                                                fontSize={14}
                                                x={-7}
                                                y={-7}
                                            />
                                            <Text
                                                text={ee.type === 'three-phase' ? '3Ø' : '1Ø'}
                                                fontSize={8}
                                                fill="#fff"
                                                y={14}
                                                x={-10}
                                                fontStyle="bold"
                                            />
                                        </Group>
                                    );
                                })}

                                {/* System Runs (Electrical Runs) */}
                                {layerVisibility.electrical && systemRuns.map(run => {
                                    const isSelected = run.id === selectedRunId;
                                    const points = run.points.flatMap((p: any) => [p.x, p.y]);
                                    return (
                                        <Group
                                            key={run.id}
                                            onClick={(e) => {
                                                e.cancelBubble = true;
                                                setSelectedRunId(run.id);
                                                setSelectedEntryId(null);
                                                setSelectedOpeningId(null);
                                                setSelectedSegmentId(null);
                                                setSelectedVertexId(null);
                                                setSelectedComponentId(null);
                                            }}
                                        >
                                            {/* Glow effect */}
                                            <Line
                                                points={points}
                                                stroke={isSelected ? "#fbbf24" : "#f59e0b"}
                                                strokeWidth={isSelected ? 6 : 4}
                                                opacity={0.3}
                                                lineCap="round"
                                                lineJoin="round"
                                                shadowBlur={isSelected ? 10 : 0}
                                                shadowColor="#f59e0b"
                                                hitStrokeWidth={15}
                                            />
                                            {/* Core line */}
                                            <Line
                                                points={points}
                                                stroke={isSelected ? "#fbbf24" : "#f59e0b"}
                                                strokeWidth={isSelected ? 3 : 2}
                                                lineCap="round"
                                                lineJoin="round"
                                            />
                                        </Group>
                                    );
                                })}

                                {/* DRAW mode placement ghost & Crosshairs */}
                                {mode === 'DRAW' && ghostPoint && (
                                    <Group>
                                        {/* Full Screen Crosshairs */}
                                        <Line
                                            points={[-50000, ghostPoint.y, 50000, ghostPoint.y]}
                                            stroke="#ef4444" // red color for visibility
                                            strokeWidth={1}
                                            dash={[4, 4]}
                                            opacity={0.8}
                                            listening={false}
                                        />
                                        <Line
                                            points={[ghostPoint.x, -50000, ghostPoint.x, 50000]}
                                            stroke="#ef4444"
                                            strokeWidth={1}
                                            dash={[4, 4]}
                                            opacity={0.8}
                                            listening={false}
                                        />

                                        <Circle
                                            x={ghostPoint.x}
                                            y={ghostPoint.y}
                                            radius={4}
                                            fill="#60a5fa"
                                            opacity={0.6}
                                        />
                                        {lastWallVertexId && (() => {
                                            const lastV = vertices.find(v => v.id === lastWallVertexId);
                                            if (!lastV) return null;
                                            return (
                                                <Line
                                                    points={[lastV.x, lastV.y, ghostPoint.x, ghostPoint.y]}
                                                    stroke="#60a5fa"
                                                    strokeWidth={2}
                                                    dash={[5, 5]}
                                                    opacity={0.5}
                                                />
                                            );
                                        })()}
                                    </Group>
                                )}

                                {/* Components (Furniture, Machinery, etc.) */}
                                {layerVisibility.components && components.map(comp => {
                                    const isSelected = comp.id === selectedComponentId;
                                    const widthPx = scaleFtPerUnit ? (comp.width / scaleFtPerUnit) : comp.width * 10;
                                    const depthPx = scaleFtPerUnit ? (comp.depth / scaleFtPerUnit) : comp.depth * 10;

                                    return (
                                        <Group
                                            key={comp.id}
                                            x={comp.x}
                                            y={comp.y}
                                            rotation={comp.rotation}
                                            onClick={(e) => {
                                                e.cancelBubble = true;
                                                setSelectedComponentId(comp.id);
                                                setSelectedVertexId(null);
                                                setSelectedSegmentId(null);
                                                setSelectedOpeningId(null);
                                                setSelectedEntryId(null);
                                                setSelectedRunId(null);
                                            }}
                                            draggable={mode === 'EDIT'}
                                            onDragEnd={(e) => {
                                                const newPos = snapToGridEnabled ? snapToGrid({ x: e.target.x(), y: e.target.y() }, GRID_SIZE) : { x: e.target.x(), y: e.target.y() };
                                                setComponents(prev => prev.map(c =>
                                                    c.id === comp.id ? { ...c, x: newPos.x, y: newPos.y } : c
                                                ));
                                                e.target.x(newPos.x);
                                                e.target.y(newPos.y);
                                            }}
                                        >
                                            {/* Component body */}
                                            <Rect
                                                x={-widthPx / 2}
                                                y={-depthPx / 2}
                                                width={widthPx}
                                                height={depthPx}
                                                fill={comp.color || '#6b7280'}
                                                stroke={isSelected ? '#3b82f6' : '#374151'}
                                                strokeWidth={isSelected ? 3 : 1}
                                                cornerRadius={2}
                                                opacity={0.8}
                                            />
                                            {/* Component label */}
                                            <Text
                                                text={comp.name}
                                                fontSize={10}
                                                fill="#fff"
                                                fontStyle="bold"
                                                align="center"
                                                verticalAlign="middle"
                                                width={widthPx}
                                                x={-widthPx / 2}
                                                y={-5}
                                            />
                                            {/* Rotation indicator (small arrow) */}
                                            {comp.rotation !== 0 && (
                                                <Line
                                                    points={[0, -depthPx / 2 - 5, 0, -depthPx / 2 - 15]}
                                                    stroke="#60a5fa"
                                                    strokeWidth={2}
                                                    lineCap="round"
                                                />
                                            )}
                                            {/* Power requirement indicator */}
                                            {comp.metadata?.powerRequirement && (
                                                <Circle
                                                    x={widthPx / 2 - 8}
                                                    y={-depthPx / 2 + 8}
                                                    radius={6}
                                                    fill="#eab308"
                                                    stroke="#fff"
                                                    strokeWidth={1}
                                                />
                                            )}
                                        </Group>
                                    );
                                })}

                                {/* Component Placement Ghost */}
                                {mode === 'COMPONENT' && componentToPlace && ghostPoint && (() => {
                                    const widthPx = scaleFtPerUnit ? (componentToPlace.width / scaleFtPerUnit) : componentToPlace.width * 10;
                                    const depthPx = scaleFtPerUnit ? (componentToPlace.depth / scaleFtPerUnit) : componentToPlace.depth * 10;

                                    return (
                                        <Group
                                            x={ghostPoint.x}
                                            y={ghostPoint.y}
                                            rotation={componentRotation}
                                        >
                                            <Rect
                                                x={-widthPx / 2}
                                                y={-depthPx / 2}
                                                width={widthPx}
                                                height={depthPx}
                                                fill={componentToPlace.color || '#6b7280'}
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dash={[5, 5]}
                                                cornerRadius={2}
                                                opacity={0.5}
                                            />
                                            <Text
                                                text={componentToPlace.name}
                                                fontSize={10}
                                                fill="#fff"
                                                fontStyle="bold"
                                                align="center"
                                                width={widthPx}
                                                x={-widthPx / 2}
                                                y={-5}
                                                opacity={0.7}
                                            />
                                        </Group>
                                    );
                                })()}

                                {/* Selection Marquee */}
                                {selectionRect && (
                                    <Rect
                                        x={Math.min(selectionRect.x1, selectionRect.x2)}
                                        y={Math.min(selectionRect.y1, selectionRect.y2)}
                                        width={Math.abs(selectionRect.x2 - selectionRect.x1)}
                                        height={Math.abs(selectionRect.y2 - selectionRect.y1)}
                                        fill="rgba(59, 130, 246, 0.2)"
                                        stroke="#3b82f6"
                                        strokeWidth={1}
                                        dash={[4, 4]}
                                    />
                                )}

                                {/* Active Run Drawing Preview */}
                                {mode === 'ELECTRIC_RUN' && activeRunPoints.length > 0 && (() => {
                                    const previewPoints = [...activeRunPoints.flatMap((p: any) => [p.x, p.y])];
                                    if (ghostPoint) {
                                        previewPoints.push(ghostPoint.x, ghostPoint.y);
                                    }
                                    return (
                                        <Line
                                            points={previewPoints}
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            dash={[5, 5]}
                                            lineCap="round"
                                            lineJoin="round"
                                        />
                                    );
                                })()}


                                {/* Vertices */}
                                {vertices.map(v => {
                                    const isSelected = v.id === selectedVertexId;
                                    return (
                                        <Circle
                                            key={v.id}
                                            x={v.x}
                                            y={v.y}
                                            radius={isSelected ? 8 : 6}
                                            fill={isSelected ? '#3b82f6' : '#10b981'}
                                            stroke="#fff"
                                            strokeWidth={2}
                                            onClick={(e) => {
                                                e.cancelBubble = true;
                                                setSelectedVertexId(v.id);
                                                setSelectedSegmentId(null);
                                            }}
                                            draggable={mode === 'EDIT'}
                                            onDragStart={() => {
                                                pushHistory();
                                                setSelectedVertexId(v.id);
                                                setSelectedSegmentId(null);
                                            }}
                                            onDragMove={(e) => {
                                                const newPos = { x: e.target.x(), y: e.target.y() };
                                                setVertices(prev =>
                                                    prev.map(vertex =>
                                                        vertex.id === v.id ? { ...vertex, ...newPos } : vertex
                                                    )
                                                );
                                            }}
                                            onDragEnd={(e) => {
                                                const newPos = { x: e.target.x(), y: e.target.y() };
                                                const snapped = snapToGridEnabled ? snapToGrid(newPos, GRID_SIZE) : newPos;
                                                setVertices(prev =>
                                                    prev.map(vertex =>
                                                        vertex.id === v.id ? { ...vertex, ...snapped } : vertex
                                                    )
                                                );
                                            }}
                                        />
                                    );
                                })}

                                {/* Ghost point - Preview line with dynamic measurement */}
                                {mode === 'DRAW' && ghostPoint && vertices.length > 0 && (() => {
                                    const lastVertex = vertices[vertices.length - 1];
                                    const dx = ghostPoint.x - lastVertex.x;
                                    const dy = ghostPoint.y - lastVertex.y;

                                    // Use typed measurement if available
                                    const typedLength = parseFloat(sketchupInput);
                                    const isUsingTyped = !isNaN(typedLength) && typedLength > 0;

                                    let lengthPx = Math.sqrt(dx * dx + dy * dy);
                                    let previewEnd = ghostPoint;

                                    if (isUsingTyped) {
                                        const pixelsPerFoot = scaleFtPerUnit ? (1 / scaleFtPerUnit) : 20;
                                        lengthPx = typedLength * pixelsPerFoot;
                                        const angle = Math.atan2(dy, dx);
                                        previewEnd = {
                                            x: lastVertex.x + lengthPx * Math.cos(angle),
                                            y: lastVertex.y + lengthPx * Math.sin(angle)
                                        };
                                    }

                                    const lengthFt = scaleFtPerUnit ? (lengthPx * scaleFtPerUnit).toFixed(1) : (lengthPx / 20).toFixed(1);
                                    const angleDeg = Math.round((Math.atan2(-dy, dx) * 180) / Math.PI);

                                    // Calculate wall thickness for preview (same as actual walls)
                                    const thicknessFt = 0.5;
                                    const thicknessPx = scaleFtPerUnit ? (thicknessFt / scaleFtPerUnit) : 6;

                                    return (
                                        <>
                                            {/* Thick preview line */}
                                            <Line
                                                points={[lastVertex.x, lastVertex.y, previewEnd.x, previewEnd.y]}
                                                stroke={isUsingTyped ? '#fbbf24' : '#94a3b8'}
                                                strokeWidth={Math.max(thicknessPx, 6)}
                                                opacity={isUsingTyped ? 0.9 : 0.6}
                                                dash={[8, 8]}
                                                lineCap="round"
                                                lineJoin="round"
                                                listening={false}
                                                perfectDrawEnabled={false}
                                            />
                                            {/* Preview endpoint circle */}
                                            <Circle
                                                x={previewEnd.x}
                                                y={previewEnd.y}
                                                radius={6}
                                                fill={isUsingTyped ? '#fbbf24' : '#94a3b8'}
                                                opacity={0.6}
                                                listening={false}
                                                perfectDrawEnabled={false}
                                            />
                                            {/* Dynamic measurement tooltip - simplified to prevent flashing */}
                                            {lengthFt && (
                                                <>
                                                    {/* Background rectangle for better visibility */}
                                                    <Rect
                                                        x={(lastVertex.x + previewEnd.x) / 2 - 50}
                                                        y={(lastVertex.y + previewEnd.y) / 2 - 35}
                                                        width={100}
                                                        height={24}
                                                        fill="#000000"
                                                        opacity={0.8}
                                                        cornerRadius={4}
                                                        listening={false}
                                                        perfectDrawEnabled={false}
                                                    />
                                                    <Text
                                                        x={(lastVertex.x + previewEnd.x) / 2 - 50}
                                                        y={(lastVertex.y + previewEnd.y) / 2 - 32}
                                                        width={100}
                                                        text={`${lengthFt}' @ ${angleDeg}°`}
                                                        fontSize={14}
                                                        fill={isUsingTyped ? '#fbbf24' : '#ffffff'}
                                                        fontStyle="bold"
                                                        align="center"
                                                        listening={false}
                                                        perfectDrawEnabled={false}
                                                    />
                                                </>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* Tape Measure Visualization */}
                                {mode === 'MEASURE' && measurementPoints.length > 0 && (
                                    <>
                                        {/* Start point */}
                                        <Circle
                                            x={measurementPoints[0].x}
                                            y={measurementPoints[0].y}
                                            radius={5}
                                            fill="#2dd4bf"
                                            stroke="#ffffff"
                                            strokeWidth={1}
                                        />

                                        {/* Line to ghost point (preview) or second point */}
                                        {(() => {
                                            const endPoint = measurementPoints.length === 2
                                                ? measurementPoints[1]
                                                : ghostPoint;

                                            if (endPoint) {
                                                const start = measurementPoints[0];
                                                const dx = endPoint.x - start.x;
                                                const dy = endPoint.y - start.y;
                                                const distPx = Math.sqrt(dx * dx + dy * dy);
                                                const distFt = distPx * (scaleFtPerUnit || 0.05);

                                                return (
                                                    <>
                                                        <Line
                                                            points={[start.x, start.y, endPoint.x, endPoint.y]}
                                                            stroke="#2dd4bf"
                                                            strokeWidth={2}
                                                            dash={[10, 5]}
                                                        />
                                                        {measurementPoints.length === 2 && (
                                                            <Circle
                                                                x={endPoint.x}
                                                                y={endPoint.y}
                                                                radius={5}
                                                                fill="#2dd4bf"
                                                                stroke="#ffffff"
                                                                strokeWidth={1}
                                                            />
                                                        )}
                                                        {/* Distance Label */}
                                                        <Group x={(start.x + endPoint.x) / 2} y={(start.y + endPoint.y) / 2 - 20}>
                                                            <Rect
                                                                x={-40}
                                                                y={-12}
                                                                width={80}
                                                                height={24}
                                                                fill="#111827"
                                                                stroke="#2dd4bf"
                                                                strokeWidth={1}
                                                                cornerRadius={4}
                                                                opacity={0.9}
                                                            />
                                                            <Text
                                                                x={-40}
                                                                y={-7}
                                                                width={80}
                                                                text={`${distFt.toFixed(2)}'`}
                                                                fill="#2dd4bf"
                                                                fontSize={14}
                                                                fontStyle="bold"
                                                                align="center"
                                                            />
                                                        </Group>
                                                    </>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </>
                                )}

                            </Layer>
                        </Stage>

                        {/* Quick Dimension Dialog */}
                        {
                            showQuickDimension && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full mx-4">
                                        <h3 className="text-xl font-bold text-white mb-4">Create Rectangle</h3>
                                        <p className="text-slate-400 text-sm mb-4">
                                            Enter the dimensions for your building floor plan
                                        </p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Width (feet)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={quickWidth}
                                                    onChange={(e) => setQuickWidth(e.target.value)}
                                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                                                    placeholder="40"
                                                    autoFocus
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Depth (feet)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={quickDepth}
                                                    onChange={(e) => setQuickDepth(e.target.value)}
                                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                                                    placeholder="60"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={createRectangle}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                            >
                                                Create
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowQuickDimension(false)}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* Scale Dialog */}
                        {
                            showScaleDialog && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full mx-4">
                                        <h3 className="text-xl font-bold text-white mb-4">Set Scale</h3>
                                        <p className="text-slate-400 text-sm mb-4">
                                            How many feet does one grid square represent?
                                        </p>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Feet per grid square
                                            </label>
                                            <input
                                                type="number"
                                                value={scaleInputFt}
                                                onChange={(e) => setScaleInputFt(e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                                                placeholder="1"
                                                step="0.1"
                                                autoFocus
                                            />
                                            <p className="text-xs text-slate-500 mt-2">
                                                Common values: 1 ft, 5 ft, or 10 ft per grid square
                                            </p>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const ftPerGrid = parseFloat(scaleInputFt);
                                                    if (!isNaN(ftPerGrid) && ftPerGrid > 0) {
                                                        setScaleFtPerUnit(ftPerGrid / GRID_SIZE);
                                                        setShowScaleDialog(false);
                                                    } else {
                                                        alert('Please enter a valid number');
                                                    }
                                                }}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                            >
                                                Apply
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowScaleDialog(false)}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* Dimension Input Dialog - for entering exact wall length */}
                        {
                            showDimensionInput && pendingWallStart && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full mx-4">
                                        <h3 className="text-xl font-bold text-white mb-4">Enter Wall Dimensions</h3>
                                        <p className="text-slate-400 text-sm mb-4">
                                            Specify the exact length and angle for this wall segment
                                        </p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Length (feet)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={wallLengthInput}
                                                    onChange={(e) => setWallLengthInput(e.target.value)}
                                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                                                    placeholder="10"
                                                    autoFocus
                                                    step="0.1"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Angle (degrees)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={wallAngleInput}
                                                    onChange={(e) => setWallAngleInput(e.target.value)}
                                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                                                    placeholder="0"
                                                    step="1"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">
                                                    0° = right, 90° = up, 180° = left, 270° = down
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const length = parseFloat(wallLengthInput);
                                                    const angle = parseFloat(wallAngleInput);

                                                    if (isNaN(length) || length <= 0) {
                                                        alert('Please enter a valid length');
                                                        return;
                                                    }

                                                    if (isNaN(angle)) {
                                                        alert('Please enter a valid angle');
                                                        return;
                                                    }

                                                    // Calculate end point based on length and angle
                                                    const angleRad = (angle * Math.PI) / 180;
                                                    const pixelsPerFoot = scaleFtPerUnit ? (1 / scaleFtPerUnit) : 10;
                                                    const lengthPx = length * pixelsPerFoot;

                                                    const endX = pendingWallStart.x + lengthPx * Math.cos(angleRad);
                                                    const endY = pendingWallStart.y - lengthPx * Math.sin(angleRad); // Negative because Y increases downward

                                                    const snappedEnd = snapToGridEnabled ? snapToGrid({ x: endX, y: endY }, GRID_SIZE) : { x: endX, y: endY };

                                                    // Create new vertex
                                                    const newVertex: BuildingVertex = {
                                                        id: newId('v'),
                                                        x: snappedEnd.x,
                                                        y: snappedEnd.y,
                                                    };

                                                    setVertices(prev => [...prev, newVertex]);

                                                    // Create segment
                                                    const newSegment: BuildingWallSegment = {
                                                        id: newId('s'),
                                                        a: pendingWallStart.id,
                                                        b: newVertex.id,
                                                        material: 'drywall',
                                                    };

                                                    setSegments(prev => [...prev, newSegment]);

                                                    // Reset
                                                    setShowDimensionInput(false);
                                                    setPendingWallStart(null);
                                                    setWallLengthInput('');
                                                    setWallAngleInput('0');
                                                }}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                            >
                                                Create Wall
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowDimensionInput(false);
                                                    setPendingWallStart(null);
                                                    setWallLengthInput('');
                                                    setWallAngleInput('0');
                                                }}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* SketchUp-style Measurement Box (Lower Right) - Always Visible like SketchUp */}
                        <div className="absolute bottom-6 right-6 z-30">
                            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-lg shadow-2xl flex items-center overflow-hidden h-12 min-w-[280px]">
                                {/* Length Input */}
                                <div className="flex items-center flex-1 border-r border-slate-700 px-3">
                                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest mr-2">Length</span>
                                    <input
                                        ref={sketchupInputRef}
                                        type="text"
                                        value={sketchupInput}
                                        onChange={(e) => setSketchupInput(e.target.value)}
                                        onFocus={() => setShowSketchupInput(true)}
                                        onBlur={() => setShowSketchupInput(false)}
                                        className="bg-transparent text-white font-mono text-xl outline-none w-24"
                                        placeholder="0.0"
                                    />
                                    <span className="text-slate-500 font-mono text-sm ml-1">ft</span>
                                </div>

                                {/* Dynamic Angle Readout (Current mouse direction) */}
                                <div className="flex items-center px-4 bg-slate-900/50 h-full">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mr-2">Angle</span>
                                    <span className="text-white font-mono text-xl">
                                        {(() => {
                                            if (!ghostPoint || vertices.length === 0) return '0';
                                            const lastVertex = vertices[vertices.length - 1];
                                            const dx = ghostPoint.x - lastVertex.x;
                                            const dy = ghostPoint.y - lastVertex.y;
                                            return Math.round((Math.atan2(-dy, dx) * 180) / Math.PI);
                                        })()}
                                    </span>
                                    <span className="text-slate-500 font-mono text-sm ml-0.5">°</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            />

            <WorkspaceSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}
