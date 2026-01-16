'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImprovedWallEditor } from './_components/improved-wall-editor';
import { WallDesignerTutorial } from './_components/wall-designer-tutorial';
import { TemplateBrowser } from './_components/template-browser';
import { exportToDXF, exportToSVG, downloadFile, calculateStats } from '@/lib/wall-designer/export-utils';
import { exportToPDFDirect } from '@/lib/wall-designer/pdf-export';
import { KeyboardShortcutManager, DEFAULT_SHORTCUTS } from '@/lib/wall-designer/keyboard-shortcuts';
import type { BuildingFloorGeometry } from '@/lib/types/building-geometry';

export default function WallDesignerPage() {
    const params = useParams();
    const router = useRouter();
    const buildingId = params.id as string;

    const [building, setBuilding] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [floorGeometry, setFloorGeometry] = useState<BuildingFloorGeometry | null>(null);
    const [scaleFtPerUnit, setScaleFtPerUnit] = useState<number | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    // Load building data
    useEffect(() => {
        const fetchBuilding = async () => {
            try {
                const response = await fetch(`/api/buildings/${buildingId}`);
                if (!response.ok) throw new Error('Failed to load building');

                const data = await response.json();
                setBuilding(data.data);

                // Load existing geometry if available
                if (data.data.floorGeometry) {
                    setFloorGeometry(data.data.floorGeometry);
                }
                if (data.data.floorScaleFtPerUnit) {
                    setScaleFtPerUnit(data.data.floorScaleFtPerUnit);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load building');
            } finally {
                setLoading(false);
            }
        };

        fetchBuilding();
    }, [buildingId]);

    const handleSave = async () => {
        if (!floorGeometry || !scaleFtPerUnit) {
            setError('Please complete your floor plan and set the scale before saving');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/buildings/${buildingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    floorGeometry,
                    floorScaleFtPerUnit: scaleFtPerUnit,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save floor plan');
            }

            // Success - redirect back to building
            router.push(`/buildings/${buildingId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save floor plan');
        } finally {
            setSaving(false);
        }
    };

    const handleExportDXF = () => {
        if (!floorGeometry || !scaleFtPerUnit) {
            alert('Please create a floor plan first');
            return;
        }
        const dxf = exportToDXF(floorGeometry, scaleFtPerUnit, building?.name || 'Building');
        downloadFile(dxf, `${building?.name.replace(/\s+/g, '_')}_floor_plan.dxf`, 'application/dxf');
        setShowExportMenu(false);
    };

    const handleExportSVG = () => {
        if (!floorGeometry || !scaleFtPerUnit) {
            alert('Please create a floor plan first');
            return;
        }
        const svg = exportToSVG(floorGeometry, scaleFtPerUnit, building?.name || 'Building');
        downloadFile(svg, `${building?.name.replace(/\s+/g, '_')}_floor_plan.svg`, 'image/svg+xml');
        setShowExportMenu(false);
    };

    const handleShowStats = () => {
        if (!floorGeometry || !scaleFtPerUnit) {
            alert('Please create a floor plan first');
            return;
        }
        const stats = calculateStats(floorGeometry, scaleFtPerUnit);
        alert(`Floor Plan Statistics:\n\n` +
            `Vertices: ${stats.vertexCount}\n` +
            `Walls: ${stats.wallCount}\n` +
            `Total Wall Length: ${stats.totalWallLength} ft\n` +
            `Estimated Area: ${stats.estimatedArea} sq ft`);
        setShowExportMenu(false);
    };

    const handleExportPDF = async () => {
        if (!floorGeometry || !scaleFtPerUnit) {
            alert('Please create a floor plan first');
            return;
        }
        await exportToPDFDirect(
            floorGeometry,
            scaleFtPerUnit,
            building?.name || 'Building',
            { width: building?.widthFt || 0, depth: building?.depthFt || 0 }
        );
        setShowExportMenu(false);
    };

    const handleEditorChange = useCallback(({ geometry, scaleFtPerUnit: scale, validationError }: {
        geometry: BuildingFloorGeometry | null;
        scaleFtPerUnit: number | null;
        validationError: string | null;
    }) => {
        setFloorGeometry(geometry);
        setScaleFtPerUnit(scale);
        if (validationError) {
            setError(validationError);
        } else {
            setError(null);
        }
    }, []);

    const handleTemplateSelect = (geometry: any, width: number, depth: number) => {
        setFloorGeometry(geometry);
        // Note: scaling logic could go here if needed
    };

    // Initialize keyboard shortcuts
    useEffect(() => {
        const shortcuts = new KeyboardShortcutManager();

        // Register shortcuts
        shortcuts.register({
            ...DEFAULT_SHORTCUTS.TUTORIAL,
            action: () => setShowTutorial(true),
        });

        shortcuts.register({
            ...DEFAULT_SHORTCUTS.SAVE,
            action: () => handleSave(),
        });

        shortcuts.register({
            ...DEFAULT_SHORTCUTS.EXPORT,
            action: () => setShowExportMenu(prev => !prev),
        });

        shortcuts.enable();

        return () => {
            shortcuts.disable();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading building...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/buildings/${buildingId}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        ← Back to Building
                    </Link>
                    <div className="h-6 w-px bg-slate-600"></div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Wall Designer</h1>
                        <p className="text-sm text-slate-400">
                            {building?.name || 'Building'} - {building?.widthFt}' × {building?.depthFt}'
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {error && (
                        <div className="text-sm text-red-400 bg-red-900/30 px-4 py-2 rounded-lg border border-red-700">
                            {error}
                        </div>
                    )}

                    {/* Templates Button */}
                    <button
                        onClick={() => setShowTemplates(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        title="Browse Templates"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                        </svg>
                        Templates
                    </button>

                    {/* Tutorial Button */}
                    <button
                        onClick={() => setShowTutorial(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        title="Show Tutorial"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Tutorial
                    </button>

                    {/* Export Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            disabled={!floorGeometry || !scaleFtPerUnit}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                                <button
                                    onClick={handleExportPDF}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors rounded-t-lg flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    Export as PDF
                                </button>
                                <button
                                    onClick={handleExportDXF}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
                                >
                                    Export as DXF
                                </button>
                                <button
                                    onClick={handleExportSVG}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
                                >
                                    Export as SVG
                                </button>
                                <button
                                    onClick={handleShowStats}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors rounded-b-lg"
                                >
                                    View Statistics
                                </button>
                            </div>
                        )}
                    </div>

                    {/* View in 3D */}
                    <Link
                        href={`/buildings/${buildingId}/3d`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        View in 3D
                    </Link>

                    <button
                        onClick={handleSave}
                        disabled={saving || !floorGeometry || !scaleFtPerUnit}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Floor Plan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Full-screen editor */}
            <div className="flex-1 overflow-hidden">
                <ImprovedWallEditor
                    buildingWidth={building?.widthFt}
                    buildingDepth={building?.depthFt}
                    initialGeometry={floorGeometry}
                    initialScaleFtPerUnit={scaleFtPerUnit}
                    initialPdfUrl={building?.pdfUrl}
                    onChange={handleEditorChange}
                />
            </div>

            {/* Tutorial */}
            {showTutorial && (
                <WallDesignerTutorial
                    onClose={() => setShowTutorial(false)}
                    currentStep={tutorialStep}
                    onStepChange={setTutorialStep}
                />
            )}

            {/* Template Browser */}
            {showTemplates && (
                <TemplateBrowser
                    onSelect={handleTemplateSelect}
                    onClose={() => setShowTemplates(false)}
                />
            )}
        </div>
    );
}
