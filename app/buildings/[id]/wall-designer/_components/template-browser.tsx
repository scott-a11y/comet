'use client';

import { useState } from 'react';
import { FLOOR_PLAN_TEMPLATES, type FloorPlanTemplate, scaleTemplate } from '@/lib/wall-designer/templates';

interface Props {
    onSelect: (geometry: any, width: number, depth: number) => void;
    onClose: () => void;
}

export function TemplateBrowser({ onSelect, onClose }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<FloorPlanTemplate | null>(null);
    const [customWidth, setCustomWidth] = useState('');
    const [customDepth, setCustomDepth] = useState('');

    const categories = [
        { id: 'all', name: 'All Templates', icon: '📋' },
        { id: 'basic', name: 'Basic', icon: '⬜' },
        { id: 'workshop', name: 'Workshop', icon: '🔧' },
        { id: 'warehouse', name: 'Warehouse', icon: '📦' },
        { id: 'custom', name: 'Custom', icon: '✨' },
    ];

    const filteredTemplates = selectedCategory === 'all'
        ? FLOOR_PLAN_TEMPLATES
        : FLOOR_PLAN_TEMPLATES.filter((t) => t.category === selectedCategory);

    const handleApplyTemplate = () => {
        if (!selectedTemplate) return;

        const width = parseFloat(customWidth) || selectedTemplate.defaultWidth;
        const depth = parseFloat(customDepth) || selectedTemplate.defaultDepth;

        const geometry = scaleTemplate(selectedTemplate, width, depth);
        onSelect(geometry, width, depth);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-6xl w-full h-[80vh] shadow-2xl flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-lg flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Floor Plan Templates</h2>
                        <p className="text-green-100 text-sm mt-1">
                            Choose a pre-built layout to get started quickly
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-green-200 transition-colors"
                        aria-label="Close template browser"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar - Categories */}
                    <div className="w-48 bg-slate-900/50 border-r border-slate-700 p-4 overflow-y-auto">
                        <h3 className="text-sm font-semibold text-slate-400 mb-3">CATEGORIES</h3>
                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full px-3 py-2 rounded-lg text-left transition-colors flex items-center gap-2 ${selectedCategory === cat.id
                                            ? 'bg-green-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800'
                                        }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span className="text-sm">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main - Template Grid */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => {
                                        setSelectedTemplate(template);
                                        setCustomWidth(template.defaultWidth.toString());
                                        setCustomDepth(template.defaultDepth.toString());
                                    }}
                                    className={`bg-slate-900/50 rounded-lg border-2 p-4 text-left transition-all hover:border-green-500 ${selectedTemplate?.id === template.id
                                            ? 'border-green-500 bg-green-900/20'
                                            : 'border-slate-700'
                                        }`}
                                >
                                    {/* Template Preview (placeholder) */}
                                    <div className="aspect-video bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                                        <span className="text-4xl">{getCategoryIcon(template.category)}</span>
                                    </div>

                                    <h4 className="text-white font-semibold mb-1">{template.name}</h4>
                                    <p className="text-slate-400 text-sm mb-2">{template.description}</p>

                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="bg-slate-800 px-2 py-1 rounded">
                                            {template.defaultWidth}' × {template.defaultDepth}'
                                        </span>
                                        <span className="bg-slate-800 px-2 py-1 rounded capitalize">
                                            {template.category}
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {template.tags.slice(0, 3).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs bg-green-900/30 text-green-300 px-2 py-0.5 rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel - Customization */}
                    {selectedTemplate && (
                        <div className="w-80 bg-slate-900/50 border-l border-slate-700 p-6 overflow-y-auto">
                            <h3 className="text-lg font-semibold text-white mb-4">Customize Template</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Template
                                    </label>
                                    <div className="text-white font-semibold">{selectedTemplate.name}</div>
                                    <div className="text-slate-400 text-sm mt-1">{selectedTemplate.description}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Width (feet)
                                    </label>
                                    <input
                                        type="number"
                                        value={customWidth}
                                        onChange={(e) => setCustomWidth(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                                        placeholder={selectedTemplate.defaultWidth.toString()}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Depth (feet)
                                    </label>
                                    <input
                                        type="number"
                                        value={customDepth}
                                        onChange={(e) => setCustomDepth(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                                        placeholder={selectedTemplate.defaultDepth.toString()}
                                    />
                                </div>

                                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                                    <p className="text-blue-200 text-sm">
                                        <strong>Tip:</strong> The template will be scaled to your custom dimensions while maintaining the same proportions.
                                    </p>
                                </div>

                                <button
                                    onClick={handleApplyTemplate}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Apply Template
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        basic: '⬜',
        workshop: '🔧',
        warehouse: '📦',
        office: '🏢',
        custom: '✨',
    };
    return icons[category] || '📋';
}
