"use client";

import { useState } from "react";
import {
    calculateWorkflowDistance,
    calculateLeanScore,
    generateSpaghettiDiagram,
    type WorkflowSequence,
    type WorkflowAnalysisResult,
    type LeanScore,
    type SpaghettiDiagramData,
} from "@/lib/lean/workflow-analysis";

export default function LeanAnalysisPage() {
    const [workflowAnalysis, setWorkflowAnalysis] = useState<WorkflowAnalysisResult | null>(null);
    const [leanScore, setLeanScore] = useState<LeanScore | null>(null);
    const [spaghettiData, setSpaghettiData] = useState<SpaghettiDiagramData | null>(null);

    // Sample workflow for demo
    const sampleWorkflow: WorkflowSequence = {
        name: "Cabinet Door Production",
        description: "Standard workflow for producing cabinet doors",
        steps: [
            {
                equipmentId: 1,
                equipmentName: "Table Saw",
                operationName: "Cut to size",
                cycleTimeMinutes: 5,
                position: { x: 50, y: 50 },
            },
            {
                equipmentId: 2,
                equipmentName: "Router Table",
                operationName: "Profile edges",
                cycleTimeMinutes: 3,
                position: { x: 150, y: 50 },
            },
            {
                equipmentId: 3,
                equipmentName: "Drill Press",
                operationName: "Drill hinge holes",
                cycleTimeMinutes: 2,
                position: { x: 150, y: 150 },
            },
            {
                equipmentId: 4,
                equipmentName: "Sanding Station",
                operationName: "Sand surfaces",
                cycleTimeMinutes: 4,
                position: { x: 50, y: 150 },
            },
        ],
    };

    const handleAnalyze = () => {
        const analysis = calculateWorkflowDistance(sampleWorkflow);
        const score = calculateLeanScore(analysis, 4, 1200, true, true);
        const diagram = generateSpaghettiDiagram(sampleWorkflow, 20);

        setWorkflowAnalysis(analysis);
        setLeanScore(score);
        setSpaghettiData(diagram);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        🏭 Lean Manufacturing Analysis
                    </h1>
                    <p className="text-slate-400">
                        Optimize your shop layout using lean manufacturing principles
                    </p>
                </div>

                {/* Analyze Button */}
                <div className="flex gap-4">
                    <button
                        onClick={handleAnalyze}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/50"
                    >
                        🔍 Analyze Sample Workflow
                    </button>
                </div>

                {/* Results */}
                {workflowAnalysis && leanScore && spaghettiData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Lean Score Card */}
                        <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                            <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                                📊 Lean Score
                            </h2>

                            {/* Overall Score */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-300">Overall Score</span>
                                    <span className="text-4xl font-bold text-blue-400">{leanScore.overall}/100</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-4">
                                    <div
                                        className="bg-gradient-to-r from-blue-600 to-cyan-600 h-4 rounded-full transition-all duration-500"
                                        style={{ width: `${leanScore.overall}%` }}
                                    />
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            <div className="space-y-4">
                                {leanScore.breakdown.map((category, idx) => (
                                    <div key={idx} className="border-t border-slate-800 pt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-slate-300 font-medium">{category.category}</span>
                                            <span className="text-lg font-semibold text-cyan-400">{category.score}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${category.score >= 80 ? 'bg-green-500' :
                                                    category.score >= 60 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}
                                                style={{ width: `${category.score}%` }}
                                            />
                                        </div>
                                        {category.recommendations.length > 0 && (
                                            <div className="text-xs text-slate-400 mt-2">
                                                💡 {category.recommendations[0]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Workflow Metrics */}
                        <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                            <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                                📏 Workflow Metrics
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-800/30">
                                    <div className="text-xs text-slate-500 mb-1">Total Distance</div>
                                    <div className="text-2xl font-bold text-blue-300">{workflowAnalysis.totalDistance} ft</div>
                                </div>

                                <div className="bg-green-950/30 p-4 rounded-lg border border-green-800/30">
                                    <div className="text-xs text-slate-500 mb-1">Efficiency</div>
                                    <div className="text-2xl font-bold text-green-300">{workflowAnalysis.efficiency}%</div>
                                </div>

                                <div className="bg-purple-950/30 p-4 rounded-lg border border-purple-800/30">
                                    <div className="text-xs text-slate-500 mb-1">Cycle Time</div>
                                    <div className="text-2xl font-bold text-purple-300">{workflowAnalysis.totalCycleTime} min</div>
                                </div>

                                <div className="bg-amber-950/30 p-4 rounded-lg border border-amber-800/30">
                                    <div className="text-xs text-slate-500 mb-1">Waste Score</div>
                                    <div className="text-2xl font-bold text-amber-300">{workflowAnalysis.wasteScore}/100</div>
                                </div>
                            </div>

                            {/* Path Segments */}
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-slate-300 mb-3">Travel Path</h3>
                                <div className="space-y-2">
                                    {workflowAnalysis.pathSegments.map((segment, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400">
                                                {segment.from} → {segment.to}
                                            </span>
                                            <span className="text-cyan-400 font-mono">{segment.distance} ft</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Spaghetti Diagram with Quantified Metrics */}
                        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                            <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                                🍝 Spaghetti Diagram - Quantified Metrics
                            </h2>

                            {/* Industry-Standard Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 p-4 rounded-lg border border-blue-700/30">
                                    <div className="text-xs text-blue-300 mb-1">Total Distance Traveled</div>
                                    <div className="text-3xl font-bold text-blue-400">{workflowAnalysis.totalDistance}</div>
                                    <div className="text-xs text-slate-400 mt-1">feet per shift</div>
                                </div>

                                <div className="bg-gradient-to-br from-amber-950/50 to-amber-900/30 p-4 rounded-lg border border-amber-700/30">
                                    <div className="text-xs text-amber-300 mb-1">Travel Time %</div>
                                    <div className="text-3xl font-bold text-amber-400">
                                        {Math.round((workflowAnalysis.totalDistance / 200) * 100)}%
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">of cycle time</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 p-4 rounded-lg border border-purple-700/30">
                                    <div className="text-xs text-purple-300 mb-1">Touches/Handoffs</div>
                                    <div className="text-3xl font-bold text-purple-400">{workflowAnalysis.pathSegments.length}</div>
                                    <div className="text-xs text-slate-400 mt-1">material movements</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 p-4 rounded-lg border border-green-700/30">
                                    <div className="text-xs text-green-300 mb-1">Reduction Potential</div>
                                    <div className="text-3xl font-bold text-green-400">22%</div>
                                    <div className="text-xs text-slate-400 mt-1">cycle time savings</div>
                                </div>
                            </div>

                            {/* Non-Value-Added Time Analysis */}
                            <div className="bg-red-950/20 border border-red-800/30 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-red-300">Non-Value-Added Time Analysis</h3>
                                    <span className="text-2xl font-bold text-red-400">
                                        {Math.round((workflowAnalysis.totalDistance / (workflowAnalysis.totalCycleTime * 5)) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                                    <div
                                        className="bg-gradient-to-r from-red-600 to-orange-600 h-3 rounded-full"
                                        style={{ width: `${Math.round((workflowAnalysis.totalDistance / (workflowAnalysis.totalCycleTime * 5)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400">
                                    Time spent moving materials vs. actual production work. Industry best practice: &lt;15%
                                </p>
                            </div>

                            <div className="bg-slate-950 rounded-lg p-8 border border-slate-800 relative" style={{ height: '400px' }}>
                                <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute inset-0">
                                    {/* Draw paths */}
                                    {spaghettiData.paths.map((path, idx) => (
                                        <g key={idx}>
                                            <line
                                                x1={path.from.x}
                                                y1={path.from.y}
                                                x2={path.to.x}
                                                y2={path.to.y}
                                                stroke={path.color}
                                                strokeWidth="2"
                                                opacity="0.6"
                                            />
                                            {/* Arrow */}
                                            <polygon
                                                points={`${path.to.x},${path.to.y} ${path.to.x - 3},${path.to.y - 3} ${path.to.x - 3},${path.to.y + 3}`}
                                                fill={path.color}
                                            />
                                        </g>
                                    ))}

                                    {/* Draw equipment points */}
                                    {sampleWorkflow.steps.map((step, idx) => (
                                        <g key={idx}>
                                            <circle
                                                cx={step.position.x}
                                                cy={step.position.y}
                                                r="8"
                                                fill="#3b82f6"
                                                stroke="#60a5fa"
                                                strokeWidth="2"
                                            />
                                            <text
                                                x={step.position.x}
                                                y={step.position.y - 15}
                                                fill="#e2e8f0"
                                                fontSize="10"
                                                textAnchor="middle"
                                            >
                                                {step.equipmentName}
                                            </text>
                                        </g>
                                    ))}
                                </svg>
                            </div>

                            <div className="mt-4 flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                                    <span className="text-slate-400">Low Traffic (&lt;20/day)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                                    <span className="text-slate-400">Medium Traffic (20-50/day)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                                    <span className="text-slate-400">High Traffic (&gt;50/day)</span>
                                </div>
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                            <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                                💡 Optimization Suggestions
                            </h2>

                            <div className="space-y-3">
                                {workflowAnalysis.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-lg">
                                        <span className="text-2xl">{suggestion.includes('CRITICAL') ? '🔴' : suggestion.includes('WARNING') ? '⚠️' : suggestion.includes('EXCELLENT') ? '✅' : '💡'}</span>
                                        <p className="text-slate-300 flex-1">{suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                {!workflowAnalysis && (
                    <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-blue-300 mb-2">About Lean Analysis</h3>
                        <p className="text-slate-400 mb-4">
                            Lean manufacturing analysis helps you identify and eliminate waste in your shop layout.
                            This tool calculates travel distance, workflow efficiency, and provides actionable recommendations
                            to optimize your production process.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Workflow path analysis and distance calculation
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Spaghetti diagram visualization
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Comprehensive lean scoring (0-100)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Actionable optimization recommendations
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
