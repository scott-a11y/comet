"use client";

import React from "react";
import { useWorkspaceStore, type DockPosition } from "@/hooks/use-workspace-store";

interface WorkspaceWrapperProps {
    toolbar: React.ReactNode;
    canvas: React.ReactNode;
}

export function WorkspaceWrapper({ toolbar, canvas }: WorkspaceWrapperProps) {
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
