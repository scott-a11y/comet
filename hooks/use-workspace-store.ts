"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DockPosition = "left" | "top" | "right";

interface WorkspaceState {
    dockPosition: DockPosition;
    isCompact: boolean;
    visibleTools: string[];
    setDockPosition: (pos: DockPosition) => void;
    setIsCompact: (compact: boolean) => void;
    toggleTool: (toolId: string) => void;
    setVisibleTools: (toolIds: string[]) => void;
}

// Initial full list of tools based on the current ImprovedWallEditor
export const ALL_TOOLS = [
    "blueprint",
    "generate",
    "wall",
    "edit",
    "select",
    "pan",
    "door",
    "window",
    "power",
    "run",
    "components",
    "close_loop",
    "undo",
    "redo",
    "delete"
];

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set) => ({
            dockPosition: "left",
            isCompact: false,
            visibleTools: ALL_TOOLS,
            setDockPosition: (pos) => set({ dockPosition: pos }),
            setIsCompact: (compact) => set({ isCompact: compact }),
            toggleTool: (toolId) =>
                set((state) => ({
                    visibleTools: state.visibleTools.includes(toolId)
                        ? state.visibleTools.filter((id) => id !== toolId)
                        : [...state.visibleTools, toolId],
                })),
            setVisibleTools: (toolIds) => set({ visibleTools: toolIds }),
        }),
        {
            name: "comet-workspace-storage",
        }
    )
);
