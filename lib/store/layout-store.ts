import { create } from 'zustand';
import { CanvasItem, Run, LayoutPlanV2, normalizeLayoutPlan } from '@/lib/validations/layout';

interface LayoutState {
  items: CanvasItem[];
  runs: Run[];
  ftPerPx: number | null;
  selectedId: string | null;
  selectedRunId: string | null;
  stage: {
    scale: number;
    x: number;
    y: number;
  };
  setPlan: (plan: unknown) => void;
  getPlan: () => LayoutPlanV2;
  setItems: (items: CanvasItem[]) => void;
  addItem: (item: CanvasItem) => void;
  updateItem: (id: string, updates: Partial<CanvasItem>) => void;
  selectItem: (id: string | null) => void;
  selectRun: (id: string | null) => void;
  setStage: (stage: Partial<LayoutState['stage']>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  addRun: (run: Run) => void;
  updateRun: (id: string, updates: Partial<Run>) => void;
  removeRun: (id: string) => void;
}

// Snap-to-grid helper function
export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const useLayoutStore = create<LayoutState>((set, get) => ({
  items: [],
  runs: [],
  ftPerPx: null,
  selectedId: null,
  selectedRunId: null,
  stage: {
    scale: 1,
    x: 0,
    y: 0,
  },

  setPlan: (planLike) => {
    const plan = normalizeLayoutPlan(planLike);
    set({ items: plan.items, runs: plan.runs, ftPerPx: plan.ftPerPx });
  },

  getPlan: () => ({
    version: 2,
    items: get().items,
    runs: get().runs,
    ftPerPx: get().ftPerPx,
  }),

  setItems: (items) => set({ items }),

  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    selectedId: item.id,
    selectedRunId: null,
  })),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),

  selectItem: (id) => set({ selectedId: id, selectedRunId: null }),

  selectRun: (id) => set({ selectedRunId: id, selectedId: null }),

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
      selectedRunId: null,
    };
  }),

  addRun: (run) => set((state) => ({
    runs: [...state.runs, run],
    selectedRunId: run.id,
    selectedId: null,
  })),

  updateRun: (id, updates) => set((state) => ({
    runs: state.runs.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  })),

  removeRun: (id) => set((state) => ({
    runs: state.runs.filter((r) => r.id !== id),
    selectedRunId: state.selectedRunId === id ? null : state.selectedRunId,
  })),
}));