'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
    const [companyName, setCompanyName] = useState('');
    const [defaultClearance, setDefaultClearance] = useState(3);
    const [defaultCeilingHeight, setDefaultCeilingHeight] = useState(16);
    const [workflowPriority, setWorkflowPriority] = useState<'efficiency' | 'safety' | 'balanced'>('efficiency');
    const [groupSimilar, setGroupSimilar] = useState(true);
    const [autoSave, setAutoSave] = useState(true);
    const [autoSaveInterval, setAutoSaveInterval] = useState(5);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // Save to localStorage for now (TODO: Save to database)
        const settings = {
            companyName,
            defaultClearance,
            defaultCeilingHeight,
            workflowPriority,
            groupSimilar,
            autoSave,
            autoSaveInterval,
        };

        localStorage.setItem('comet_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            ⚙️ Settings
                        </h1>
                        <p className="text-slate-400">Configure company defaults and preferences</p>
                    </div>
                    <Link
                        href="/buildings"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                        ← Back to Buildings
                    </Link>
                </div>

                {/* Company Information */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-amber-400 mb-4">🏢 Company Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="ABC Woodworking"
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Default Measurements */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-amber-400 mb-4">📏 Default Measurements</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Default Equipment Clearance (feet)
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                value={defaultClearance}
                                onChange={(e) => setDefaultClearance(parseFloat(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Minimum space between equipment</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Default Ceiling Height (feet)
                            </label>
                            <input
                                type="number"
                                value={defaultCeilingHeight}
                                onChange={(e) => setDefaultCeilingHeight(parseInt(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Standard ceiling height for new buildings</p>
                        </div>
                    </div>
                </div>

                {/* Layout Preferences */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-amber-400 mb-4">🎯 Layout Preferences</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Default Workflow Priority
                            </label>
                            <select
                                value={workflowPriority}
                                onChange={(e) => setWorkflowPriority(e.target.value as any)}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="efficiency">Efficiency (Minimize Movement)</option>
                                <option value="safety">Safety (Maximize Clearance)</option>
                                <option value="balanced">Balanced</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="groupSimilar"
                                checked={groupSimilar}
                                onChange={(e) => setGroupSimilar(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="groupSimilar" className="text-sm text-slate-300">
                                Group similar equipment together by default
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="autoSave"
                                checked={autoSave}
                                onChange={(e) => setAutoSave(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="autoSave" className="text-sm text-slate-300">
                                Enable auto-save
                            </label>
                        </div>

                        {autoSave && (
                            <div className="ml-7">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Auto-save interval (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={autoSaveInterval}
                                    onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                                    className="w-32 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Keyboard Shortcuts Reference */}
                <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-2xl font-semibold text-amber-400 mb-4">⌨️ Keyboard Shortcuts</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <h3 className="font-semibold text-white mb-2">Movement</h3>
                            <ul className="space-y-1 text-slate-400">
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">↑↓←→</kbd> Nudge 0.1 ft</li>
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-slate-800 rounded">↑↓←→</kbd> Nudge 1 ft</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-2">Actions</h3>
                            <ul className="space-y-1 text-slate-400">
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">R</kbd> Rotate 90°</li>
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">L</kbd> Lock/Unlock</li>
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">Del</kbd> Remove</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-2">Edit</h3>
                            <ul className="space-y-1 text-slate-400">
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-slate-800 rounded">Z</kbd> Undo</li>
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-slate-800 rounded">Y</kbd> Redo</li>
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-slate-800 rounded">C</kbd> Copy</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-2">View</h3>
                            <ul className="space-y-1 text-slate-400">
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">?</kbd> Show shortcuts</li>
                                <li><kbd className="px-2 py-1 bg-slate-800 rounded">Esc</kbd> Deselect</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-4">
                    {saved && (
                        <div className="px-4 py-2 bg-green-600/20 border border-green-600 text-green-400 rounded-lg">
                            ✓ Settings saved successfully!
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
                    >
                        💾 Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
