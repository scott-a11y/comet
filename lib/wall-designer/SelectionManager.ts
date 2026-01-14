/**
 * Advanced Selection System for Wall Designer
 * Provides multiple selection modes and bulk operations
 */

export type SelectionMode =
    | 'single'      // Click to select one
    | 'box'         // Drag box to select multiple
    | 'lasso'       // Draw freeform selection
    | 'magic-wand'  // Select similar elements
    | 'paint';      // Brush to select

import { Point, Bounds } from './types';

export interface SelectableElement {
    id: string;
    type: string;
    bounds: Bounds;
    category?: string;
    layerId?: string;
}

export interface SelectionOptions {
    mode: SelectionMode;
    additive: boolean; // Hold Shift to add to selection
    subtractive: boolean; // Hold Alt to remove from selection
    brushSize: number; // For paint mode
}

export const DEFAULT_SELECTION_OPTIONS: SelectionOptions = {
    mode: 'single',
    additive: false,
    subtractive: false,
    brushSize: 20
};

export class SelectionManager {
    private selectedIds: Set<string> = new Set();
    private options: SelectionOptions;
    private selectionPath: Point[] = []; // For lasso/paint modes

    constructor(options: Partial<SelectionOptions> = {}) {
        this.options = { ...DEFAULT_SELECTION_OPTIONS, ...options };
    }

    /**
     * Single click selection
     */
    selectSingle(
        elementId: string,
        additive: boolean = false,
        subtractive: boolean = false
    ): void {
        if (subtractive) {
            this.selectedIds.delete(elementId);
        } else if (additive) {
            this.selectedIds.add(elementId);
        } else {
            this.selectedIds.clear();
            this.selectedIds.add(elementId);
        }
    }

    /**
     * Box selection - select all elements within or intersecting box
     */
    selectBox(
        start: Point,
        end: Point,
        elements: SelectableElement[],
        mode: 'intersect' | 'contain' = 'intersect',
        additive: boolean = false
    ): string[] {
        const box = this.createBox(start, end);
        const selected: string[] = [];

        elements.forEach(element => {
            const intersects = mode === 'intersect'
                ? this.boxIntersects(box, element.bounds)
                : this.boxContains(box, element.bounds);

            if (intersects) {
                selected.push(element.id);
            }
        });

        if (!additive) {
            this.selectedIds.clear();
        }

        selected.forEach(id => this.selectedIds.add(id));
        return selected;
    }

    /**
     * Lasso selection - freeform polygon selection
     */
    selectLasso(
        path: Point[],
        elements: SelectableElement[],
        additive: boolean = false
    ): string[] {
        const selected: string[] = [];

        elements.forEach(element => {
            const center = {
                x: element.bounds.x + element.bounds.width / 2,
                y: element.bounds.y + element.bounds.height / 2
            };

            if (this.pointInPolygon(center, path)) {
                selected.push(element.id);
            }
        });

        if (!additive) {
            this.selectedIds.clear();
        }

        selected.forEach(id => this.selectedIds.add(id));
        return selected;
    }

    /**
     * Magic wand - select all similar elements
     */
    selectSimilar(
        referenceElement: SelectableElement,
        elements: SelectableElement[],
        criteria: 'type' | 'category' | 'layer' = 'type',
        additive: boolean = false
    ): string[] {
        const selected: string[] = [];

        elements.forEach(element => {
            let matches = false;

            switch (criteria) {
                case 'type':
                    matches = element.type === referenceElement.type;
                    break;
                case 'category':
                    matches = element.category === referenceElement.category;
                    break;
                case 'layer':
                    matches = element.layerId === referenceElement.layerId;
                    break;
            }

            if (matches) {
                selected.push(element.id);
            }
        });

        if (!additive) {
            this.selectedIds.clear();
        }

        selected.forEach(id => this.selectedIds.add(id));
        return selected;
    }

    /**
     * Paint selection - brush to select
     */
    selectPaint(
        path: Point[],
        elements: SelectableElement[],
        brushSize: number = this.options.brushSize,
        additive: boolean = true
    ): string[] {
        const selected: string[] = [];

        path.forEach(point => {
            elements.forEach(element => {
                const center = {
                    x: element.bounds.x + element.bounds.width / 2,
                    y: element.bounds.y + element.bounds.height / 2
                };

                const distance = this.calculateDistance(point, center);
                if (distance <= brushSize && !this.selectedIds.has(element.id)) {
                    selected.push(element.id);
                }
            });
        });

        if (!additive) {
            this.selectedIds.clear();
        }

        selected.forEach(id => this.selectedIds.add(id));
        return selected;
    }

    /**
     * Select all elements
     */
    selectAll(elements: SelectableElement[]): void {
        this.selectedIds.clear();
        elements.forEach(element => this.selectedIds.add(element.id));
    }

    /**
     * Deselect all
     */
    deselectAll(): void {
        this.selectedIds.clear();
    }

    /**
     * Invert selection
     */
    invertSelection(elements: SelectableElement[]): void {
        const newSelection = new Set<string>();

        elements.forEach(element => {
            if (!this.selectedIds.has(element.id)) {
                newSelection.add(element.id);
            }
        });

        this.selectedIds = newSelection;
    }

    /**
     * Get selected element IDs
     */
    getSelection(): string[] {
        return Array.from(this.selectedIds);
    }

    /**
     * Get selection count
     */
    getSelectionCount(): number {
        return this.selectedIds.size;
    }

    /**
     * Check if element is selected
     */
    isSelected(elementId: string): boolean {
        return this.selectedIds.has(elementId);
    }

    /**
     * Get selection bounds (bounding box of all selected elements)
     */
    getSelectionBounds(elements: SelectableElement[]): Bounds | null {
        const selected = elements.filter(el => this.selectedIds.has(el.id));
        if (selected.length === 0) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        selected.forEach(element => {
            minX = Math.min(minX, element.bounds.x);
            minY = Math.min(minY, element.bounds.y);
            maxX = Math.max(maxX, element.bounds.x + element.bounds.width);
            maxY = Math.max(maxY, element.bounds.y + element.bounds.height);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    // Helper methods

    private createBox(start: Point, end: Point): Bounds {
        return {
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y)
        };
    }

    private boxIntersects(box1: Bounds, box2: Bounds): boolean {
        return !(
            box1.x + box1.width < box2.x ||
            box2.x + box2.width < box1.x ||
            box1.y + box1.height < box2.y ||
            box2.y + box2.height < box1.y
        );
    }

    private boxContains(box: Bounds, target: Bounds): boolean {
        return (
            box.x <= target.x &&
            box.y <= target.y &&
            box.x + box.width >= target.x + target.width &&
            box.y + box.height >= target.y + target.height
        );
    }

    private pointInPolygon(point: Point, polygon: Point[]): boolean {
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    private calculateDistance(p1: Point, p2: Point): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Update selection options
     */
    updateOptions(options: Partial<SelectionOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Get current options
     */
    getOptions(): SelectionOptions {
        return { ...this.options };
    }
}

/**
 * Bulk operations on selected elements
 */
export class BulkOperations {
    /**
     * Align selected elements
     */
    static align(
        elements: SelectableElement[],
        selectedIds: string[],
        alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
    ): Map<string, Point> {
        const selected = elements.filter(el => selectedIds.includes(el.id));
        if (selected.length === 0) return new Map();

        // Calculate bounds
        const bounds = this.calculateBounds(selected);
        const newPositions = new Map<string, Point>();

        selected.forEach(element => {
            let newX = element.bounds.x;
            let newY = element.bounds.y;

            switch (alignment) {
                case 'left':
                    newX = bounds.x;
                    break;
                case 'center':
                    newX = bounds.x + (bounds.width - element.bounds.width) / 2;
                    break;
                case 'right':
                    newX = bounds.x + bounds.width - element.bounds.width;
                    break;
                case 'top':
                    newY = bounds.y;
                    break;
                case 'middle':
                    newY = bounds.y + (bounds.height - element.bounds.height) / 2;
                    break;
                case 'bottom':
                    newY = bounds.y + bounds.height - element.bounds.height;
                    break;
            }

            newPositions.set(element.id, { x: newX, y: newY });
        });

        return newPositions;
    }

    /**
     * Distribute selected elements evenly
     */
    static distribute(
        elements: SelectableElement[],
        selectedIds: string[],
        direction: 'horizontal' | 'vertical'
    ): Map<string, Point> {
        const selected = elements.filter(el => selectedIds.includes(el.id));
        if (selected.length < 3) return new Map(); // Need at least 3 elements

        // Sort by position
        const sorted = [...selected].sort((a, b) => {
            return direction === 'horizontal'
                ? a.bounds.x - b.bounds.x
                : a.bounds.y - b.bounds.y;
        });

        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const totalSpace = direction === 'horizontal'
            ? (last.bounds.x + last.bounds.width) - first.bounds.x
            : (last.bounds.y + last.bounds.height) - first.bounds.y;

        const totalElementSize = sorted.reduce((sum, el) => {
            return sum + (direction === 'horizontal' ? el.bounds.width : el.bounds.height);
        }, 0);

        const spacing = (totalSpace - totalElementSize) / (sorted.length - 1);
        const newPositions = new Map<string, Point>();

        let currentPos = direction === 'horizontal' ? first.bounds.x : first.bounds.y;

        sorted.forEach((element, index) => {
            if (index === 0 || index === sorted.length - 1) {
                // Keep first and last in place
                return;
            }

            const size = direction === 'horizontal' ? element.bounds.width : element.bounds.height;
            currentPos += size + spacing;

            newPositions.set(element.id, {
                x: direction === 'horizontal' ? currentPos - size : element.bounds.x,
                y: direction === 'vertical' ? currentPos - size : element.bounds.y
            });
        });

        return newPositions;
    }

    /**
     * Group selected elements (returns group ID)
     */
    static group(selectedIds: string[]): string {
        return `group-${Date.now()}`;
    }

    /**
     * Calculate bounds of multiple elements
     */
    private static calculateBounds(elements: SelectableElement[]): Bounds {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        elements.forEach(element => {
            minX = Math.min(minX, element.bounds.x);
            minY = Math.min(minY, element.bounds.y);
            maxX = Math.max(maxX, element.bounds.x + element.bounds.width);
            maxY = Math.max(maxY, element.bounds.y + element.bounds.height);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}
