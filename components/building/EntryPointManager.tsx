'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EntryPoint {
    id: number;
    name: string;
    type: string;
    x: number;
    y: number;
    widthFt: number;
    direction: string | null;
    isPrimary: boolean;
    notes: string | null;
}

interface EntryPointManagerProps {
    buildingId: number;
    buildingWidth: number;
    buildingDepth: number;
    entryPoints: EntryPoint[];
}

const ENTRY_TYPES = [
    { value: 'door', label: '🚪 Door', icon: '🚪' },
    { value: 'loading_dock', label: '🚛 Loading Dock', icon: '🚛' },
    { value: 'overhead_door', label: '⬆️ Overhead Door', icon: '⬆️' },
    { value: 'emergency_exit', label: '🚨 Emergency Exit', icon: '🚨' },
];

const DIRECTIONS = ['north', 'south', 'east', 'west'];

export default function EntryPointManager({
    buildingId,
    buildingWidth,
    buildingDepth,
    entryPoints: initialEntryPoints,
}: EntryPointManagerProps) {
    const router = useRouter();
    const [entryPoints, setEntryPoints] = useState<EntryPoint[]>(initialEntryPoints);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: 'door',
        x: 0,
        y: 0,
        widthFt: 3,
        direction: 'north',
        isPrimary: false,
        notes: '',
    });

    const handleAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        setFormData({
            name: '',
            type: 'door',
            x: buildingWidth / 2,
            y: 0,
            widthFt: 3,
            direction: 'north',
            isPrimary: false,
            notes: '',
        });
    };

    const handleEdit = (point: EntryPoint) => {
        setEditingId(point.id);
        setIsAdding(false);
        setFormData({
            name: point.name,
            type: point.type,
            x: point.x,
            y: point.y,
            widthFt: point.widthFt,
            direction: point.direction || 'north',
            isPrimary: point.isPrimary,
            notes: point.notes || '',
        });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editingId
                ? `/api/buildings/${buildingId}/entry-points/${editingId}`
                : `/api/buildings/${buildingId}/entry-points`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to save entry point');

            router.refresh();
            setIsAdding(false);
            setEditingId(null);
        } catch (error) {
            console.error('Error saving entry point:', error);
            alert('Failed to save entry point');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this entry point?')) return;

        try {
            const response = await fetch(`/api/buildings/${buildingId}/entry-points/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete entry point');

            router.refresh();
        } catch (error) {
            console.error('Error deleting entry point:', error);
            alert('Failed to delete entry point');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Entry Points & Doors</h3>
                {!isAdding && !editingId && (
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Add Entry Point
                    </button>
                )}
            </div>

            {/* Entry Points List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entryPoints.map((point) => {
                    const typeInfo = ENTRY_TYPES.find((t) => t.value === point.type);
                    return (
                        <div
                            key={point.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{typeInfo?.icon || '📍'}</span>
                                    <div>
                                        <h4 className="font-semibold">{point.name}</h4>
                                        <p className="text-sm text-gray-500">{typeInfo?.label || point.type}</p>
                                    </div>
                                </div>
                                {point.isPrimary && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                        Primary
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1 text-sm text-gray-600 mb-3">
                                <p>Position: ({point.x.toFixed(1)}, {point.y.toFixed(1)}) ft</p>
                                <p>Width: {point.widthFt} ft</p>
                                {point.direction && <p>Direction: {point.direction}</p>}
                                {point.notes && <p className="text-xs italic">{point.notes}</p>}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(point)}
                                    className="flex-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(point.id)}
                                    className="flex-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
                    <h4 className="text-lg font-semibold mb-4">
                        {editingId ? 'Edit Entry Point' : 'Add New Entry Point'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Main Entrance"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {ENTRY_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                X Position (ft) <span className="text-gray-500 text-xs">0 to {buildingWidth}</span>
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.x}
                                onChange={(e) => setFormData({ ...formData, x: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Y Position (ft) <span className="text-gray-500 text-xs">0 to {buildingDepth}</span>
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.y}
                                onChange={(e) => setFormData({ ...formData, y: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Width (ft)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.widthFt}
                                onChange={(e) => setFormData({ ...formData, widthFt: parseFloat(e.target.value) || 3 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Direction</label>
                            <select
                                value={formData.direction}
                                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {DIRECTIONS.map((dir) => (
                                    <option key={dir} value={dir}>
                                        {dir.charAt(0).toUpperCase() + dir.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isPrimary}
                                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium">Primary Entry Point</span>
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes about this entry point..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSave}
                            disabled={saving || !formData.name}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? 'Saving...' : editingId ? 'Update' : 'Add Entry Point'}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {entryPoints.length === 0 && !isAdding && (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No entry points configured</p>
                    <p className="text-sm">Add doors, loading docks, and other entry points to optimize material flow</p>
                </div>
            )}
        </div>
    );
}
