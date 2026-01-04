/**
 * Layer Management System for Wall Designer
 * Organize design elements by layer with visibility, locking, and styling
 */

export type LayerType =
    | 'walls'
    | 'equipment'
    | 'dust'
    | 'air'
    | 'electrical'
    | 'dimensions'
    | 'notes'
    | 'grid';

export interface Layer {
    id: string;
    name: string;
    type: LayerType;
    visible: boolean;
    locked: boolean;
    color: string;
    opacity: number;
    order: number; // Z-index
    elementIds: Set<string>; // IDs of elements in this layer
}

export const DEFAULT_LAYERS: Omit<Layer, 'id' | 'elementIds'>[] = [
    {
        name: 'Grid',
        type: 'grid',
        visible: true,
        locked: true,
        color: '#475569',
        opacity: 0.3,
        order: 0
    },
    {
        name: 'Walls',
        type: 'walls',
        visible: true,
        locked: false,
        color: '#94a3b8',
        opacity: 1,
        order: 1
    },
    {
        name: 'Equipment',
        type: 'equipment',
        visible: true,
        locked: false,
        color: '#8b5cf6',
        opacity: 1,
        order: 2
    },
    {
        name: 'Dust Collection',
        type: 'dust',
        visible: true,
        locked: false,
        color: '#64748b',
        opacity: 0.8,
        order: 3
    },
    {
        name: 'Compressed Air',
        type: 'air',
        visible: true,
        locked: false,
        color: '#3b82f6',
        opacity: 0.8,
        order: 4
    },
    {
        name: 'Electrical',
        type: 'electrical',
        visible: true,
        locked: false,
        color: '#eab308',
        opacity: 0.8,
        order: 5
    },
    {
        name: 'Dimensions',
        type: 'dimensions',
        visible: true,
        locked: false,
        color: '#22c55e',
        opacity: 1,
        order: 6
    },
    {
        name: 'Notes & Labels',
        type: 'notes',
        visible: true,
        locked: false,
        color: '#f59e0b',
        opacity: 1,
        order: 7
    }
];

export class LayerManager {
    private layers: Map<string, Layer>;
    private activeLayerId: string | null = null;

    constructor(initialLayers?: Layer[]) {
        this.layers = new Map();

        if (initialLayers) {
            initialLayers.forEach(layer => this.layers.set(layer.id, layer));
        } else {
            // Create default layers
            DEFAULT_LAYERS.forEach((layerDef, index) => {
                const layer: Layer = {
                    ...layerDef,
                    id: `layer-${layerDef.type}`,
                    elementIds: new Set()
                };
                this.layers.set(layer.id, layer);

                // Set walls as active by default
                if (layerDef.type === 'walls') {
                    this.activeLayerId = layer.id;
                }
            });
        }
    }

    /**
     * Get all layers sorted by order
     */
    getAllLayers(): Layer[] {
        return Array.from(this.layers.values())
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Get layer by ID
     */
    getLayer(layerId: string): Layer | undefined {
        return this.layers.get(layerId);
    }

    /**
     * Get layer by type
     */
    getLayerByType(type: LayerType): Layer | undefined {
        return Array.from(this.layers.values())
            .find(layer => layer.type === type);
    }

    /**
     * Get active layer
     */
    getActiveLayer(): Layer | null {
        return this.activeLayerId ? this.layers.get(this.activeLayerId) || null : null;
    }

    /**
     * Set active layer
     */
    setActiveLayer(layerId: string): void {
        if (this.layers.has(layerId)) {
            this.activeLayerId = layerId;
        }
    }

    /**
     * Toggle layer visibility
     */
    toggleVisibility(layerId: string): void {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.visible = !layer.visible;
        }
    }

    /**
     * Toggle layer lock
     */
    toggleLock(layerId: string): void {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.locked = !layer.locked;
        }
    }

    /**
     * Set layer opacity
     */
    setOpacity(layerId: string, opacity: number): void {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
        }
    }

    /**
     * Set layer color
     */
    setColor(layerId: string, color: string): void {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.color = color;
        }
    }

    /**
     * Add element to layer
     */
    addElement(layerId: string, elementId: string): void {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.elementIds.add(elementId);
        }
    }

    /**
     * Remove element from layer
     */
    removeElement(layerId: string, elementId: string): void {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.elementIds.delete(elementId);
        }
    }

    /**
     * Move element to different layer
     */
    moveElement(elementId: string, fromLayerId: string, toLayerId: string): void {
        this.removeElement(fromLayerId, elementId);
        this.addElement(toLayerId, elementId);
    }

    /**
     * Get layer for element
     */
    getElementLayer(elementId: string): Layer | undefined {
        return Array.from(this.layers.values())
            .find(layer => layer.elementIds.has(elementId));
    }

    /**
     * Check if element is visible (layer visible and not locked)
     */
    isElementVisible(elementId: string): boolean {
        const layer = this.getElementLayer(elementId);
        return layer ? layer.visible : true;
    }

    /**
     * Check if element is locked (layer locked)
     */
    isElementLocked(elementId: string): boolean {
        const layer = this.getElementLayer(elementId);
        return layer ? layer.locked : false;
    }

    /**
     * Get element opacity (from layer)
     */
    getElementOpacity(elementId: string): number {
        const layer = this.getElementLayer(elementId);
        return layer ? layer.opacity : 1;
    }

    /**
     * Get element color (from layer)
     */
    getElementColor(elementId: string): string | undefined {
        const layer = this.getElementLayer(elementId);
        return layer?.color;
    }

    /**
     * Show all layers
     */
    showAll(): void {
        this.layers.forEach(layer => {
            layer.visible = true;
        });
    }

    /**
     * Hide all layers except specified
     */
    hideAllExcept(layerIds: string[]): void {
        this.layers.forEach((layer, id) => {
            layer.visible = layerIds.includes(id);
        });
    }

    /**
     * Lock all layers
     */
    lockAll(): void {
        this.layers.forEach(layer => {
            layer.locked = true;
        });
    }

    /**
     * Unlock all layers
     */
    unlockAll(): void {
        this.layers.forEach(layer => {
            layer.locked = false;
        });
    }

    /**
     * Reorder layers
     */
    reorderLayers(layerIds: string[]): void {
        layerIds.forEach((id, index) => {
            const layer = this.layers.get(id);
            if (layer) {
                layer.order = index;
            }
        });
    }

    /**
     * Create custom layer
     */
    createLayer(name: string, type: LayerType, color: string = '#ffffff'): Layer {
        const id = `layer-${Date.now()}`;
        const order = this.layers.size;

        const layer: Layer = {
            id,
            name,
            type,
            visible: true,
            locked: false,
            color,
            opacity: 1,
            order,
            elementIds: new Set()
        };

        this.layers.set(id, layer);
        return layer;
    }

    /**
     * Delete layer (moves elements to default layer)
     */
    deleteLayer(layerId: string, defaultLayerId: string): void {
        const layer = this.layers.get(layerId);
        if (!layer) return;

        // Move all elements to default layer
        const defaultLayer = this.layers.get(defaultLayerId);
        if (defaultLayer) {
            layer.elementIds.forEach(elementId => {
                defaultLayer.elementIds.add(elementId);
            });
        }

        this.layers.delete(layerId);

        // If this was active layer, set default as active
        if (this.activeLayerId === layerId) {
            this.activeLayerId = defaultLayerId;
        }
    }

    /**
     * Get layer statistics
     */
    getLayerStats(layerId: string): {
        elementCount: number;
        visible: boolean;
        locked: boolean;
    } | null {
        const layer = this.layers.get(layerId);
        if (!layer) return null;

        return {
            elementCount: layer.elementIds.size,
            visible: layer.visible,
            locked: layer.locked
        };
    }

    /**
     * Export layer configuration
     */
    exportConfig(): Layer[] {
        return this.getAllLayers().map(layer => ({
            ...layer,
            elementIds: new Set(layer.elementIds) // Clone the Set
        }));
    }

    /**
     * Import layer configuration
     */
    importConfig(layers: Layer[]): void {
        this.layers.clear();
        layers.forEach(layer => {
            this.layers.set(layer.id, {
                ...layer,
                elementIds: new Set(layer.elementIds)
            });
        });
    }
}
