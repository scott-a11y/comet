'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Circle, Text, Rect, Arc, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import type { BuildingFloorGeometry, BuildingVertex, BuildingWallSegment, BuildingOpening, ElectricalEntry, Component, ComponentCategory, LayerVisibility } from '@/lib/types/building-geometry';
import { COMPONENT_CATALOG, createComponentFromTemplate, type ComponentTemplate } from '@/lib/wall-designer/component-catalog';
import { convertPDFToImage, validatePDFFile } from '@/lib/wall-designer/pdf-upload-handler';

interface Props {
    buildingWidth?: number;
    buildingDepth?: number;
    initialGeometry?: BuildingFloorGeometry | null;
    initialScaleFtPerUnit?: number | null;
    onChange: (payload: {
        geometry: BuildingFloorGeometry | null;
        scaleFtPerUnit: number | null;
        validationError: string | null;
    }) => void;
}

type Mode = 'DRAW' | 'EDIT' | 'SELECT' | 'PAN' | 'DOOR' | 'WINDOW' | 'POWER' | 'ELECTRIC_RUN' | 'COMPONENT';

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
    const [toolbarDock, setToolbarDock] = useState<'top-left' | 'top-center' | 'bottom-center' | 'left-bar'>('top-left');

    // Component library state
    const [components, setComponents] = useState<Component[]>([]);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [componentToPlace, setComponentToPlace] = useState<ComponentTemplate | null>(null);
    const [componentRotation, setComponentRotation] = useState(0);
    const [showComponentBrowser, setShowComponentBrowser] = useState(false);

    // Panel visibility state
    const [showScalePanel, setShowScalePanel] = useState(true);
    const [showLayerPanel, setShowLayerPanel] = useState(true);

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
    const [uploadingPDF, setUploadingPDF] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Export controls
    const [showExportMenuInEditor, setShowExportMenuInEditor] = useState(false);

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
        const pos = getWorldPos(e);
        const snappedPos = snapToGridEnabled ? snapToGrid(pos, GRID_SIZE) : pos;
        const nearbyVertex = findNearbyVertex(snappedPos);

        // Clear selections if clicking on empty space
        if (e.target === e.target.getStage()) {
            setSelectedVertexId(null);
            setSelectedSegmentId(null);
            setSelectedOpeningId(null);
            setSelectedEntryId(null);
            setSelectedRunId(null);
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
                    const opening: BuildingOpening = {
                        id: newId('op'),
                        segmentId: clickedSegment.id,
                        type: mode === 'DOOR' ? 'door' : 'window',
                        position: Math.max(0, Math.min(1, t)),
                        width: mode === 'DOOR' ? 3 : 4, // default widths in feet
                    };
                    setOpenings(prev => [...prev, opening]);
                }
                return;
            }

            // Handle power entry placement
            if (mode === 'POWER') {
                pushHistory();
                const entry: ElectricalEntry = {
                    id: newId('ee'),
                    x: snappedPos.x,
                    y: snappedPos.y,
                    type: 'single-phase',
                    voltage: 240,
                    amps: 200,
                };
                setElectricalEntries(prev => [...prev, entry]);
                setMode('SELECT'); // Return to select after placing
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
                    if (vertices.length > 0) {
                        const lastVertex = vertices[vertices.length - 1];
                        if (lastVertex.id !== nearbyVertex.id) {
                            pushHistory();
                            const newSegment: BuildingWallSegment = {
                                id: newId('s'),
                                a: lastVertex.id,
                                b: nearbyVertex.id,
                                material: wallMaterial,
                                thickness: parseFloat(wallThickness),
                            };
                            setSegments(prev => [...prev, newSegment]);
                        }
                    }
                } else {
                    pushHistory();
                    const newVertex: BuildingVertex = {
                        id: newId('v'),
                        x: snappedPos.x,
                        y: snappedPos.y,
                    };
                    setVertices(prev => {
                        const updated = [...prev, newVertex];
                        if (prev.length > 0) {
                            const lastVertex = prev[prev.length - 1];
                            const newSegment: BuildingWallSegment = {
                                id: newId('s'),
                                a: lastVertex.id,
                                b: newVertex.id,
                                material: wallMaterial,
                                thickness: parseFloat(wallThickness),
                            };
                            setSegments(s => [...s, newSegment]);
                        }
                        return updated;
                    });
                }
            }
        } else if (mode === 'COMPONENT' && componentToPlace) {
            // Handle component placement
            pushHistory();
            const newComponent = createComponentFromTemplate(
                componentToPlace,
                snappedPos.x,
                snappedPos.y,
                componentRotation
            );
            setComponents(prev => [...prev, newComponent]);
            // Don't clear componentToPlace to allow multiple placements
        } else if (mode === 'PAN') {
            setIsDragging(true);
            setDragStart(pos);
        } else if (mode === 'SELECT') {
            setIsDragging(true);
            setDragStart(pos);
            setSelectionRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
        }
    }, [mode, getWorldPos, snapToGridEnabled, findNearbyVertex, vertices, wallMaterial, wallThickness, electricalEntries, activeRunPoints, pushHistory, scale, componentToPlace, componentRotation, components]);

    // Throttle ghost point updates using requestAnimationFrame
    const rafIdRef = useRef<number | null>(null);

    const handleMouseMove = useCallback((e: any) => {
        if (mode !== 'DRAW' && !(mode === 'PAN' && isDragging) && mode !== 'ELECTRIC_RUN' && mode !== 'COMPONENT' && !(mode === 'SELECT' && isDragging)) return;

        const pos = getWorldPos(e);

        if (mode === 'DRAW' || mode === 'ELECTRIC_RUN' || mode === 'COMPONENT') {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
            rafIdRef.current = requestAnimationFrame(() => {
                const snappedPos = snapToGridEnabled ? snapToGrid(pos, GRID_SIZE) : pos;
                setGhostPoint(snappedPos);
                rafIdRef.current = null;
            });
        } else if (mode === 'PAN' && isDragging && dragStart) {
            const dx = pos.x - dragStart.x;
            const dy = pos.y - dragStart.y;
            setStagePos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
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

            // Simple box selection: find first vertex within rect
            const foundVertex = vertices.find(v => v.x >= x1 && v.x <= x2 && v.y >= y1 && v.y <= y2);
            if (foundVertex) {
                setSelectedVertexId(foundVertex.id);
                setSelectedSegmentId(null);
                setSelectedOpeningId(null);
                setSelectedEntryId(null);
                setSelectedRunId(null);
            } else {
                // Check electrical entries
                const foundEntry = electricalEntries.find(ee => ee.x >= x1 && ee.x <= x2 && ee.y >= y1 && ee.y <= y2);
                if (foundEntry) {
                    setSelectedEntryId(foundEntry.id);
                    setSelectedVertexId(null);
                    setSelectedSegmentId(null);
                    setSelectedOpeningId(null);
                    setSelectedRunId(null);
                }
            }
        }

        setIsDragging(false);
        setDragStart(null);
        setSelectionRect(null);
    }, [mode, selectionRect, dragStart, vertices, electricalEntries]);

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

    return (
        <div ref={containerRef} className="relative w-full h-full bg-slate-900 overflow-hidden">
            {/* Toolbar Docking Container */}
            <div className={`absolute z-20 transition-all duration-500 ease-in-out ${toolbarDock === 'top-left' ? 'top-4 left-4 w-auto' :
                toolbarDock === 'top-center' ? 'top-4 left-1/2 -translate-x-1/2 w-max max-w-[95vw]' :
                    toolbarDock === 'bottom-center' ? 'bottom-4 left-1/2 -translate-x-1/2 w-max max-w-[95vw]' :
                        'top-4 left-4 bottom-4 w-72'
                }`}>
                <div className={`bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700 p-4 shadow-2xl flex ${(toolbarDock === 'top-center' || toolbarDock === 'bottom-center') ? 'flex-row items-start gap-8' : 'flex-col gap-4'
                    }`}>
                    {/* Header with Dock Toggle */}
                    <div className={`flex items-center justify-between ${(toolbarDock === 'top-center' || toolbarDock === 'bottom-center') ? 'flex-col items-start gap-1 h-full' : 'mb-1'}`}>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Architect</span>
                            <span className="text-[8px] text-slate-500 font-medium">v1.2 // Wall Designer</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const positions: Array<typeof toolbarDock> = ['top-left', 'top-center', 'bottom-center', 'left-bar'];
                                const next = positions[(positions.indexOf(toolbarDock) + 1) % positions.length];
                                setToolbarDock(next);
                            }}
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-all transform hover:rotate-90"
                            title="Move Toolbar"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    </div>

                    {/* Tools Group */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Design Tools</label>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setMode('DRAW')}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all border ${mode === 'DRAW' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                ✏️ DRAW
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('EDIT')}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all border ${mode === 'EDIT' ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                🔧 EDIT
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('SELECT')}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all border ${mode === 'SELECT' ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                🖱️ SELECT
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('PAN')}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all border ${mode === 'PAN' ? 'bg-slate-600 border-slate-400 text-white shadow-[0_0_15px_rgba(71,85,105,0.4)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                ✋ PAN
                            </button>
                        </div>
                        <div className="flex gap-2 mt-1">
                            <button
                                type="button"
                                onClick={() => setMode('DOOR')}
                                className={`flex-1 py-1.5 rounded font-bold text-[10px] border transition-all ${mode === 'DOOR' ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_10px_rgba(234,88,12,0.3)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                🚪 DOOR
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('WINDOW')}
                                className={`flex-1 py-1.5 rounded font-bold text-[10px] border transition-all ${mode === 'WINDOW' ? 'bg-sky-600 border-sky-400 text-white shadow-[0_0_10px_rgba(2,132,199,0.3)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                🪟 WINDOW
                            </button>
                        </div>
                    </div>

                    {/* Systems Group */}
                    <div className={`flex flex-col gap-2 ${(toolbarDock === 'top-center' || toolbarDock === 'bottom-center') ? 'border-l border-slate-700 pl-8' : ''}`}>
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Systems</label>
                        <div className="flex gap-2 min-w-[140px]">
                            <button
                                type="button"
                                onClick={() => setMode('POWER')}
                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-[10px] border transition-all flex items-center justify-center gap-2 ${mode === 'POWER' ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                ⚡ POWER
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('ELECTRIC_RUN');
                                    setActiveRunPoints([]);
                                }}
                                className={`flex-1 py-2 px-3 rounded-lg font-bold text-[10px] border transition-all flex items-center justify-center gap-2 ${mode === 'ELECTRIC_RUN' ? 'bg-yellow-600 border-yellow-400 text-white shadow-[0_0_15px_rgba(202,138,4,0.4)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                                🔌 RUN
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowComponentBrowser(!showComponentBrowser)}
                            className={`w-full py-2 px-3 rounded-lg font-bold text-[10px] border transition-all flex items-center justify-center gap-2 ${showComponentBrowser ? 'bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                        >
                            📦 COMPONENTS
                        </button>
                    </div>

                    {/* Actions Group */}
                    <div className={`flex flex-col gap-2 ${(toolbarDock === 'top-center' || toolbarDock === 'bottom-center') ? 'border-l border-slate-700 pl-8' : ''}`}>
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Actions</label>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setShowQuickDimension(true)}
                                className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-50 text-[11px] font-bold rounded-lg transition-all border border-emerald-500/30 whitespace-nowrap"
                            >
                                📐 RECTANGLE
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseLoop}
                                disabled={vertices.length < 3}
                                className="px-3 py-1.5 bg-purple-700/80 hover:bg-purple-600 text-purple-50 text-[11px] font-bold rounded-lg transition-all border border-purple-500/30 disabled:opacity-30 whitespace-nowrap"
                            >
                                🔗 CLOSE LOOP
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPDF}
                                className="px-3 py-1.5 bg-blue-700/80 hover:bg-blue-600 text-blue-50 text-[11px] font-bold rounded-lg transition-all border border-blue-500/30 disabled:opacity-30 whitespace-nowrap"
                            >
                                {uploadingPDF ? '⏳ LOADING...' : '📄 UPLOAD PDF'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handlePDFUpload}
                                className="hidden"
                            />
                        </div>
                        {blueprintImage && (
                            <div className="flex flex-col gap-1 mt-2">
                                <label className="text-[8px] text-slate-500 uppercase font-bold">Blueprint Opacity</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={blueprintOpacity * 100}
                                    onChange={(e) => setBlueprintOpacity(parseInt(e.target.value) / 100)}
                                    className="w-full"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setBlueprintImage(null)}
                                        className="flex-1 px-2 py-1 text-xs bg-red-900/40 hover:bg-red-700 text-red-100 rounded transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={handleUndo} disabled={history.length === 0} className="flex-1 p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md disabled:opacity-20 transition-all font-bold">↩</button>
                            <button onClick={handleRedo} disabled={redoStack.length === 0} className="flex-1 p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md disabled:opacity-20 transition-all font-bold">↪</button>
                            <button onClick={handleClear} className="flex-1 p-1.5 bg-red-900/40 hover:bg-red-700 text-red-100 rounded-md transition-all font-bold">🗑</button>
                        </div>
                    </div>

                    {/* Defaults Group */}
                    <div className={`flex flex-col gap-2 ${(toolbarDock === 'top-center' || toolbarDock === 'bottom-center') ? 'border-l border-slate-700 pl-8' : 'border-t border-slate-700 pt-3'}`}>
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Settings</label>
                        <div className={`flex gap-4 ${(toolbarDock === 'top-center' || toolbarDock === 'bottom-center') ? 'flex-row items-center' : 'flex-col'}`}>
                            <div className="flex gap-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold">Wall Thickness</span>
                                    <input
                                        type="number"
                                        value={wallThickness}
                                        onChange={(e) => setWallThickness(e.target.value)}
                                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px] font-mono"
                                        step="0.1"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold">Type</span>
                                    <select
                                        value={wallMaterial}
                                        onChange={(e) => setWallMaterial(e.target.value as any)}
                                        className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                                    >
                                        <option value="drywall">Drywall</option>
                                        <option value="brick">Brick</option>
                                        <option value="concrete">Concrete</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20" />
                                    <span className="text-[9px] text-slate-400 group-hover:text-slate-200 transition-colors">GRID</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={snapToGridEnabled} onChange={e => setSnapToGridEnabled(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20" />
                                    <span className="text-[9px] text-slate-400 group-hover:text-slate-200 transition-colors">SNAP</span>
                                </label>
                            </div>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={showScalePanel} onChange={e => setShowScalePanel(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20" />
                                    <span className="text-[9px] text-slate-400 group-hover:text-slate-200 transition-colors">SCALE</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={showLayerPanel} onChange={e => setShowLayerPanel(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20" />
                                    <span className="text-[9px] text-slate-400 group-hover:text-slate-200 transition-colors">LAYERS</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scale indicator */}
            {showScalePanel && (
                <div className="absolute top-4 right-4 z-10 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 p-3 shadow-xl">
                    <div className="text-sm text-slate-300 mb-2">
                        <strong>Scale:</strong> {scaleFtPerUnit ? `${(1 / scaleFtPerUnit).toFixed(1)} px/ft` : 'Not set'}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowScaleDialog(true)}
                        className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                        Set Scale
                    </button>
                    <div className="mt-2 text-xs text-slate-400">
                        Zoom: {(scale * 100).toFixed(0)}%
                    </div>
                </div>
            )}

            {/* Component Browser */}
            {showComponentBrowser && (
                <div className="absolute top-4 right-80 z-20 w-80 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
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
                                    // Scroll to category or filter
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
                                                    {template.metadata?.powerRequirement && (
                                                        <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                                            <span>⚡</span>
                                                            {template.metadata.powerRequirement}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    {componentToPlace && (
                        <div className="p-3 border-t border-slate-700 bg-slate-900/50">
                            <div className="text-xs text-slate-400">
                                <div className="font-bold text-blue-400 mb-1">Selected: {componentToPlace.name}</div>
                                <div>• Click on canvas to place</div>
                                <div>• Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[10px]">R</kbd> to rotate</div>
                                <div>• Rotation: {componentRotation}°</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Layer Management Panel */}
            {showLayerPanel && (
                <div className="absolute top-32 right-4 z-10 w-64 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl">
                    <div className="p-3 border-b border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Layers</h3>
                    </div>
                    <div className="p-3 space-y-2">
                        {[
                            { key: 'walls' as keyof LayerVisibility, label: '🧱 Walls', color: 'text-slate-300' },
                            { key: 'openings' as keyof LayerVisibility, label: '🚪 Openings', color: 'text-orange-400' },
                            { key: 'electrical' as keyof LayerVisibility, label: '⚡ Electrical', color: 'text-yellow-400' },
                            { key: 'hvac' as keyof LayerVisibility, label: '🌡️ HVAC', color: 'text-blue-400' },
                            { key: 'plumbing' as keyof LayerVisibility, label: '💧 Plumbing', color: 'text-cyan-400' },
                            { key: 'dustCollection' as keyof LayerVisibility, label: '🌪️ Dust', color: 'text-purple-400' },
                            { key: 'compressedAir' as keyof LayerVisibility, label: '💨 Air', color: 'text-gray-400' },
                            { key: 'components' as keyof LayerVisibility, label: '📦 Components', color: 'text-green-400' },
                            { key: 'measurements' as keyof LayerVisibility, label: '📏 Measurements', color: 'text-pink-400' },
                        ].map(layer => (
                            <label key={layer.key} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={layerVisibility[layer.key]}
                                    onChange={(e) => setLayerVisibility(prev => ({ ...prev, [layer.key]: e.target.checked }))}
                                    className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
                                />
                                <span className={`text-xs ${layer.color} group-hover:text-white transition-colors`}>
                                    {layer.label}
                                </span>
                            </label>
                        ))}
                        <div className="pt-2 border-t border-slate-700 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setLayerVisibility({
                                    walls: true,
                                    openings: true,
                                    electrical: true,
                                    hvac: true,
                                    plumbing: true,
                                    dustCollection: true,
                                    compressedAir: true,
                                    components: true,
                                    measurements: true
                                })}
                                className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                            >
                                Show All
                            </button>
                            <button
                                type="button"
                                onClick={() => setLayerVisibility({
                                    walls: true,
                                    openings: false,
                                    electrical: false,
                                    hvac: false,
                                    plumbing: false,
                                    dustCollection: false,
                                    compressedAir: false,
                                    components: false,
                                    measurements: false
                                })}
                                className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                            >
                                Walls Only
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Konva Canvas - Main Drawing Surface */}
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                scaleX={scale}
                scaleY={scale}
                x={pan.x}
                y={pan.y}
                draggable={mode === 'PAN'}
                onWheel={(e) => {
                    e.evt.preventDefault();
                    const scaleBy = 1.05;
                    const stage = e.target.getStage();
                    if (!stage) return;

                    const oldScale = stage.scaleX();
                    const pointer = stage.getPointerPosition();
                    if (!pointer) return;

                    const mousePointTo = {
                        x: (pointer.x - stage.x()) / oldScale,
                        y: (pointer.y - stage.y()) / oldScale,
                    };

                    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
                    setScale(newScale);

                    const newPos = {
                        x: pointer.x - mousePointTo.x * newScale,
                        y: pointer.y - mousePointTo.y * newScale,
                    };
                    setPan(newPos);
                }}
                onDragEnd={(e) => {
                    setPan({ x: e.target.x(), y: e.target.y() });
                }}
            >
                {/* Blueprint Background Layer */}
                {blueprintImage && (
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

                {/* Main Drawing Layer - Walls, Components, etc. */}
                <Layer>
                    {/* TODO: Add wall rendering here */}
                    {/* TODO: Add component rendering here */}
                    {/* TODO: Add electrical runs rendering here */}
                </Layer>
            </Stage>

            {/* Stats */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 p-3 shadow-xl text-sm text-slate-300">
                    <div><strong>Vertices:</strong> {vertices.length}</div>
                    <div><strong>Walls:</strong> {segments.length}</div>
                    <div><strong>Openings:</strong> {openings.length}</div>
                    <div><strong>Power Entries:</strong> {electricalEntries.length}</div>
                    <div><strong>Components:</strong> {components.length}</div>
                    {mode === 'DRAW' && (
                        <div className="mt-2 text-xs text-slate-400">
                            Click to add vertices. Click near existing vertex to connect.
                        </div>
                    )}
                    {mode === 'ELECTRIC_RUN' && (
                        <div className="mt-2 text-xs text-slate-400">
                            Click to add points. Double-click or press Enter to finish run.
                        </div>
                    )}
                </div>

                {/* Selected Wall Properties */}
                {selectedSegmentId && (
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-blue-500/50 p-4 shadow-xl text-sm w-64 animate-in slide-in-from-left duration-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-blue-400 uppercase tracking-wider text-xs">Selected Wall</h4>
                            <button
                                type="button"
                                onClick={() => setSelectedSegmentId(null)}
                                className="text-slate-500 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Thickness (ft)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="2"
                                        step="0.05"
                                        value={segments.find(s => s.id === selectedSegmentId)?.thickness || 0.5}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setSegments(prev => prev.map(s =>
                                                s.id === selectedSegmentId ? { ...s, thickness: val } : s
                                            ));
                                        }}
                                        className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-3"
                                    />
                                    <input
                                        type="number"
                                        value={segments.find(s => s.id === selectedSegmentId)?.thickness || 0.5}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                                setSegments(prev => prev.map(s =>
                                                    s.id === selectedSegmentId ? { ...s, thickness: val } : s
                                                ));
                                            }
                                        }}
                                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Material</label>
                                <select
                                    value={segments.find(s => s.id === selectedSegmentId)?.material || 'drywall'}
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        setSegments(prev => prev.map(s =>
                                            s.id === selectedSegmentId ? { ...s, material: val } : s
                                        ));
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                                >
                                    <option value="drywall">Drywall (Int)</option>
                                    <option value="brick">Brick (Ext)</option>
                                    <option value="concrete">Concrete</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    pushHistory();
                                    setSegments(prev => prev.filter(s => s.id !== selectedSegmentId));
                                    setSelectedSegmentId(null);
                                }}
                                className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded border border-red-900/50 transition-colors"
                            >
                                Delete Wall
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected Opening Properties */}
                {selectedOpeningId && (
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-orange-500/50 p-4 shadow-xl text-sm w-64 animate-in slide-in-from-left duration-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-orange-400 uppercase tracking-wider text-xs">
                                Selected {openings.find(op => op.id === selectedOpeningId)?.type}
                            </h4>
                            <button
                                type="button"
                                onClick={() => setSelectedOpeningId(null)}
                                className="text-slate-500 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Width (ft)</label>
                                <input
                                    type="number"
                                    value={openings.find(op => op.id === selectedOpeningId)?.width || 3}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val)) {
                                            setOpenings(prev => prev.map(op =>
                                                op.id === selectedOpeningId ? { ...op, width: val } : op
                                            ));
                                        }
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    pushHistory();
                                    setOpenings(prev => prev.filter(op => op.id !== selectedOpeningId));
                                    setSelectedOpeningId(null);
                                }}
                                className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded border border-red-900/50 transition-colors"
                            >
                                Delete {openings.find(op => op.id === selectedOpeningId)?.type}
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected Electrical Entry Properties */}
                {selectedEntryId && (
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-yellow-500/50 p-4 shadow-xl text-sm w-64 animate-in slide-in-from-left duration-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-yellow-400 uppercase tracking-wider text-xs">Main Power</h4>
                            <button
                                type="button"
                                onClick={() => setSelectedEntryId(null)}
                                className="text-slate-500 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Phase</label>
                                <select
                                    value={electricalEntries.find(ee => ee.id === selectedEntryId)?.type || 'single-phase'}
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        setElectricalEntries(prev => prev.map(ee =>
                                            ee.id === selectedEntryId ? { ...ee, type: val } : ee
                                        ));
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                                >
                                    <option value="single-phase">Single Phase</option>
                                    <option value="three-phase">Three Phase</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Amperage (A)</label>
                                <input
                                    type="number"
                                    value={electricalEntries.find(ee => ee.id === selectedEntryId)?.amps || 200}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) {
                                            setElectricalEntries(prev => prev.map(ee =>
                                                ee.id === selectedEntryId ? { ...ee, amps: val } : ee
                                            ));
                                        }
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    pushHistory();
                                    setElectricalEntries(prev => prev.filter(ee => ee.id !== selectedEntryId));
                                    setSelectedEntryId(null);
                                }}
                                className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded border border-red-900/50 transition-colors"
                            >
                                Remove Power Entry
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected Electrical Run Properties */}
                {selectedRunId && (
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-blue-500/50 p-4 shadow-xl text-sm w-64 animate-in slide-in-from-left duration-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-blue-400 uppercase tracking-wider text-xs">Selected Run</h4>
                            <button
                                type="button"
                                onClick={() => setSelectedRunId(null)}
                                className="text-slate-500 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Type</label>
                                <select
                                    value={systemRuns.find(run => run.id === selectedRunId)?.type || 'ELECTRICAL'}
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        setSystemRuns(prev => prev.map(run =>
                                            run.id === selectedRunId ? { ...run, type: val } : run
                                        ));
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                                >
                                    <option value="ELECTRICAL">Electrical</option>
                                    <option value="HVAC">HVAC</option>
                                    <option value="PLUMBING">Plumbing</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Status</label>
                                <select
                                    value={systemRuns.find(run => run.id === selectedRunId)?.status || 'planned'}
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        setSystemRuns(prev => prev.map(run =>
                                            run.id === selectedRunId ? { ...run, status: val } : run
                                        ));
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                                >
                                    <option value="planned">Planned</option>
                                    <option value="installed">Installed</option>
                                    <option value="inspected">Inspected</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    pushHistory();
                                    setSystemRuns(prev => prev.filter(run => run.id !== selectedRunId));
                                    setSelectedRunId(null);
                                }}
                                className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded border border-red-900/50 transition-colors"
                            >
                                Delete Run
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Canvas */}
            <Stage
                ref={stageRef}
                width={stageSize.width || 800}
                height={stageSize.height || 600}
                scaleX={scale}
                scaleY={scale}
                x={stagePos.x}
                y={stagePos.y}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                className="cursor-crosshair w-full h-full"
            >
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
                    {segments.map(seg => {
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
                                    onClick={() => {
                                        setSelectedSegmentId(seg.id);
                                        setSelectedVertexId(null);
                                        setSelectedOpeningId(null);
                                        setSelectedEntryId(null);
                                        setSelectedRunId(null);
                                    }}
                                    onDragStart={() => {
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

                    {/* Openings (Doors/Windows) */}
                    {openings.map(op => {
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
                                onClick={() => {
                                    setSelectedOpeningId(op.id);
                                    setSelectedSegmentId(null);
                                    setSelectedVertexId(null);
                                    setSelectedEntryId(null);
                                    setSelectedRunId(null);
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
                    {electricalEntries.map(ee => {
                        const isSelected = ee.id === selectedEntryId;
                        return (
                            <Group
                                key={ee.id}
                                x={ee.x}
                                y={ee.y}
                                onClick={() => {
                                    setSelectedEntryId(ee.id);
                                    setSelectedOpeningId(null);
                                    setSelectedSegmentId(null);
                                    setSelectedVertexId(null);
                                    setSelectedRunId(null);
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
                    {systemRuns.map(run => {
                        const isSelected = run.id === selectedRunId;
                        const points = run.points.flatMap((p: any) => [p.x, p.y]);
                        return (
                            <Group
                                key={run.id}
                                onClick={() => {
                                    setSelectedRunId(run.id);
                                    setSelectedEntryId(null);
                                    setSelectedOpeningId(null);
                                    setSelectedSegmentId(null);
                                    setSelectedVertexId(null);
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
                                onClick={() => {
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
        </div >
    );
}
