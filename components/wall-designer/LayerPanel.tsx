"use client";

import { useState } from 'react';
import { Layer, LayerManager, LayerType } from '@/lib/wall-designer/LayerManager';
import { Eye, EyeOff, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';

interface LayerPanelProps {
    layerManager: LayerManager;
    onLayerChange?: () => void;
}

export function LayerPanel({ layerManager, onLayerChange }: LayerPanelProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [layers, setLayers] = useState(layerManager.getAllLayers());
    const activeLayer = layerManager.getActiveLayer();

    const handleUpdate = () => {
        setLayers(layerManager.getAllLayers());
        onLayerChange?.();
    };

    const toggleVisibility = (layerId: string) => {
        layerManager.toggleVisibility(layerId);
        handleUpdate();
    };

    const toggleLock = (layerId: string) => {
        layerManager.toggleLock(layerId);
        handleUpdate();
    };

    const setActive = (layerId: string) => {
        layerManager.setActiveLayer(layerId);
        handleUpdate();
    };

    const setOpacity = (layerId: string, opacity: number) => {
        layerManager.setOpacity(layerId, opacity / 100);
        handleUpdate();
    };

    return (
        <div className="bg-slate-800/95 border border-slate-700 rounded-lg shadow-xl w-80">
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700/50"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-2">
                    {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    <h3 className="text-sm font-semibold text-white">Layers</h3>
                    <span className="text-xs text-slate-400">({layers.length})</span>
                </div>

                {/* Quick actions */}
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => {
                            layerManager.showAll();
                            handleUpdate();
                        }}
                        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded"
                        title="Show all layers"
                    >
                        <Eye size={12} />
                    </button>
                    <button
                        onClick={() => {
                            layerManager.unlockAll();
                            handleUpdate();
                        }}
                        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded"
                        title="Unlock all layers"
                    >
                        <Unlock size={12} />
                    </button>
                </div>
            </div>

            {/* Layer list */}
            {!collapsed && (
                <div className="max-h-96 overflow-y-auto">
                    {layers.map(layer => (
                        <LayerItem
                            key={layer.id}
                            layer={layer}
                            isActive={activeLayer?.id === layer.id}
                            onToggleVisibility={() => toggleVisibility(layer.id)}
                            onToggleLock={() => toggleLock(layer.id)}
                            onSetActive={() => setActive(layer.id)}
                            onSetOpacity={(opacity) => setOpacity(layer.id, opacity)}
                            stats={layerManager.getLayerStats(layer.id)}
                        />
                    ))}
                </div>
            )}

            {/* Footer with layer count */}
            {!collapsed && (
                <div className="p-2 border-t border-slate-700 text-xs text-slate-400">
                    Active: {activeLayer?.name || 'None'}
                </div>
            )}
        </div>
    );
}

interface LayerItemProps {
    layer: Layer;
    isActive: boolean;
    onToggleVisibility: () => void;
    onToggleLock: () => void;
    onSetActive: () => void;
    onSetOpacity: (opacity: number) => void;
    stats: { elementCount: number; visible: boolean; locked: boolean } | null;
}

function LayerItem({
    layer,
    isActive,
    onToggleVisibility,
    onToggleLock,
    onSetActive,
    onSetOpacity,
    stats
}: LayerItemProps) {
    const [showOpacity, setShowOpacity] = useState(false);

    return (
        <div
            className={`
        group border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors
        ${isActive ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''}
      `}
        >
            <div className="flex items-center gap-2 p-2">
                {/* Visibility toggle */}
                <button
                    onClick={onToggleVisibility}
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                    {layer.visible ? (
                        <Eye size={14} className="text-slate-400" />
                    ) : (
                        <EyeOff size={14} className="text-slate-600" />
                    )}
                </button>

                {/* Lock toggle */}
                <button
                    onClick={onToggleLock}
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                    title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                >
                    {layer.locked ? (
                        <Lock size={14} className="text-yellow-500" />
                    ) : (
                        <Unlock size={14} className="text-slate-400" />
                    )}
                </button>

                {/* Color indicator */}
                <div
                    className="w-4 h-4 rounded border border-slate-600"
                    style={{ backgroundColor: layer.color }}
                    title={`Layer color: ${layer.color}`}
                />

                {/* Layer name and info */}
                <div
                    className="flex-1 cursor-pointer"
                    onClick={onSetActive}
                >
                    <div className="text-sm text-white font-medium">{layer.name}</div>
                    <div className="text-xs text-slate-400">
                        {stats?.elementCount || 0} items
                    </div>
                </div>

                {/* Opacity control */}
                <button
                    onClick={() => setShowOpacity(!showOpacity)}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded"
                    title="Adjust opacity"
                >
                    {Math.round(layer.opacity * 100)}%
                </button>
            </div>

            {/* Opacity slider */}
            {showOpacity && (
                <div className="px-4 pb-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={layer.opacity * 100}
                        onChange={(e) => onSetOpacity(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            )}
        </div>
    );
}

/**
 * Compact layer switcher for toolbar
 */
interface LayerSwitcherProps {
    layerManager: LayerManager;
    onLayerChange?: () => void;
}

export function LayerSwitcher({ layerManager, onLayerChange }: LayerSwitcherProps) {
    const activeLayer = layerManager.getActiveLayer();
    const layers = layerManager.getAllLayers();

    const handleChange = (layerId: string) => {
        layerManager.setActiveLayer(layerId);
        onLayerChange?.();
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Layer:</span>
            <select
                value={activeLayer?.id || ''}
                onChange={(e) => handleChange(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            >
                {layers.map(layer => (
                    <option key={layer.id} value={layer.id}>
                        {layer.name}
                    </option>
                ))}
            </select>

            {/* Color indicator */}
            {activeLayer && (
                <div
                    className="w-4 h-4 rounded border border-slate-600"
                    style={{ backgroundColor: activeLayer.color }}
                />
            )}
        </div>
    );
}

/**
 * Layer visibility quick toggles
 */
interface LayerTogglesProps {
    layerManager: LayerManager;
    onLayerChange?: () => void;
}

export function LayerToggles({ layerManager, onLayerChange }: LayerTogglesProps) {
    const layers = layerManager.getAllLayers();

    const toggleVisibility = (layerId: string) => {
        layerManager.toggleVisibility(layerId);
        onLayerChange?.();
    };

    return (
        <div className="flex flex-wrap gap-1">
            {layers.map(layer => (
                <button
                    key={layer.id}
                    onClick={() => toggleVisibility(layer.id)}
                    className={`
            px-2 py-1 text-xs rounded border transition-all
            ${layer.visible
                            ? 'bg-slate-700 border-slate-600 text-white'
                            : 'bg-slate-800/50 border-slate-700 text-slate-500'
                        }
          `}
                    style={{
                        borderLeftColor: layer.visible ? layer.color : undefined,
                        borderLeftWidth: layer.visible ? '3px' : undefined
                    }}
                >
                    {layer.name}
                </button>
            ))}
        </div>
    );
}
