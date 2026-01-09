"use client";

import { useState } from "react";

// Store layout data structure
interface StorageLocation {
    id: string;
    type: 'rack' | 'bin' | 'shelf';
    zone: string;
    position: { row: number; col: number };
    items: Array<{ id: number; name: string; sku: string; quantity: number }>;
}

// Sample store layout
const storeLayout: StorageLocation[] = [
    // Lumber Zone (Row 0-1)
    { id: 'A1', type: 'rack', zone: 'Lumber', position: { row: 0, col: 0 }, items: [{ id: 1, name: 'Maple Plywood 4x8', sku: 'MPL-48', quantity: 25 }] },
    { id: 'A2', type: 'rack', zone: 'Lumber', position: { row: 0, col: 1 }, items: [] },
    { id: 'A3', type: 'rack', zone: 'Lumber', position: { row: 0, col: 2 }, items: [] },
    { id: 'B1', type: 'rack', zone: 'Lumber', position: { row: 1, col: 0 }, items: [] },
    { id: 'B2', type: 'rack', zone: 'Lumber', position: { row: 1, col: 1 }, items: [{ id: 5, name: 'Oak Hardwood S4S', sku: 'OAK-S4S', quantity: 150 }] },
    { id: 'B3', type: 'rack', zone: 'Lumber', position: { row: 1, col: 2 }, items: [] },

    // Hardware Zone (Row 3)
    { id: 'C1', type: 'bin', zone: 'Hardware', position: { row: 3, col: 0 }, items: [] },
    { id: 'C2', type: 'bin', zone: 'Hardware', position: { row: 3, col: 1 }, items: [] },
    { id: 'C3', type: 'bin', zone: 'Hardware', position: { row: 3, col: 2 }, items: [{ id: 2, name: 'Cabinet Hinges', sku: 'HNG-SC', quantity: 8 }] },
    { id: 'C4', type: 'bin', zone: 'Hardware', position: { row: 3, col: 3 }, items: [{ id: 4, name: 'Drawer Slides 22"', sku: 'SLD-22', quantity: 0 }] },
    { id: 'C5', type: 'bin', zone: 'Hardware', position: { row: 3, col: 4 }, items: [] },

    // Finishing Zone (Row 5)
    { id: 'D1', type: 'shelf', zone: 'Finishing', position: { row: 5, col: 1 }, items: [{ id: 3, name: 'Pre-Catalyzed Lacquer', sku: 'LAC-PC', quantity: 2 }] },
    { id: 'D2', type: 'shelf', zone: 'Finishing', position: { row: 5, col: 2 }, items: [] },
    { id: 'D3', type: 'shelf', zone: 'Finishing', position: { row: 5, col: 3 }, items: [] },
];

const zones = [
    { name: 'Lumber', color: 'from-amber-900/50 to-yellow-900/50 border-amber-700/50' },
    { name: 'Hardware', color: 'from-blue-900/50 to-cyan-900/50 border-blue-700/50' },
    { name: 'Finishing', color: 'from-purple-900/50 to-pink-900/50 border-purple-700/50' },
];

export default function StoreLayoutPage() {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedLocation, setHighlightedLocation] = useState<string | null>(null);

    // Find item location
    const searchItem = () => {
        const query = searchQuery.toLowerCase();
        const location = storeLayout.find(loc =>
            loc.items.some(item =>
                item.name.toLowerCase().includes(query) ||
                item.sku.toLowerCase().includes(query)
            )
        );
        setHighlightedLocation(location?.id || null);
        if (location) {
            setSelectedLocation(location.id);
        }
    };

    // Get grid dimensions
    const maxRow = Math.max(...storeLayout.map(l => l.position.row));
    const maxCol = Math.max(...storeLayout.map(l => l.position.col));

    // Create grid
    const grid: (StorageLocation | null)[][] = Array(maxRow + 1)
        .fill(null)
        .map(() => Array(maxCol + 1).fill(null));

    storeLayout.forEach(location => {
        grid[location.position.row][location.position.col] = location;
    });

    const getLocationColor = (location: StorageLocation) => {
        const zone = zones.find(z => z.name === location.zone);
        return zone?.color || 'from-slate-800 to-slate-900 border-slate-700';
    };

    const getLocationIcon = (type: string) => {
        switch (type) {
            case 'rack': return '📚';
            case 'bin': return '📦';
            case 'shelf': return '🗄️';
            default: return '📍';
        }
    };

    const selectedLoc = storeLayout.find(l => l.id === selectedLocation);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 text-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        🗺️ Store Layout
                    </h1>
                    <p className="text-slate-400">Visual warehouse map with bin locations</p>
                </div>

                {/* Search */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Search for item (e.g., 'Maple Plywood' or 'MPL-48')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchItem()}
                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button
                            onClick={searchItem}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all"
                        >
                            🔍 Find
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center gap-6">
                        <span className="text-sm font-semibold text-slate-300">Zones:</span>
                        {zones.map(zone => (
                            <div key={zone.name} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded bg-gradient-to-r ${zone.color}`} />
                                <span className="text-sm text-slate-400">{zone.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Store Map */}
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                        <h2 className="text-xl font-semibold text-slate-200 mb-4">Warehouse Map</h2>

                        <div className="space-y-6">
                            {grid.map((row, rowIdx) => {
                                const rowZone = row.find(loc => loc !== null)?.zone;
                                const isZoneStart = rowIdx === 0 || grid[rowIdx - 1].find(loc => loc !== null)?.zone !== rowZone;

                                return (
                                    <div key={rowIdx}>
                                        {isZoneStart && rowZone && (
                                            <div className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                                                {rowZone} Zone
                                            </div>
                                        )}
                                        <div className="grid grid-cols-5 gap-3">
                                            {row.map((location, colIdx) => {
                                                if (!location) {
                                                    return <div key={colIdx} className="aspect-square" />;
                                                }

                                                const isSelected = selectedLocation === location.id;
                                                const isHighlighted = highlightedLocation === location.id;
                                                const itemCount = location.items.reduce((sum, item) => sum + item.quantity, 0);

                                                return (
                                                    <button
                                                        key={colIdx}
                                                        onClick={() => setSelectedLocation(location.id)}
                                                        className={`aspect-square bg-gradient-to-br ${getLocationColor(location)} backdrop-blur rounded-lg border-2 p-3 transition-all hover:scale-105 ${isSelected ? 'ring-4 ring-cyan-500 scale-105' : ''
                                                            } ${isHighlighted ? 'animate-pulse ring-4 ring-yellow-500' : ''
                                                            }`}
                                                    >
                                                        <div className="flex flex-col items-center justify-center h-full">
                                                            <div className="text-2xl mb-1">{getLocationIcon(location.type)}</div>
                                                            <div className="text-sm font-bold text-slate-200">{location.id}</div>
                                                            {itemCount > 0 && (
                                                                <div className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded-full mt-1">
                                                                    {location.items.length}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Location Details */}
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                        <h2 className="text-xl font-semibold text-slate-200 mb-4">Location Details</h2>

                        {selectedLoc ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl">{getLocationIcon(selectedLoc.type)}</div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-100">{selectedLoc.id}</div>
                                        <div className="text-sm text-slate-500 capitalize">{selectedLoc.type} • {selectedLoc.zone}</div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-700 pt-4">
                                    <h3 className="text-sm font-semibold text-slate-300 mb-3">
                                        Items ({selectedLoc.items.length})
                                    </h3>

                                    {selectedLoc.items.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedLoc.items.map(item => (
                                                <div key={item.id} className="bg-slate-800/50 rounded-lg p-3">
                                                    <div className="font-medium text-slate-200">{item.name}</div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        SKU: {item.sku}
                                                    </div>
                                                    <div className="text-sm text-cyan-400 mt-1">
                                                        Stock: {item.quantity}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-600">
                                            <div className="text-4xl mb-2">📭</div>
                                            <div className="text-sm">Empty location</div>
                                        </div>
                                    )}
                                </div>

                                <button className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors">
                                    View QR Code
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-600">
                                <div className="text-6xl mb-4">👆</div>
                                <div className="text-sm">Click a location on the map</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                        <div className="text-sm text-slate-500 mb-1">Total Locations</div>
                        <div className="text-2xl font-bold text-slate-200">{storeLayout.length}</div>
                    </div>
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                        <div className="text-sm text-slate-500 mb-1">Occupied</div>
                        <div className="text-2xl font-bold text-green-400">
                            {storeLayout.filter(l => l.items.length > 0).length}
                        </div>
                    </div>
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                        <div className="text-sm text-slate-500 mb-1">Empty</div>
                        <div className="text-2xl font-bold text-slate-500">
                            {storeLayout.filter(l => l.items.length === 0).length}
                        </div>
                    </div>
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                        <div className="text-sm text-slate-500 mb-1">Zones</div>
                        <div className="text-2xl font-bold text-cyan-400">{zones.length}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
