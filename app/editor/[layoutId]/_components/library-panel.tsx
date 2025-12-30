"use client";

import { useState, useMemo } from "react";
import { useLayoutStore } from "@/lib/store/layout-store";
import { EQUIPMENT_CATALOG, CATEGORIES, type CatalogItem, type EquipmentCategory } from "@/lib/data/catalog";

const SCALE_FACTOR = 10; // pixels per foot (editor canvas convention)

export function LibraryPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | "ALL">("ALL");
  const addItem = useLayoutStore((state) => state.addItem);

  const filteredItems = useMemo(() => {
    return EQUIPMENT_CATALOG.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleAddItem = (item: CatalogItem) => {
    addItem({
      id: crypto.randomUUID(),
      type: "EQUIPMENT",
      x: 10 * SCALE_FACTOR,
      y: 10 * SCALE_FACTOR,
      width: item.width * SCALE_FACTOR,
      length: item.length * SCALE_FACTOR,
      rotation: 0,
      metadata: {
        ...item.defaults,
        catalogId: item.id,
        catalogColor: item.color,
        // Persist ports in px for simple rendering/routing.
        ports: (item.ports ?? []).map((p) => ({
          ...p,
          offsetX: p.offsetX * SCALE_FACTOR,
          offsetY: p.offsetY * SCALE_FACTOR,
        }))
      }
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-white font-semibold mb-4">Equipment Library</h2>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedCategory === category.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No equipment found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors cursor-pointer group"
              onClick={() => handleAddItem(item)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium text-sm">{item.name}</h3>
                <div
                  className="w-4 h-4 rounded border-2 border-white/20"
                  style={{ backgroundColor: item.color }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>{item.category}</span>
                <span>{item.width}' × {item.length}'</span>
              </div>

              <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Add to Layout
              </button>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="text-xs text-slate-500 border-t border-slate-600 pt-3">
        Showing {filteredItems.length} of {EQUIPMENT_CATALOG.length} items
      </div>
    </div>
  );
}