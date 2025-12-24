import { create } from 'zustand';
import { CanvasItem } from '@/lib/validations/layout';

interface LayoutState {
  items: CanvasItem[];
  selectedId: string | null;
  stage: {
    scale: number;
    x: number;
    y: number;
  };
  setItems: (items: CanvasItem[]) => void;
  addItem: (item: CanvasItem) => void;
  updateItem: (id: string, updates: Partial<CanvasItem>) => void;
  selectItem: (id: string | null) => void;
  setStage: (stage: Partial<LayoutState['stage']>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
}

// Snap-to-grid helper function
export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const useLayoutStore = create<LayoutState>((set, get) => ({
  items: [],
  selectedId: null,
  stage: {
    scale: 1,
    x: 0,
    y: 0,
  },

  setItems: (items) => set({ items }),

  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    selectedId: item.id,
  })),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),

  selectItem: (id) => set({ selectedId: id }),

  setStage: (stageUpdate) => set((state) => ({
    stage: { ...state.stage, ...stageUpdate },
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
  })),

  duplicateItem: (id) => set((state) => {
    const itemToDuplicate = state.items.find((item) => item.id === id);
    if (!itemToDuplicate) return state;

    const duplicatedItem: CanvasItem = {
      ...itemToDuplicate,
      id: `${itemToDuplicate.type.toLowerCase()}-${Date.now()}`,
      x: itemToDuplicate.x + 20, // Offset by 20px
      y: itemToDuplicate.y + 20,
    };

    return {
      items: [...state.items, duplicatedItem],
      selectedId: duplicatedItem.id,
    };
  }),
}));
