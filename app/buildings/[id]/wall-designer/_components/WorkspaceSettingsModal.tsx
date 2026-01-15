"use client";

import React from "react";
import { useWorkspaceStore, ALL_TOOLS, type DockPosition } from "@/hooks/use-workspace-store";
import { X } from "lucide-react";

interface WorkspaceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WorkspaceSettingsModal({ isOpen, onClose }: WorkspaceSettingsModalProps) {
    const { dockPosition, isCompact, visibleTools, setDockPosition, setIsCompact, toggleTool } = useWorkspaceStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        ⚙️ Workspace Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Compact Mode */}
                    <section className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-white uppercase tracking-wider">
                                Compact Mode
                            </label>
                            <p className="text-xs text-slate-400">Icon-only toolbar for maximum space</p>
                        </div>
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isCompact ? 'bg-blue-600' : 'bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCompact ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </section>

                    {/* Dock Position */}
                    <section className="space-y-3">
                        <label className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                            Toolbar Dock Position
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(["left", "top", "right"] as DockPosition[]).map((pos) => (
                                <button
                                    key={pos}
                                    onClick={() => setDockPosition(pos)}
                                    className={`py-3 px-4 rounded-lg border font-bold text-sm transition-all capitalize ${dockPosition === pos
                                        ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40"
                                        : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
                                        }`}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Visible Tools */}
                    <section className="space-y-3">
                        <label className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                            Visible Tools
                        </label>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {ALL_TOOLS.map((toolId) => (
                                <label
                                    key={toolId}
                                    className="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-2 rounded-md transition-colors"
                                >
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={visibleTools.includes(toolId)}
                                            onChange={() => toggleTool(toolId)}
                                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-sm text-slate-300 group-hover:text-white capitalize font-medium">
                                        {toolId.replace("_", " ")}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
