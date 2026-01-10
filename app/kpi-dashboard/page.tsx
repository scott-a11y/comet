'use client';

import { useState, useEffect } from 'react';

interface KPIData {
    oee: {
        availability: number;
        performance: number;
        quality: number;
        overall: number;
    };
    cycleTime: {
        actual: number;
        takt: number;
        ratio: number;
    };
    throughput: {
        current: number;
        target: number;
        percentage: number;
    };
    quality: {
        firstPassYield: number;
        defectRate: number;
        reworkRate: number;
    };
}

export default function KPIDashboard() {
    const [kpiData, setKpiData] = useState<KPIData>({
        oee: {
            availability: 85,
            performance: 92,
            quality: 95,
            overall: 74, // 0.85 * 0.92 * 0.95 * 100
        },
        cycleTime: {
            actual: 12.5,
            takt: 15.0,
            ratio: 0.83, // 12.5 / 15.0
        },
        throughput: {
            current: 42,
            target: 50,
            percentage: 84,
        },
        quality: {
            firstPassYield: 92,
            defectRate: 3.5,
            reworkRate: 4.5,
        },
    });

    const [isLive, setIsLive] = useState(false);

    // Simulate real-time updates
    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            setKpiData((prev) => ({
                oee: {
                    availability: Math.min(100, Math.max(70, prev.oee.availability + (Math.random() - 0.5) * 2)),
                    performance: Math.min(100, Math.max(80, prev.oee.performance + (Math.random() - 0.5) * 2)),
                    quality: Math.min(100, Math.max(85, prev.oee.quality + (Math.random() - 0.5) * 1)),
                    overall: 0,
                },
                cycleTime: {
                    actual: Math.max(10, prev.cycleTime.actual + (Math.random() - 0.5) * 0.5),
                    takt: prev.cycleTime.takt,
                    ratio: 0,
                },
                throughput: {
                    current: Math.min(60, Math.max(30, prev.throughput.current + (Math.random() - 0.5) * 2)),
                    target: prev.throughput.target,
                    percentage: 0,
                },
                quality: {
                    firstPassYield: Math.min(100, Math.max(85, prev.quality.firstPassYield + (Math.random() - 0.5) * 1)),
                    defectRate: Math.max(0, prev.quality.defectRate + (Math.random() - 0.5) * 0.3),
                    reworkRate: Math.max(0, prev.quality.reworkRate + (Math.random() - 0.5) * 0.3),
                },
            }));
        }, 2000);

        return () => clearInterval(interval);
    }, [isLive]);

    // Calculate derived values
    useEffect(() => {
        setKpiData((prev) => ({
            ...prev,
            oee: {
                ...prev.oee,
                overall: Math.round((prev.oee.availability / 100) * (prev.oee.performance / 100) * (prev.oee.quality / 100) * 100),
            },
            cycleTime: {
                ...prev.cycleTime,
                ratio: prev.cycleTime.actual / prev.cycleTime.takt,
            },
            throughput: {
                ...prev.throughput,
                percentage: Math.round((prev.throughput.current / prev.throughput.target) * 100),
            },
        }));
    }, [kpiData.oee.availability, kpiData.oee.performance, kpiData.oee.quality, kpiData.cycleTime.actual, kpiData.throughput.current]);

    const getOEEColor = (value: number) => {
        if (value >= 85) return 'text-green-400';
        if (value >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getCycleTimeStatus = () => {
        if (kpiData.cycleTime.ratio <= 1.0) return { color: 'text-green-400', status: '✓ On Track', bg: 'bg-green-950/30 border-green-800/30' };
        if (kpiData.cycleTime.ratio <= 1.2) return { color: 'text-yellow-400', status: '⚠ Warning', bg: 'bg-yellow-950/30 border-yellow-800/30' };
        return { color: 'text-red-400', status: '✗ Behind', bg: 'bg-red-950/30 border-red-800/30' };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            📊 Real-Time KPI Dashboard
                        </h1>
                        <p className="text-slate-400">
                            Industry-leading manufacturing performance metrics (2026 Best Practices)
                        </p>
                    </div>
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg ${isLive
                                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 animate-pulse'
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            }`}
                    >
                        {isLive ? '⏸ Pause Live Updates' : '▶ Start Live Updates'}
                    </button>
                </div>

                {/* OEE (Overall Equipment Effectiveness) */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                        ⚙️ Overall Equipment Effectiveness (OEE)
                    </h2>
                    <p className="text-sm text-slate-400 mb-6">
                        OEE = Availability × Performance × Quality | World Class: ≥85% | Industry Average: 60%
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Overall OEE */}
                        <div className="md:col-span-1 bg-gradient-to-br from-blue-950/50 to-blue-900/30 p-6 rounded-lg border border-blue-700/30">
                            <div className="text-sm text-blue-300 mb-2">Overall OEE</div>
                            <div className={`text-5xl font-bold ${getOEEColor(kpiData.oee.overall)} mb-2`}>
                                {kpiData.oee.overall}%
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${kpiData.oee.overall >= 85 ? 'bg-green-500' : kpiData.oee.overall >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${kpiData.oee.overall}%` }}
                                />
                            </div>
                        </div>

                        {/* Availability */}
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Availability</div>
                            <div className="text-3xl font-bold text-cyan-400 mb-2">{kpiData.oee.availability.toFixed(1)}%</div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${kpiData.oee.availability}%` }} />
                            </div>
                            <div className="text-xs text-slate-500 mt-2">Uptime / Planned Production Time</div>
                        </div>

                        {/* Performance */}
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Performance</div>
                            <div className="text-3xl font-bold text-purple-400 mb-2">{kpiData.oee.performance.toFixed(1)}%</div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${kpiData.oee.performance}%` }} />
                            </div>
                            <div className="text-xs text-slate-500 mt-2">Actual Output / Ideal Output</div>
                        </div>

                        {/* Quality */}
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Quality</div>
                            <div className="text-3xl font-bold text-green-400 mb-2">{kpiData.oee.quality.toFixed(1)}%</div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${kpiData.oee.quality}%` }} />
                            </div>
                            <div className="text-xs text-slate-500 mt-2">Good Parts / Total Parts</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cycle Time vs Takt Time */}
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                        <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                            ⏱️ Cycle Time vs Takt Time
                        </h2>
                        <p className="text-sm text-slate-400 mb-6">
                            Takt Time = Available Time ÷ Customer Demand | Goal: Cycle Time ≤ Takt Time
                        </p>

                        <div className={`p-6 rounded-lg border mb-4 ${getCycleTimeStatus().bg}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm text-slate-400 mb-1">Actual Cycle Time</div>
                                    <div className="text-4xl font-bold text-blue-400">{kpiData.cycleTime.actual.toFixed(1)} min</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-slate-400 mb-1">Takt Time</div>
                                    <div className="text-4xl font-bold text-slate-300">{kpiData.cycleTime.takt.toFixed(1)} min</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-400">Ratio: {kpiData.cycleTime.ratio.toFixed(2)}</div>
                                <div className={`text-lg font-semibold ${getCycleTimeStatus().color}`}>
                                    {getCycleTimeStatus().status}
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded">
                            💡 If cycle time &gt; takt time, production cannot meet demand. Bottlenecks exist.
                        </div>
                    </div>

                    {/* Throughput */}
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                        <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                            📈 Throughput Rate
                        </h2>
                        <p className="text-sm text-slate-400 mb-6">
                            Units produced per hour | Target: {kpiData.throughput.target} units/hr
                        </p>

                        <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 p-6 rounded-lg border border-green-700/30 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm text-green-300 mb-1">Current Rate</div>
                                    <div className="text-5xl font-bold text-green-400">{kpiData.throughput.current.toFixed(0)}</div>
                                    <div className="text-sm text-slate-400 mt-1">units/hour</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-6xl font-bold text-green-400">{kpiData.throughput.percentage}%</div>
                                    <div className="text-sm text-slate-400">of target</div>
                                </div>
                            </div>

                            <div className="w-full bg-slate-800 rounded-full h-4">
                                <div
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${kpiData.throughput.percentage}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-slate-800/50 p-3 rounded">
                                <div className="text-slate-400 mb-1">Daily Projection</div>
                                <div className="text-xl font-bold text-cyan-400">{(kpiData.throughput.current * 8).toFixed(0)}</div>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded">
                                <div className="text-slate-400 mb-1">Weekly Projection</div>
                                <div className="text-xl font-bold text-purple-400">{(kpiData.throughput.current * 40).toFixed(0)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quality Metrics */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center gap-2">
                        ✨ Quality Metrics
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 p-6 rounded-lg border border-green-700/30">
                            <div className="text-sm text-green-300 mb-2">First-Pass Yield</div>
                            <div className="text-4xl font-bold text-green-400 mb-2">{kpiData.quality.firstPassYield.toFixed(1)}%</div>
                            <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                                <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${kpiData.quality.firstPassYield}%` }} />
                            </div>
                            <div className="text-xs text-slate-400">Parts passing inspection on first attempt</div>
                        </div>

                        <div className="bg-gradient-to-br from-red-950/50 to-red-900/30 p-6 rounded-lg border border-red-700/30">
                            <div className="text-sm text-red-300 mb-2">Defect Rate</div>
                            <div className="text-4xl font-bold text-red-400 mb-2">{kpiData.quality.defectRate.toFixed(1)}%</div>
                            <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                                <div className="bg-red-500 h-3 rounded-full transition-all duration-500" style={{ width: `${kpiData.quality.defectRate}%` }} />
                            </div>
                            <div className="text-xs text-slate-400">Defective parts per total production</div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-950/50 to-orange-900/30 p-6 rounded-lg border border-orange-700/30">
                            <div className="text-sm text-orange-300 mb-2">Rework Rate</div>
                            <div className="text-4xl font-bold text-orange-400 mb-2">{kpiData.quality.reworkRate.toFixed(1)}%</div>
                            <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                                <div className="bg-orange-500 h-3 rounded-full transition-all duration-500" style={{ width: `${kpiData.quality.reworkRate}%` }} />
                            </div>
                            <div className="text-xs text-slate-400">Parts requiring rework or correction</div>
                        </div>
                    </div>
                </div>

                {/* Industry Benchmarks */}
                <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4">📚 Industry Benchmarks (2026)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="text-green-400">✓</span>
                            <div>
                                <div className="font-medium text-slate-300">World-Class OEE: ≥85%</div>
                                <div className="text-slate-500">Top manufacturers achieve 85-95% OEE</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-400">✓</span>
                            <div>
                                <div className="font-medium text-slate-300">Cycle Time: ≤ Takt Time</div>
                                <div className="text-slate-500">Production keeps pace with demand</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-400">✓</span>
                            <div>
                                <div className="font-medium text-slate-300">First-Pass Yield: ≥95%</div>
                                <div className="text-slate-500">Minimal rework and waste</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-400">✓</span>
                            <div>
                                <div className="font-medium text-slate-300">Defect Rate: &lt;2%</div>
                                <div className="text-slate-500">Six Sigma quality standards</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
