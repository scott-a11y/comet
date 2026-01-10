'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OptimizationResult {
    totalScore: number;
    warnings: string[];
    suggestions: string[];
    placementsCount: number;
}

interface LayoutOptimizerProps {
    buildingId: string;
    layoutId: string;
    hasEquipment: boolean;
}

export default function LayoutOptimizer({ buildingId, layoutId, hasEquipment }: LayoutOptimizerProps) {
    const router = useRouter();
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Optimization settings
    const [workflowPriority, setWorkflowPriority] = useState<'efficiency' | 'safety' | 'balanced'>('efficiency');
    const [groupSimilar, setGroupSimilar] = useState(true);
    const [nearUtilities, setNearUtilities] = useState(true);
    const [minClearance, setMinClearance] = useState(3);

    const handleOptimize = async () => {
        setIsOptimizing(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`/api/buildings/${buildingId}/layouts/${layoutId}/optimize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workflowPriority,
                    groupSimilar,
                    nearUtilities,
                    minClearance,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Optimization failed');
            }

            setResult(data.data.optimization);

            // Refresh the page to show new positions
            router.refresh();
        } catch (err) {
            console.error('Optimization error:', err);
            setError(err instanceof Error ? err.message : 'Failed to optimize layout');
        } finally {
            setIsOptimizing(false);
        }
    };

    if (!hasEquipment) {
        return (
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <div className="font-semibold text-amber-300">No Equipment Available</div>
                        <div className="text-sm text-amber-200/70 mt-1">
                            Add equipment to this building before optimizing the layout.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Optimize Button and Settings Toggle */}
            <div className="flex gap-3">
                <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                    {isOptimizing ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Optimizing...
                        </>
                    ) : (
                        <>
                            🤖 AI Optimize Layout
                        </>
                    )}
                </button>

                <a
                    href={`/api/buildings/${buildingId}/layouts/${layoutId}/export`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
                    title="Export layout as PDF for move crew"
                >
                    📄 Export PDF
                </a>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    title="Optimization Settings"
                >
                    ⚙️
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-white mb-3">Optimization Settings</h3>

                    {/* Workflow Priority */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Workflow Priority
                        </label>
                        <select
                            value={workflowPriority}
                            onChange={(e) => setWorkflowPriority(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="efficiency">Efficiency (Minimize Movement)</option>
                            <option value="safety">Safety (Maximize Clearance)</option>
                            <option value="balanced">Balanced</option>
                        </select>
                    </div>

                    {/* Group Similar Equipment */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="groupSimilar"
                            checked={groupSimilar}
                            onChange={(e) => setGroupSimilar(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor="groupSimilar" className="text-sm text-slate-300">
                            Group similar equipment together
                        </label>
                    </div>

                    {/* Place Near Utilities */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="nearUtilities"
                            checked={nearUtilities}
                            onChange={(e) => setNearUtilities(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor="nearUtilities" className="text-sm text-slate-300">
                            Place equipment near required utilities
                        </label>
                    </div>

                    {/* Minimum Clearance */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Minimum Clearance: {minClearance} ft
                        </label>
                        <input
                            type="range"
                            min="2"
                            max="8"
                            step="0.5"
                            value={minClearance}
                            onChange={(e) => setMinClearance(parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>2 ft</span>
                            <span>8 ft</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">❌</span>
                        <div>
                            <div className="font-semibold text-red-300">Optimization Failed</div>
                            <div className="text-sm text-red-200/70 mt-1">{error}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Display */}
            {result && (
                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div className="flex-1">
                            <div className="font-semibold text-green-300">Layout Optimized Successfully!</div>
                            <div className="text-sm text-green-200/70 mt-1">
                                Placed {result.placementsCount} equipment items with a score of {result.totalScore.toFixed(1)}/100
                            </div>
                        </div>
                    </div>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                        <div className="mt-3 space-y-2">
                            <div className="text-sm font-semibold text-amber-300">⚠️ Warnings:</div>
                            {result.warnings.map((warning, idx) => (
                                <div key={idx} className="text-sm text-amber-200/80 ml-6">
                                    • {warning}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Suggestions */}
                    {result.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                            <div className="text-sm font-semibold text-blue-300">💡 Optimizations Applied:</div>
                            {result.suggestions.map((suggestion, idx) => (
                                <div key={idx} className="text-sm text-blue-200/80 ml-6">
                                    • {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
