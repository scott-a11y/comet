"use client";

import { useState } from "react";
import {
    generateImprovementSuggestions,
    generateKaizenDashboard,
    prioritizeSuggestionsByROI,
    generatePDCACycle,
    type ImprovementSuggestion,
    type KaizenEvent,
} from "@/lib/lean/kaizen";

export default function KaizenPage() {
    const [showPDCA, setShowPDCA] = useState<string | null>(null);

    // Sample data for demo
    const sampleEvents: KaizenEvent[] = [
        {
            id: '1',
            layoutId: 1,
            eventType: 'baseline',
            date: new Date('2024-01-01'),
            metrics: {
                leanScore: 65,
                totalDistance: 450,
                efficiency: 72,
                wasteScore: 60,
                throughput: 120,
            },
            notes: 'Initial baseline measurement',
        },
        {
            id: '2',
            layoutId: 1,
            eventType: 'improvement',
            date: new Date('2024-03-15'),
            metrics: {
                leanScore: 78,
                totalDistance: 280,
                efficiency: 85,
                wasteScore: 78,
                throughput: 145,
            },
            changes: ['Relocated router table', 'Added tool storage at workstations'],
            notes: 'Implemented cell manufacturing concept',
        },
        {
            id: '3',
            layoutId: 1,
            eventType: 'measurement',
            date: new Date('2024-06-01'),
            metrics: {
                leanScore: 87,
                totalDistance: 180,
                efficiency: 94,
                wasteScore: 92,
                throughput: 165,
            },
            changes: ['Optimized workflow sequence', 'Implemented 5S'],
            notes: 'Continuous improvement showing results',
        },
    ];

    const suggestions = generateImprovementSuggestions(87, 180, 94, 4);
    const prioritizedSuggestions = prioritizeSuggestionsByROI(suggestions);
    const dashboard = generateKaizenDashboard(sampleEvents, suggestions);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        🌱 Kaizen Dashboard
                    </h1>
                    <p className="text-slate-400">Continuous Improvement Tracking</p>
                </div>

                {/* Current Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-6">
                        <div className="text-sm text-slate-500 mb-1">Lean Score</div>
                        <div className="text-3xl font-bold text-emerald-300">
                            {dashboard.currentMetrics.leanScore}/100
                        </div>
                        <div className="text-xs text-emerald-400 mt-2">+22 from baseline</div>
                    </div>

                    <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-6">
                        <div className="text-sm text-slate-500 mb-1">Travel Distance</div>
                        <div className="text-3xl font-bold text-blue-300">
                            {dashboard.currentMetrics.totalDistance} ft
                        </div>
                        <div className="text-xs text-blue-400 mt-2">-270 ft saved</div>
                    </div>

                    <div className="bg-purple-950/30 border border-purple-800/30 rounded-xl p-6">
                        <div className="text-sm text-slate-500 mb-1">Efficiency</div>
                        <div className="text-3xl font-bold text-purple-300">
                            {dashboard.currentMetrics.efficiency}%
                        </div>
                        <div className="text-xs text-purple-400 mt-2">+22% improvement</div>
                    </div>

                    <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-6">
                        <div className="text-sm text-slate-500 mb-1">Waste Score</div>
                        <div className="text-3xl font-bold text-amber-300">
                            {dashboard.currentMetrics.wasteScore}/100
                        </div>
                        <div className="text-xs text-amber-400 mt-2">+32 improvement</div>
                    </div>
                </div>

                {/* Improvements Summary */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-emerald-400 mb-6">📈 Total Improvements</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-slate-500 mb-2">Annual Cost Savings</div>
                            <div className="text-4xl font-bold text-green-400">
                                ${dashboard.improvements.totalSavings.toLocaleString()}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-slate-500 mb-2">Distance Reduced</div>
                            <div className="text-4xl font-bold text-blue-400">
                                {dashboard.improvements.distanceReduced} ft
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-slate-500 mb-2">Improvements Implemented</div>
                            <div className="text-4xl font-bold text-purple-400">
                                {dashboard.improvements.totalImplemented}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-emerald-400 mb-6">📅 Improvement Timeline</h2>

                    <div className="space-y-4">
                        {dashboard.timeline.map((event, idx) => (
                            <div key={event.id} className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${event.eventType === 'baseline' ? 'bg-slate-700' :
                                            event.eventType === 'improvement' ? 'bg-emerald-600' :
                                                'bg-blue-600'
                                        }`}>
                                        {event.eventType === 'baseline' ? '📍' :
                                            event.eventType === 'improvement' ? '🎯' : '📊'}
                                    </div>
                                </div>

                                <div className="flex-1 bg-slate-800/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-slate-200">
                                            {event.eventType === 'baseline' ? 'Baseline Measurement' :
                                                event.eventType === 'improvement' ? 'Improvement Implemented' :
                                                    'Progress Measurement'}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {event.date.toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-2">
                                        <div>
                                            <div className="text-xs text-slate-500">Lean Score</div>
                                            <div className="text-lg font-semibold text-emerald-300">
                                                {event.metrics.leanScore}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Distance</div>
                                            <div className="text-lg font-semibold text-blue-300">
                                                {event.metrics.totalDistance} ft
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Efficiency</div>
                                            <div className="text-lg font-semibold text-purple-300">
                                                {event.metrics.efficiency}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Throughput</div>
                                            <div className="text-lg font-semibold text-amber-300">
                                                {event.metrics.throughput}/day
                                            </div>
                                        </div>
                                    </div>

                                    {event.changes && event.changes.length > 0 && (
                                        <div className="mt-2">
                                            <div className="text-xs text-slate-500 mb-1">Changes:</div>
                                            <ul className="text-sm text-slate-400 space-y-1">
                                                {event.changes.map((change, i) => (
                                                    <li key={i}>• {change}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {event.notes && (
                                        <div className="mt-2 text-sm text-slate-400 italic">
                                            {event.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Suggestions */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-emerald-400 mb-6">💡 Improvement Suggestions (Prioritized by ROI)</h2>

                    <div className="space-y-4">
                        {prioritizedSuggestions.map((suggestion) => (
                            <div key={suggestion.id} className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${suggestion.priority === 'critical' ? 'bg-red-600 text-white' :
                                                    suggestion.priority === 'high' ? 'bg-orange-600 text-white' :
                                                        suggestion.priority === 'medium' ? 'bg-yellow-600 text-white' :
                                                            'bg-blue-600 text-white'
                                                }`}>
                                                {suggestion.priority.toUpperCase()}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${suggestion.effort === 'low' ? 'bg-green-700 text-white' :
                                                    suggestion.effort === 'medium' ? 'bg-yellow-700 text-white' :
                                                        'bg-red-700 text-white'
                                                }`}>
                                                {suggestion.effort} effort
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-200 mb-2">
                                            {suggestion.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm mb-4">
                                            {suggestion.description}
                                        </p>

                                        {/* Estimated Impact */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {suggestion.estimatedImpact.costSavings && (
                                                <div>
                                                    <div className="text-xs text-slate-500">Annual Savings</div>
                                                    <div className="text-lg font-semibold text-green-400">
                                                        ${suggestion.estimatedImpact.costSavings.toLocaleString()}
                                                    </div>
                                                </div>
                                            )}
                                            {suggestion.estimatedImpact.distanceReduction && (
                                                <div>
                                                    <div className="text-xs text-slate-500">Distance Saved</div>
                                                    <div className="text-lg font-semibold text-blue-400">
                                                        {Math.round(suggestion.estimatedImpact.distanceReduction)} ft
                                                    </div>
                                                </div>
                                            )}
                                            {suggestion.estimatedImpact.timeReduction && (
                                                <div>
                                                    <div className="text-xs text-slate-500">Time Saved/Day</div>
                                                    <div className="text-lg font-semibold text-purple-400">
                                                        {Math.round(suggestion.estimatedImpact.timeReduction)} min
                                                    </div>
                                                </div>
                                            )}
                                            {suggestion.estimatedImpact.efficiencyGain && (
                                                <div>
                                                    <div className="text-xs text-slate-500">Efficiency Gain</div>
                                                    <div className="text-lg font-semibold text-amber-400">
                                                        +{suggestion.estimatedImpact.efficiencyGain}%
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
                                    <button
                                        onClick={() => setShowPDCA(showPDCA === suggestion.id ? null : suggestion.id)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        {showPDCA === suggestion.id ? 'Hide' : 'Show'} PDCA Cycle
                                    </button>
                                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                                        Mark as Planned
                                    </button>
                                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors">
                                        Dismiss
                                    </button>
                                </div>

                                {/* PDCA Cycle */}
                                {showPDCA === suggestion.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                                        <h4 className="text-sm font-semibold text-emerald-400 mb-3">
                                            PDCA Cycle (Plan-Do-Check-Act)
                                        </h4>
                                        {(() => {
                                            const pdca = generatePDCACycle(suggestion);
                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="bg-blue-950/30 rounded-lg p-4">
                                                        <div className="font-semibold text-blue-300 mb-2">📋 Plan</div>
                                                        <ul className="text-xs text-slate-400 space-y-1">
                                                            {pdca.plan.map((item, i) => (
                                                                <li key={i}>• {item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-green-950/30 rounded-lg p-4">
                                                        <div className="font-semibold text-green-300 mb-2">🔨 Do</div>
                                                        <ul className="text-xs text-slate-400 space-y-1">
                                                            {pdca.do.map((item, i) => (
                                                                <li key={i}>• {item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-purple-950/30 rounded-lg p-4">
                                                        <div className="font-semibold text-purple-300 mb-2">📊 Check</div>
                                                        <ul className="text-xs text-slate-400 space-y-1">
                                                            {pdca.check.map((item, i) => (
                                                                <li key={i}>• {item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-amber-950/30 rounded-lg p-4">
                                                        <div className="font-semibold text-amber-300 mb-2">✅ Act</div>
                                                        <ul className="text-xs text-slate-400 space-y-1">
                                                            {pdca.act.map((item, i) => (
                                                                <li key={i}>• {item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
