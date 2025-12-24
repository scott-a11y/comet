"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLayoutStore } from "@/lib/store/layout-store";
import { updateLayout } from "@/actions/layouts";
import { CanvasArea } from "./canvas-area";
import { PropertiesPanel } from "./properties-panel";
import { LibraryPanel } from "./library-panel";
import Konva from "konva";

interface EditorShellProps {
  initialLayout: {
    id: string;
    name: string;
    canvasState: any[];
    building: {
      name: string;
    };
  };
  buildingDims: {
    width: number;
    length: number;
  };
  pdfUrl: string | null;
}

export function EditorShell({ initialLayout, buildingDims, pdfUrl }: EditorShellProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [blueprintOpacity, setBlueprintOpacity] = useState(0.5);
  const { items, setItems, addItem, selectedId } = useLayoutStore();
  const stageRef = useRef<Konva.Stage>(null);

  // Initialize the store with the initial layout data
  useEffect(() => {
    setItems(initialLayout.canvasState || []);
  }, [initialLayout.canvasState, setItems]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const [result, error] = await updateLayout({
        id: initialLayout.id,
        canvasState: items,
      });

      if (error) {
        alert(`Failed to save layout: ${error.message}`);
        return;
      }

      alert("Layout saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save layout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWall = () => {
    const newWall = {
      id: `wall-${Date.now()}`,
      type: "WALL" as const,
      x: Math.random() * 200,
      y: Math.random() * 200,
      rotation: 0,
      width: 100,
      length: 10,
      metadata: { thickness: 8 },
    };
    addItem(newWall);
  };

  const handleAddMachine = () => {
    const newMachine = {
      id: `machine-${Date.now()}`,
      type: "EQUIPMENT" as const,
      x: Math.random() * 300,
      y: Math.random() * 300,
      rotation: 0,
      width: 50,
      length: 30,
      metadata: { powerKw: 5, type: "SAW" },
    };
    addItem(newMachine);
  };

  const handleExport = () => {
    const stage = stageRef.current;
    if (!stage) return;

    // Calculate the building bounds in pixels (1ft = 10px)
    const width = buildingDims.width * 10 + 100; // Add padding for labels
    const height = buildingDims.length * 10 + 150; // Add padding for labels and instructions

    // Export High-Res Image
    const dataUrl = stage.toDataURL({
      x: 0,
      y: 0,
      width,
      height,
      pixelRatio: 3, // 3x Quality for print-ready output
      mimeType: "image/png",
    });

    // Trigger Download
    const link = document.createElement("a");
    link.download = `comet-layout-${initialLayout.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/buildings/${initialLayout.building.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to Building
            </Link>
            <div className="text-white">
              <h1 className="text-xl font-semibold">{initialLayout.name}</h1>
              <p className="text-slate-400 text-sm">
                Building: {initialLayout.building.name} ({buildingDims.width}' × {buildingDims.length}')
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {pdfUrl && (
              <div className="flex items-center space-x-2">
                <label className="text-slate-400 text-sm">Blueprint:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={blueprintOpacity}
                  onChange={(e) => setBlueprintOpacity(parseFloat(e.target.value))}
                  className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white text-sm w-8">{Math.round(blueprintOpacity * 100)}%</span>
              </div>
            )}
            <span className="text-slate-400 text-sm">
              {items.length} items
            </span>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-medium rounded transition-colors flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Layout</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700">
          {selectedId ? (
            <PropertiesPanel />
          ) : (
            <LibraryPanel />
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-slate-900">
          <CanvasArea
            ref={stageRef}
            buildingDims={buildingDims}
            pdfUrl={pdfUrl}
            blueprintOpacity={blueprintOpacity}
          />
        </div>
      </div>
    </div>
  );
}
