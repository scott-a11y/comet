"use client";

import React, { ReactNode } from "react";
import { useWorkspaceStore, type DockPosition } from "@/hooks/use-workspace-store";
import { ChevronLeft, ChevronRight, ChevronUp, Settings } from "lucide-react";

interface DockableToolbarProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    showDockControls?: boolean;
    showSettings?: boolean;
    onSettingsClick?: () => void;
}

export function DockableToolbar({
    children,
    title = "Workspace",
    subtitle,
    showDockControls = true,
    showSettings = false,
    onSettingsClick,
}: DockableToolbarProps) {
    const { dockPosition, isCompact, setDockPosition, setIsCompact } = useWorkspaceStore();

    const isHorizontal = dockPosition === "top";

    const dockButtons = [
        { position: "left" as DockPosition, icon: ChevronLeft, label: "Dock Left", arrow: "←" },
        { position: "top" as DockPosition, icon: ChevronUp, label: "Dock Top", arrow: "↑" },
        { position: "right" as DockPosition, icon: ChevronRight, label: "Dock Right", arrow: "→" },
    ];

    return (
        <div
            className={`
                bg-slate-800/95 backdrop-blur-md border border-slate-700 shadow-2xl
                flex transition-all duration-300
                ${isHorizontal
                    ? 'flex-row items-center gap-4 h-16 px-4'
                    : `flex-col gap-4 ${isCompact ? 'w-16' : 'w-64'} h-full p-4`
                }
            `}
        >
            {/* Header Section */}
            {!isHorizontal && (
                <div className="flex flex-col gap-3">
                    {/* Title */}
                    {!isCompact && (
                        <div className="flex flex-col">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                                {title}
                            </span>
                            {subtitle && (
                                <span className="text-[8px] text-slate-500 font-medium">
                                    {subtitle}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Docking Controls */}
                    {showDockControls && !isCompact && (
                        <div>
                            <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">
                                Dock Position
                            </div>
                            <div className="flex gap-1">
                                {dockButtons.map(({ position, label, arrow }) => (
                                    <button
                                        key={position}
                                        onClick={() => setDockPosition(position)}
                                        className={`
                                            flex-1 p-1.5 rounded text-[10px] font-bold transition-all
                                            ${dockPosition === position
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                                            }
                                        `}
                                        title={label}
                                    >
                                        {arrow}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Compact Toggle */}
                    {!isCompact && (
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className="text-[8px] text-slate-500 hover:text-slate-300 text-left transition-colors"
                        >
                            Collapse Sidebar →
                        </button>
                    )}

                    {/* Divider */}
                    {!isCompact && <div className="h-px bg-slate-700" />}
                </div>
            )}

            {/* Compact Mode Icon */}
            {!isHorizontal && isCompact && (
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => setIsCompact(false)}
                        className="p-2 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="Expand Sidebar"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div
                className={`flex-1 ${isHorizontal ? 'flex flex-row items-center gap-2 overflow-x-auto' : 'flex flex-col gap-4 overflow-y-auto'}`}
                style={{ scrollbarGutter: 'stable', paddingRight: isHorizontal ? 0 : '4px' }}
            >
                {children}
            </div>

            {/* Footer Section */}
            {!isHorizontal && !isCompact && showSettings && (
                <div className="mt-auto pt-4 border-t border-slate-700">
                    <button
                        onClick={onSettingsClick}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-[10px] font-bold uppercase tracking-wider group"
                    >
                        <div className="flex items-center gap-2">
                            <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                            <span>Settings</span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}

// Wrapper component that handles the layout based on dock position
interface DockableWorkspaceProps {
    toolbar: ReactNode;
    canvas: ReactNode;
}

export function DockableWorkspace({ toolbar, canvas }: DockableWorkspaceProps) {
    const dockPosition = useWorkspaceStore((state) => state.dockPosition);

    const getLayoutClasses = (pos: DockPosition) => {
        switch (pos) {
            case "top":
                return "flex-col";
            case "right":
                return "flex-row-reverse";
            case "left":
            default:
                return "flex-row";
        }
    };

    return (
        <div className={`flex w-full h-full overflow-hidden ${getLayoutClasses(dockPosition)}`}>
            {/* Toolbar Container */}
            <div className="flex-none z-10">
                {toolbar}
            </div>

            {/* Canvas Container */}
            <div className="flex-1 relative min-w-0 min-h-0 bg-slate-900 overflow-hidden">
                {canvas}
            </div>
        </div>
    );
}
