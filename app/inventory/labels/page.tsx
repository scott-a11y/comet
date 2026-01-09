"use client";

import { useState, useEffect } from "react";
import { generateBatchLabels, getLabelCSS, type PrintLabel } from "@/lib/inventory/qr-codes";

// Sample inventory items
const sampleItems = [
    { id: 1, name: "Maple Plywood 4x8", sku: "MPL-48", location: "Rack A" },
    { id: 2, name: "Cabinet Hinges (Soft-Close)", sku: "HNG-SC", location: "Bin 12" },
    { id: 3, name: "Pre-Catalyzed Lacquer", sku: "LAC-PC", location: "Finishing Room" },
    { id: 4, name: "Drawer Slides 22\"", sku: "SLD-22", location: "Bin 8" },
    { id: 5, name: "Oak Hardwood S4S", sku: "OAK-S4S", location: "Rack B" },
];

export default function LabelsPage() {
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [labels, setLabels] = useState<PrintLabel[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const toggleItem = (id: number) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedItems(sampleItems.map(i => i.id));
    };

    const deselectAll = () => {
        setSelectedItems([]);
    };

    const generateLabels = async () => {
        setIsGenerating(true);
        const itemsToGenerate = sampleItems.filter(i => selectedItems.includes(i.id));
        const generatedLabels = await generateBatchLabels(itemsToGenerate, labelSize);
        setLabels(generatedLabels);
        setIsGenerating(false);
    };

    const printLabels = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-slate-100">
            {/* Header - Hide when printing */}
            <div className="print:hidden p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                            🏷️ QR Code Labels
                        </h1>
                        <p className="text-slate-400">Generate and print labels for inventory items</p>
                    </div>

                    {/* Configuration */}
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                        <h2 className="text-xl font-semibold text-slate-200 mb-4">Label Settings</h2>

                        {/* Label Size */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-3">Label Size</label>
                            <div className="grid grid-cols-3 gap-4">
                                {(['small', 'medium', 'large'] as const).map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setLabelSize(size)}
                                        className={`p-4 rounded-lg border-2 transition-all ${labelSize === size
                                                ? 'border-violet-500 bg-violet-600/20'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-violet-500/50'
                                            }`}
                                    >
                                        <div className="font-semibold text-slate-200 capitalize">{size}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {size === 'small' && '2" × 4"'}
                                            {size === 'medium' && '3" × 5"'}
                                            {size === 'large' && '4" × 6"'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Item Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-slate-300">
                                    Select Items ({selectedItems.length} selected)
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={selectAll}
                                        className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={deselectAll}
                                        className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {sampleItems.map(item => (
                                    <label
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedItems.includes(item.id)
                                                ? 'border-violet-500 bg-violet-600/10'
                                                : 'border-slate-700 bg-slate-800/30 hover:border-violet-500/50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => toggleItem(item.id)}
                                            className="w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-200">{item.name}</div>
                                            <div className="text-xs text-slate-500">
                                                SKU: {item.sku} • Location: {item.location}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={generateLabels}
                                disabled={selectedItems.length === 0 || isGenerating}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg font-semibold transition-all shadow-lg disabled:cursor-not-allowed"
                            >
                                {isGenerating ? 'Generating...' : `Generate ${selectedItems.length} Label${selectedItems.length !== 1 ? 's' : ''}`}
                            </button>
                            {labels.length > 0 && (
                                <button
                                    onClick={printLabels}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                                >
                                    🖨️ Print Labels
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    {labels.length > 0 && (
                        <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                            <h2 className="text-xl font-semibold text-slate-200 mb-4">Preview</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {labels.map((label, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white text-black p-4 rounded-lg border-2 border-dashed border-slate-400"
                                    >
                                        <img src={label.qrCode} alt="QR Code" className="w-full mb-2" />
                                        <div className="text-sm font-semibold truncate">{label.itemName}</div>
                                        <div className="text-xs text-gray-600">SKU: {label.sku}</div>
                                        {label.location && (
                                            <div className="text-xs text-gray-600">📍 {label.location}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Layout - Only visible when printing */}
            {labels.length > 0 && (
                <div className="hidden print:block">
                    <style jsx global>{`
                        @media print {
                            @page {
                                size: letter;
                                margin: 0.5in;
                            }
                            body {
                                print-color-adjust: exact;
                                -webkit-print-color-adjust: exact;
                            }
                        }
                    `}</style>

                    <div className="grid grid-cols-2 gap-4">
                        {labels.map((label, idx) => {
                            const css = getLabelCSS(label.size);
                            return (
                                <div
                                    key={idx}
                                    className="border-2 border-dashed border-gray-400 p-4 flex flex-col items-center justify-center text-center bg-white text-black"
                                    style={{
                                        width: css.width,
                                        height: css.height,
                                        pageBreakInside: 'avoid',
                                    }}
                                >
                                    <img
                                        src={label.qrCode}
                                        alt="QR Code"
                                        className="mb-2"
                                        style={{ width: '60%', height: 'auto' }}
                                    />
                                    <div className="text-sm font-bold mb-1">{label.itemName}</div>
                                    <div className="text-xs text-gray-700">SKU: {label.sku}</div>
                                    {label.location && (
                                        <div className="text-xs text-gray-700 mt-1">📍 {label.location}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
