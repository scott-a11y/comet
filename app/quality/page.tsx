'use client';

import { useState, useEffect } from 'react';
import {
    AlertTriangle, TrendingDown, TrendingUp, Plus,
    Filter, Calendar, BarChart3, Target, CheckCircle,
    XCircle, Clock, Users
} from 'lucide-react';
import { calculateTop3Defects, calculateDefectTrend, generateParetoData, calculateQualityMetrics } from '@/lib/quality/defect-tracker';

interface DefectLog {
    id: string;
    defectType: string;
    severity: string;
    description: string;
    location?: string;
    productLine?: string;
    rootCause?: string;
    correctiveAction?: string;
    status: string;
    resolvedAt?: string;
    reportedBy?: string;
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
}

export default function QualityDashboardPage() {
    const [defects, setDefects] = useState<DefectLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewDefectModal, setShowNewDefectModal] = useState(false);
    const [severityFilter, setSeverityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('7d');

    useEffect(() => {
        fetchDefects();
    }, [severityFilter, statusFilter]);

    const fetchDefects = async () => {
        try {
            const params = new URLSearchParams();
            if (severityFilter !== 'all') params.append('severity', severityFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/quality/defects?${params}`);
            const result = await response.json();
            if (result.success) {
                setDefects(result.data);
            }
        } catch (error) {
            console.error('Error fetching defects:', error);
        } finally {
            setLoading(false);
        }
    };

    // Adapt API data to library format
    const adaptedDefects = defects.map(d => ({
        id: parseInt(d.id) || 0,
        date: new Date(d.createdAt),
        productType: d.productLine || 'Unknown',
        defectType: d.defectType,
        location: d.location || 'Unknown',
        quantity: 1, // Each log represents 1 defect
        severity: d.severity === 'low' ? 'minor' as const :
            d.severity === 'medium' ? 'major' as const :
                'critical' as const,
        rootCause: d.rootCause,
        correctiveAction: d.correctiveAction,
        status: d.status === 'open' ? 'open' as const :
            d.status === 'investigating' ? 'in_progress' as const :
                'resolved' as const,
        assignedTo: d.assignedTo,
    }));

    // Calculate metrics using adapted data
    const top3 = calculateTop3Defects(adaptedDefects);

    // Calculate trend by splitting data into periods
    const now = new Date();
    const days = parseInt(timeRange);
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

    const currentPeriod = adaptedDefects.filter(d => d.date >= periodStart && d.date <= now);
    const previousPeriod = adaptedDefects.filter(d => d.date >= previousPeriodStart && d.date < periodStart);

    const trend = calculateDefectTrend(currentPeriod, previousPeriod);
    const paretoData = generateParetoData(adaptedDefects);
    const metrics = calculateQualityMetrics(adaptedDefects, 100);

    // Adapt top3 data for display
    const displayTop3 = top3.map(item => ({
        defectType: item.type,
        count: item.count,
        percentage: item.percentage,
    }));

    // Adapt pareto data for display
    const displayParetoData = paretoData.labels.map((label, idx) => ({
        defectType: label,
        count: paretoData.counts[idx],
        percentage: paretoData.percentages[idx],
        cumulativePercentage: paretoData.cumulativePercentages[idx],
    }));

    // Calculate trend percentage
    const trendPercentage = previousPeriod.length > 0
        ? ((currentPeriod.length - previousPeriod.length) / previousPeriod.length) * 100
        : 0;

    const severityColors = {
        low: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
        medium: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
        high: 'text-orange-300 bg-orange-500/20 border-orange-500/30',
        critical: 'text-red-300 bg-red-500/20 border-red-500/30',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <Target className="w-10 h-10 text-red-400" />
                                Quality Tracking
                            </h1>
                            <p className="text-slate-400">
                                Monitor defects, identify trends, and drive continuous improvement
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNewDefectModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Log Defect
                        </button>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-red-600/20 to-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-300 text-sm font-medium">Total Defects</p>
                                    <p className="text-3xl font-bold text-white">{metrics.totalDefects}</p>
                                </div>
                                <AlertTriangle className="w-8 h-8 text-red-400 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-300 text-sm font-medium">Defect Rate</p>
                                    <p className="text-3xl font-bold text-white">{metrics.defectRate.toFixed(1)}%</p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-orange-400 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-600/20 to-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-300 text-sm font-medium">Resolved</p>
                                    <p className="text-3xl font-bold text-white">
                                        {defects.filter(d => d.status === 'resolved' || d.status === 'closed').length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-300 text-sm font-medium">Trend</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-3xl font-bold text-white">
                                            {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(0)}%
                                        </p>
                                        {trendPercentage > 0 ? (
                                            <TrendingUp className="w-6 h-6 text-red-400" />
                                        ) : (
                                            <TrendingDown className="w-6 h-6 text-green-400" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top 3 Defects (Pareto Principle) */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-red-400" />
                        Top 3 Defects (80/20 Rule)
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Focus on these defects to achieve maximum quality improvement
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {displayTop3.map((defect, idx) => (
                            <div
                                key={defect.defectType}
                                className={`p-6 rounded-lg border-2 ${idx === 0
                                    ? 'bg-gradient-to-br from-red-600/20 to-red-500/10 border-red-500/50'
                                    : idx === 1
                                        ? 'bg-gradient-to-br from-orange-600/20 to-orange-500/10 border-orange-500/50'
                                        : 'bg-gradient-to-br from-yellow-600/20 to-yellow-500/10 border-yellow-500/50'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`text-4xl font-bold ${idx === 0 ? 'text-red-400' : idx === 1 ? 'text-orange-400' : 'text-yellow-400'
                                        }`}>
                                        #{idx + 1}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white">{defect.count}</div>
                                        <div className="text-sm text-slate-400">occurrences</div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{defect.defectType}</h3>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Impact</span>
                                    <span className={`font-semibold ${idx === 0 ? 'text-red-300' : idx === 1 ? 'text-orange-300' : 'text-yellow-300'
                                        }`}>
                                        {defect.percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="mt-3 bg-slate-900/50 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                                            }`}
                                        style={{ width: `${defect.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pareto Chart */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Pareto Analysis</h2>
                    <div className="space-y-3">
                        {displayParetoData.map((item, idx) => (
                            <div key={item.defectType} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white font-medium">{item.defectType}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-400">{item.count} defects</span>
                                        <span className="text-blue-400 font-semibold min-w-[4rem] text-right">
                                            {item.cumulativePercentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="relative h-8 bg-slate-900/50 rounded-lg overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-500"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                    <div
                                        className="absolute inset-y-0 left-0 border-r-2 border-blue-400"
                                        style={{ width: `${item.cumulativePercentage}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-between px-3">
                                        <span className="text-white text-sm font-semibold">
                                            {item.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Severity
                            </label>
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="all">All Severities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="investigating">Investigating</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Time Range
                            </label>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Recent Defects */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h2 className="text-2xl font-bold text-white">Recent Defects</h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400"></div>
                        </div>
                    ) : defects.length === 0 ? (
                        <div className="p-12 text-center">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Defects Found</h3>
                            <p className="text-slate-400">
                                {severityFilter !== 'all' || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Great job! No defects logged yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700">
                            {defects.slice(0, 10).map((defect) => (
                                <div key={defect.id} className="p-6 hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white">{defect.defectType}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColors[defect.severity as keyof typeof severityColors]
                                                    }`}>
                                                    {defect.severity}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${defect.status === 'open'
                                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    : defect.status === 'investigating'
                                                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    }`}>
                                                    {defect.status}
                                                </span>
                                            </div>
                                            <p className="text-slate-300 mb-2">{defect.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                {defect.location && (
                                                    <span>📍 {defect.location}</span>
                                                )}
                                                {defect.productLine && (
                                                    <span>🏭 {defect.productLine}</span>
                                                )}
                                                <span>
                                                    {new Date(defect.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {defect.rootCause && (
                                        <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                                            <p className="text-sm text-slate-400">
                                                <span className="font-semibold text-slate-300">Root Cause:</span> {defect.rootCause}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* New Defect Modal (placeholder) */}
            {showNewDefectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-4">Log New Defect</h2>
                        <p className="text-slate-400 mb-6">
                            Defect logging form coming soon. For now, use the API to log defects.
                        </p>
                        <button
                            onClick={() => setShowNewDefectModal(false)}
                            className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
