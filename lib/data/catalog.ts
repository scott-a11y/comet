export type EquipmentCategory = "MACHINERY" | "BENCH" | "STORAGE" | "DUST";

export interface CatalogItem {
  id: string; // unique slug, e.g., 'table-saw-cabinet'
  name: string;
  category: EquipmentCategory;
  width: number; // in feet
  length: number; // in feet
  color?: string; // Hex override
  defaults?: Record<string, unknown>; // e.g., { voltage: 220 }
  /**
   * Optional ports for MEP routing. Offsets are in feet relative to the equipment
   * footprint top-left.
   */
  ports?: Array<{ id: string; label?: string; system: "ELECTRICAL" | "AIR" | "DUCT" | "DUST" | "PIPING"; offsetX: number; offsetY: number }>;
}

export const EQUIPMENT_CATALOG: CatalogItem[] = [
  // MACHINERY
  {
    id: "table-saw-cabinet",
    name: "Table Saw (Cabinet)",
    category: "MACHINERY",
    width: 3,
    length: 3,
    color: "#dc2626", // red
    defaults: { voltage: 220, phase: 1, powerKw: 3 },
    ports: [
      { id: "power", label: "Power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 },
      { id: "dust", label: "Dust", system: "DUST", offsetX: 2.9, offsetY: 1.5 },
    ]
  },
  {
    id: "jointer-8",
    name: "Jointer (8\")",
    category: "MACHINERY",
    width: 2,
    length: 6,
    color: "#ea580c", // orange
    defaults: { voltage: 220, phase: 1, powerKw: 2 },
    ports: [
      { id: "power", label: "Power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 },
      { id: "dust", label: "Dust", system: "DUST", offsetX: 1.9, offsetY: 3 },
    ]
  },
  {
    id: "planer-20",
    name: "Planer (20\")",
    category: "MACHINERY",
    width: 3,
    length: 3,
    color: "#ca8a04", // yellow
    defaults: { voltage: 220, phase: 3, powerKw: 5 },
    ports: [
      { id: "power", label: "Power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 },
      { id: "dust", label: "Dust", system: "DUST", offsetX: 2.9, offsetY: 1.5 },
    ]
  },
  {
    id: "band-saw-14",
    name: "Band Saw (14\")",
    category: "MACHINERY",
    width: 2.5,
    length: 3,
    color: "#16a34a", // green
    defaults: { voltage: 110, phase: 1, powerKw: 1.5 },
    ports: [
      { id: "power", label: "Power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 },
      { id: "dust", label: "Dust", system: "DUST", offsetX: 2.4, offsetY: 1.5 },
    ]
  },
  {
    id: "drill-press",
    name: "Drill Press",
    category: "MACHINERY",
    width: 1.5,
    length: 2,
    color: "#0891b2", // cyan
    defaults: { voltage: 110, phase: 1, powerKw: 1 },
    ports: [
      { id: "power", label: "Power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 },
    ]
  },

  // BENCH
  {
    id: "workbench-6ft",
    name: "Workbench (6ft)",
    category: "BENCH",
    width: 3,
    length: 6,
    color: "#7c3aed", // violet
    defaults: { height: 36 }
  },
  {
    id: "assembly-table",
    name: "Assembly Table",
    category: "BENCH",
    width: 4,
    length: 8,
    color: "#be185d", // pink
    defaults: { height: 30 }
  },

  // STORAGE
  {
    id: "lumber-rack-8ft",
    name: "Lumber Rack (8ft)",
    category: "STORAGE",
    width: 2,
    length: 8,
    color: "#92400e", // amber
    defaults: { shelves: 5, capacity: "2000 lbs" }
  },
  {
    id: "tool-cabinet",
    name: "Tool Cabinet",
    category: "STORAGE",
    width: 2,
    length: 2,
    color: "#374151", // gray
    defaults: { drawers: 6 }
  },

  // DUST
  {
    id: "dust-collector-cyclone",
    name: "Dust Collector (Cyclone)",
    category: "DUST",
    width: 2.5,
    length: 2.5,
    color: "#1e40af", // blue
    defaults: { cfm: 1200, hp: 3 },
    ports: [
      { id: "power", label: "Power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 },
      { id: "duct", label: "Main", system: "DUST", offsetX: 2.4, offsetY: 1.25 },
    ]
  },
  {
    id: "downdraft-table",
    name: "Downdraft Table",
    category: "DUST",
    width: 4,
    length: 4,
    color: "#0c4a6e", // slate
    defaults: { cfm: 800 }
  }
];

export const CATEGORIES: { value: EquipmentCategory | "ALL"; label: string; icon: string }[] = [
  { value: "ALL", label: "All", icon: "🛠️" },
  { value: "MACHINERY", label: "Machinery", icon: "⚙️" },
  { value: "BENCH", label: "Benches", icon: "🪑" },
  { value: "STORAGE", label: "Storage", icon: "📦" },
  { value: "DUST", label: "Dust Control", icon: "💨" }
];