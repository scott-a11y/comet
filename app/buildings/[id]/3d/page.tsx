'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DockableToolbar, DockableWorkspace } from '@/components/layout/DockableToolbar';
import { Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Move, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Dynamically import Scene with SSR disabled
const Scene = dynamic(
    () => import('@/components/3d/Scene').then((mod) => ({ default: mod.Scene })),
    {
        ssr: false,
        loading: () => (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
                <div className="bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg">
                    Loading 3D View...
                </div>
            </div>
        ),
    }
);

interface PageProps {
    params: {
        id: string;
    };
}

export default function Building3DPage({ params }: PageProps) {
    const [building, setBuilding] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWalls, setShowWalls] = useState(true);

    useEffect(() => {
        const buildingId = parseInt(params.id);

        if (isNaN(buildingId)) {
            setError('Invalid building ID');
            setLoading(false);
            return;
        }

        fetch(`/api/buildings/${buildingId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setBuilding(data.data);
                } else {
                    setError('Building not found');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch building:', err);
                setError('Failed to load building');
                setLoading(false);
            });
    }, [params.id]);

    const toggleWalls = () => {
        setShowWalls(!showWalls);
        const event = new CustomEvent('toggle-walls');
        window.dispatchEvent(event);
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
                <div className="bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg">
                    Loading building data...
                </div>
            </div>
        );
    }

    if (error || !building) {
        return (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
                <div className="bg-red-900 text-white px-6 py-3 rounded-lg shadow-lg">
                    {error || 'Building not found'}
                </div>
            </div>
        );
    }

    return (
        <DockableWorkspace
            toolbar={
                <DockableToolbar
                    title="3D Viewer"
                    subtitle={building.name || 'Building Model'}
                    showDockControls={true}
                >
                    {/* Navigation */}
                    <div className="space-y-2">
                        <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Navigation</h3>
                        <Link
                            href={`/buildings/${params.id}/wall-designer`}
                            className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft size={16} />
                            Back to Designer
                        </Link>
                    </div>

                    {/* View Controls */}
                    <div className="space-y-2">
                        <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">View Controls</h3>

                        <button
                            onClick={toggleWalls}
                            className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${showWalls
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                }`}
                        >
                            {showWalls ? <Eye size={16} /> : <EyeOff size={16} />}
                            {showWalls ? 'Hide Walls' : 'Show Walls'}
                        </button>

                        <button
                            onClick={() => {
                                const event = new CustomEvent('reset-camera');
                                window.dispatchEvent(event);
                            }}
                            className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                            <RotateCcw size={16} />
                            Reset Camera
                        </button>
                    </div>

                    {/* Camera Controls */}
                    <div className="space-y-2">
                        <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Camera</h3>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    const event = new CustomEvent('zoom-in');
                                    window.dispatchEvent(event);
                                }}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                title="Zoom In"
                            >
                                <ZoomIn size={16} />
                            </button>
                            <button
                                onClick={() => {
                                    const event = new CustomEvent('zoom-out');
                                    window.dispatchEvent(event);
                                }}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                title="Zoom Out"
                            >
                                <ZoomOut size={16} />
                            </button>
                        </div>

                        <div className="text-[10px] text-slate-500 mt-2 space-y-1">
                            <div>• Left Click + Drag: Rotate</div>
                            <div>• Right Click + Drag: Pan</div>
                            <div>• Scroll: Zoom</div>
                        </div>
                    </div>

                    {/* Building Info */}
                    {building && (
                        <div className="mt-auto p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                            <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Building Info</h3>
                            <div className="space-y-1 text-xs text-slate-400">
                                <div><span className="text-slate-500">Name:</span> {building.name || 'Unnamed'}</div>
                                {building.width && building.depth && (
                                    <div><span className="text-slate-500">Size:</span> {building.width}' × {building.depth}'</div>
                                )}
                            </div>
                        </div>
                    )}
                </DockableToolbar>
            }
            canvas={
                <div className="w-full h-full bg-slate-950 relative">
                    <Scene building={building} />
                </div>
            }
        />
    );
}
