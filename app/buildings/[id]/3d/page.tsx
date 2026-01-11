'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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
        <div className="h-screen w-full bg-slate-950 relative">
            {/* Navigation Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
                {/* Back Button */}
                <a
                    href={`/buildings/${params.id}/wall-designer`}
                    className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm border border-slate-600"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Designer
                </a>

                {/* Wall Visibility Toggle */}
                <button
                    onClick={() => {
                        // This will be passed to the Scene component
                        const event = new CustomEvent('toggle-walls');
                        window.dispatchEvent(event);
                    }}
                    className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm border border-slate-600"
                    title="Toggle Wall Visibility"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Toggle Walls
                </button>
            </div>

            <Scene building={building} />
        </div>
    );
}
