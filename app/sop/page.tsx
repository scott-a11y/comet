'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BookOpen, Plus, Search, Filter, Clock, Tag,
    CheckCircle, FileText, AlertTriangle, Eye
} from 'lucide-react';

interface SOPStep {
    id: string;
    stepNumber: number;
    title: string;
    instructions: string;
    photoUrl?: string;
    estimatedMinutes?: number;
    safetyNotes?: string;
}

interface SOP {
    id: string;
    title: string;
    category: string;
    version: string;
    status: string;
    description?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    steps: SOPStep[];
}

export default function SOPLibraryPage() {
    const [sops, setSops] = useState<SOP[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showNewSOPModal, setShowNewSOPModal] = useState(false);

    useEffect(() => {
        fetchSOPs();
    }, [categoryFilter, statusFilter]);

    const fetchSOPs = async () => {
        try {
            const params = new URLSearchParams();
            if (categoryFilter !== 'all') params.append('category', categoryFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/sops?${params}`);
            const result = await response.json();
            if (result.success) {
                setSops(result.data);
            }
        } catch (error) {
            console.error('Error fetching SOPs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSOPs = sops.filter(sop =>
        sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const categories = ['Safety', 'Quality', 'Maintenance', 'Setup', 'Cleaning'];
    const totalSteps = sops.reduce((sum, sop) => sum + sop.steps.length, 0);
    const totalTime = sops.reduce((sum, sop) =>
        sum + sop.steps.reduce((stepSum, step) => stepSum + (step.estimatedMinutes || 0), 0), 0
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <BookOpen className="w-10 h-10 text-blue-400" />
                                Standard Operating Procedures
                            </h1>
                            <p className="text-slate-400">
                                Create, manage, and share SOPs with your team
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNewSOPModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New SOP
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-300 text-sm font-medium">Total SOPs</p>
                                    <p className="text-3xl font-bold text-white">{sops.length}</p>
                                </div>
                                <FileText className="w-8 h-8 text-blue-400 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-600/20 to-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-300 text-sm font-medium">Active SOPs</p>
                                    <p className="text-3xl font-bold text-white">
                                        {sops.filter(s => s.status === 'active').length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-300 text-sm font-medium">Total Steps</p>
                                    <p className="text-3xl font-bold text-white">{totalSteps}</p>
                                </div>
                                <Tag className="w-8 h-8 text-purple-400 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-300 text-sm font-medium">Total Time</p>
                                    <p className="text-3xl font-bold text-white">{Math.round(totalTime)} min</p>
                                </div>
                                <Clock className="w-8 h-8 text-orange-400 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search SOPs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SOP Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    </div>
                ) : filteredSOPs.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                        <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No SOPs Found</h3>
                        <p className="text-slate-400 mb-6">
                            {searchTerm ? 'Try adjusting your search or filters' : 'Get started by creating your first SOP'}
                        </p>
                        <button
                            onClick={() => setShowNewSOPModal(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Create First SOP
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSOPs.map((sop) => (
                            <Link
                                key={sop.id}
                                href={`/sop/${sop.id}`}
                                className="group bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 rounded-lg p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10"
                            >
                                {/* Status Badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sop.status === 'active'
                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                            : sop.status === 'draft'
                                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                        }`}>
                                        {sop.status.charAt(0).toUpperCase() + sop.status.slice(1)}
                                    </span>
                                    <Eye className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                    {sop.title}
                                </h3>

                                {/* Category */}
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-400">{sop.category}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-sm text-slate-400">v{sop.version}</span>
                                </div>

                                {/* Description */}
                                {sop.description && (
                                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                        {sop.description}
                                    </p>
                                )}

                                {/* Meta */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <FileText className="w-4 h-4" />
                                        <span>{sop.steps.length} steps</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {Math.round(sop.steps.reduce((sum, step) => sum + (step.estimatedMinutes || 0), 0))} min
                                        </span>
                                    </div>
                                </div>

                                {/* Tags */}
                                {sop.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {sop.tags.slice(0, 3).map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {sop.tags.length > 3 && (
                                            <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">
                                                +{sop.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* New SOP Modal (placeholder) */}
            {showNewSOPModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-4">Create New SOP</h2>
                        <p className="text-slate-400 mb-6">
                            SOP creation form coming soon. For now, use the API to create SOPs.
                        </p>
                        <button
                            onClick={() => setShowNewSOPModal(false)}
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
