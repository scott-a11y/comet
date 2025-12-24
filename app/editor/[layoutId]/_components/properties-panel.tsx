"use client";

import { useLayoutStore } from "@/lib/store/layout-store";

export function PropertiesPanel() {
  const { items, selectedId, updateItem, removeItem, duplicateItem } = useLayoutStore();

  const selectedItem = items.find((item) => item.id === selectedId);

  if (!selectedItem) {
    return (
      <div className="p-4 text-center text-slate-400">
        <p>Select an item to edit its properties</p>
      </div>
    );
  }

  const handleUpdate = (field: keyof typeof selectedItem, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue) || typeof value === 'string') {
      updateItem(selectedItem.id, { [field]: numValue });
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete this ${selectedItem.type.toLowerCase()}?`)) {
      removeItem(selectedItem.id);
    }
  };

  const handleDuplicate = () => {
    duplicateItem(selectedItem.id);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Properties</h3>
        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
          {selectedItem.type}
        </span>
      </div>

      {/* Name/Label */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Label
        </label>
        <input
          type="text"
          value={selectedItem.id}
          onChange={(e) => {
            // For MVP, we'll just show the ID as label
            // In future, we could add a name field to CanvasItem
          }}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          placeholder="Item label"
        />
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            X Position (ft)
          </label>
          <input
            type="number"
            value={(selectedItem.x / 10).toFixed(1)} // Convert px to feet
            onChange={(e) => handleUpdate('x', parseFloat(e.target.value) * 10)}
            step="0.1"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Y Position (ft)
          </label>
          <input
            type="number"
            value={(selectedItem.y / 10).toFixed(1)} // Convert px to feet
            onChange={(e) => handleUpdate('y', parseFloat(e.target.value) * 10)}
            step="0.1"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          />
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Width (ft)
          </label>
          <input
            type="number"
            value={(selectedItem.width / 10).toFixed(1)} // Convert px to feet
            onChange={(e) => handleUpdate('width', parseFloat(e.target.value) * 10)}
            step="0.1"
            min="0.1"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Length (ft)
          </label>
          <input
            type="number"
            value={(selectedItem.length / 10).toFixed(1)} // Convert px to feet
            onChange={(e) => handleUpdate('length', parseFloat(e.target.value) * 10)}
            step="0.1"
            min="0.1"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          />
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Rotation (°)
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="360"
            value={selectedItem.rotation}
            onChange={(e) => handleUpdate('rotation', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            value={Math.round(selectedItem.rotation)}
            onChange={(e) => handleUpdate('rotation', parseInt(e.target.value))}
            min="0"
            max="360"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          />
        </div>
      </div>

      {/* Metadata (if applicable) */}
      {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Properties
          </label>
          <div className="space-y-2">
            {Object.entries(selectedItem.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="text-white">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2 pt-4 border-t border-slate-600">
        <button
          onClick={handleDuplicate}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          Duplicate
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
