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
        <div className="h-screen w-full bg-slate-950">
            <Scene building={building} />
        </div>
    );
}
