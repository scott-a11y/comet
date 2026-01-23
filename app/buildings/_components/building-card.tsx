'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Building {
    id: number;
    name: string | null;
    widthFt: number | null;
    depthFt: number | null;
    notes?: string | null;
    _count: {
        equipment: number;
        zones: number;
        layouts: number;
        designerLayouts?: number;
    };
}

interface BuildingCardProps {
    building: Building;
}

export function BuildingCard({ building }: BuildingCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this building? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/buildings/${building.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            router.refresh();
        } catch (error) {
            console.error('Error deleting building:', error);
            alert('Failed to delete building');
            setIsDeleting(false);
        }
    };

    return (
        <Link
            href={`/buildings/${building.id}`}
            className={`block bg-slate-800 hover:bg-slate-750 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition-all group relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">
                    {building.name}
                </h3>
                <div className="flex items-center gap-3">
                    <div className="text-slate-400 text-sm">
                        {building.widthFt}' × {building.depthFt}'
                    </div>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Building"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center text-slate-400">
                    <span className="w-6">📦</span>
                    <span>{building._count.equipment} machines</span>
                </div>
                <div className="flex items-center text-slate-400">
                    <span className="w-6">🗺️</span>
                    <span>{building._count.zones} zones</span>
                </div>
                <div className="flex items-center text-slate-400">
                    <span className="w-6">📐</span>
                    <span>{building._count.layouts} layouts</span>
                </div>
            </div>

            {building.notes && (
                <p className="mt-4 text-slate-500 text-sm line-clamp-2">
                    {building.notes}
                </p>
            )}
        </Link>
    );
}
