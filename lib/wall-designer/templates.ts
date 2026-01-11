import type { BuildingFloorGeometry } from '@/lib/types/building-geometry';

export interface FloorPlanTemplate {
    id: string;
    name: string;
    description: string;
    category: 'basic' | 'workshop' | 'warehouse' | 'office' | 'custom';
    thumbnail?: string;
    defaultWidth: number; // feet
    defaultDepth: number; // feet
    geometry: BuildingFloorGeometry;
    tags: string[];
}

/**
 * Generate a simple rectangle template
 */
function createRectangle(width: number, depth: number): BuildingFloorGeometry {
    const vertices = [
        { id: 'v1', x: 0, y: 0 },
        { id: 'v2', x: width, y: 0 },
        { id: 'v3', x: width, y: depth },
        { id: 'v4', x: 0, y: depth },
    ];

    const segments = [
        { id: 's1', a: 'v1', b: 'v2', material: 'drywall' as const },
        { id: 's2', a: 'v2', b: 'v3', material: 'drywall' as const },
        { id: 's3', a: 'v3', b: 'v4', material: 'drywall' as const },
        { id: 's4', a: 'v4', b: 'v1', material: 'drywall' as const },
    ];

    return { version: 1, vertices, segments };
}

/**
 * Generate L-shaped template
 */
function createLShape(width: number, depth: number): BuildingFloorGeometry {
    const w1 = width * 0.6;
    const d1 = depth * 0.6;

    const vertices = [
        { id: 'v1', x: 0, y: 0 },
        { id: 'v2', x: w1, y: 0 },
        { id: 'v3', x: w1, y: depth - d1 },
        { id: 'v4', x: width, y: depth - d1 },
        { id: 'v5', x: width, y: depth },
        { id: 'v6', x: 0, y: depth },
    ];

    const segments = [
        { id: 's1', a: 'v1', b: 'v2', material: 'drywall' as const },
        { id: 's2', a: 'v2', b: 'v3', material: 'drywall' as const },
        { id: 's3', a: 'v3', b: 'v4', material: 'drywall' as const },
        { id: 's4', a: 'v4', b: 'v5', material: 'drywall' as const },
        { id: 's5', a: 'v5', b: 'v6', material: 'drywall' as const },
        { id: 's6', a: 'v6', b: 'v1', material: 'drywall' as const },
    ];

    return { version: 1, vertices, segments };
}

/**
 * Generate U-shaped template
 */
function createUShape(width: number, depth: number): BuildingFloorGeometry {
    const innerWidth = width * 0.4;
    const innerDepth = depth * 0.5;

    const vertices = [
        { id: 'v1', x: 0, y: 0 },
        { id: 'v2', x: width, y: 0 },
        { id: 'v3', x: width, y: depth },
        { id: 'v4', x: width - innerWidth, y: depth },
        { id: 'v5', x: width - innerWidth, y: innerDepth },
        { id: 'v6', x: innerWidth, y: innerDepth },
        { id: 'v7', x: innerWidth, y: depth },
        { id: 'v8', x: 0, y: depth },
    ];

    const segments = [
        { id: 's1', a: 'v1', b: 'v2', material: 'drywall' as const },
        { id: 's2', a: 'v2', b: 'v3', material: 'drywall' as const },
        { id: 's3', a: 'v3', b: 'v4', material: 'drywall' as const },
        { id: 's4', a: 'v4', b: 'v5', material: 'drywall' as const },
        { id: 's5', a: 'v5', b: 'v6', material: 'drywall' as const },
        { id: 's6', a: 'v6', b: 'v7', material: 'drywall' as const },
        { id: 's7', a: 'v7', b: 'v8', material: 'drywall' as const },
        { id: 's8', a: 'v8', b: 'v1', material: 'drywall' as const },
    ];

    return { version: 1, vertices, segments };
}

/**
 * Generate workshop with office template
 */
function createWorkshopWithOffice(width: number, depth: number): BuildingFloorGeometry {
    const officeWidth = width * 0.25;

    const vertices = [
        // Outer perimeter
        { id: 'v1', x: 0, y: 0 },
        { id: 'v2', x: width, y: 0 },
        { id: 'v3', x: width, y: depth },
        { id: 'v4', x: 0, y: depth },
        // Office partition
        { id: 'v5', x: officeWidth, y: 0 },
        { id: 'v6', x: officeWidth, y: depth },
    ];

    const segments = [
        // Outer walls
        { id: 's1', a: 'v1', b: 'v2', material: 'concrete' as const },
        { id: 's2', a: 'v2', b: 'v3', material: 'concrete' as const },
        { id: 's3', a: 'v3', b: 'v4', material: 'concrete' as const },
        { id: 's4', a: 'v4', b: 'v1', material: 'concrete' as const },
        // Office partition
        { id: 's5', a: 'v5', b: 'v6', material: 'drywall' as const },
    ];

    return { version: 1, vertices, segments };
}

/**
 * Generate warehouse with loading dock template
 */
function createWarehouseWithDock(width: number, depth: number): BuildingFloorGeometry {
    const dockDepth = depth * 0.15;
    const dockWidth = width * 0.3;
    const dockOffset = width * 0.35;

    const vertices = [
        { id: 'v1', x: 0, y: 0 },
        { id: 'v2', x: width, y: 0 },
        { id: 'v3', x: width, y: depth },
        { id: 'v4', x: dockOffset + dockWidth, y: depth },
        { id: 'v5', x: dockOffset + dockWidth, y: depth + dockDepth },
        { id: 'v6', x: dockOffset, y: depth + dockDepth },
        { id: 'v7', x: dockOffset, y: depth },
        { id: 'v8', x: 0, y: depth },
    ];

    const segments = [
        { id: 's1', a: 'v1', b: 'v2', material: 'concrete' as const },
        { id: 's2', a: 'v2', b: 'v3', material: 'concrete' as const },
        { id: 's3', a: 'v3', b: 'v4', material: 'concrete' as const },
        { id: 's4', a: 'v4', b: 'v5', material: 'concrete' as const },
        { id: 's5', a: 'v5', b: 'v6', material: 'concrete' as const },
        { id: 's6', a: 'v6', b: 'v7', material: 'concrete' as const },
        { id: 's7', a: 'v7', b: 'v8', material: 'concrete' as const },
        { id: 's8', a: 'v8', b: 'v1', material: 'concrete' as const },
    ];

    return { version: 1, vertices, segments };
}

/**
 * Predefined floor plan templates
 */
export const FLOOR_PLAN_TEMPLATES: FloorPlanTemplate[] = [
    {
        id: 'basic-rectangle',
        name: 'Simple Rectangle',
        description: 'Basic rectangular floor plan - perfect for simple shops',
        category: 'basic',
        defaultWidth: 40,
        defaultDepth: 60,
        geometry: createRectangle(40, 60),
        tags: ['simple', 'basic', 'starter'],
    },
    {
        id: 'small-shop',
        name: 'Small Shop (30×40)',
        description: 'Compact shop layout for home workshops',
        category: 'workshop',
        defaultWidth: 30,
        defaultDepth: 40,
        geometry: createRectangle(30, 40),
        tags: ['small', 'home', 'garage'],
    },
    {
        id: 'medium-shop',
        name: 'Medium Shop (40×60)',
        description: 'Standard commercial shop size',
        category: 'workshop',
        defaultWidth: 40,
        defaultDepth: 60,
        geometry: createRectangle(40, 60),
        tags: ['medium', 'commercial', 'standard'],
    },
    {
        id: 'large-shop',
        name: 'Large Shop (60×100)',
        description: 'Large industrial workshop',
        category: 'workshop',
        defaultWidth: 60,
        defaultDepth: 100,
        geometry: createRectangle(60, 100),
        tags: ['large', 'industrial', 'manufacturing'],
    },
    {
        id: 'l-shape',
        name: 'L-Shaped Layout',
        description: 'L-shaped floor plan for corner lots or multi-use spaces',
        category: 'custom',
        defaultWidth: 50,
        defaultDepth: 70,
        geometry: createLShape(50, 70),
        tags: ['l-shape', 'corner', 'multi-use'],
    },
    {
        id: 'u-shape',
        name: 'U-Shaped Layout',
        description: 'U-shaped design with central courtyard or loading area',
        category: 'custom',
        defaultWidth: 60,
        defaultDepth: 80,
        geometry: createUShape(60, 80),
        tags: ['u-shape', 'courtyard', 'loading'],
    },
    {
        id: 'workshop-office',
        name: 'Workshop with Office',
        description: 'Shop floor with dedicated office space (25% office, 75% workshop)',
        category: 'workshop',
        defaultWidth: 50,
        defaultDepth: 80,
        geometry: createWorkshopWithOffice(50, 80),
        tags: ['office', 'partition', 'mixed-use'],
    },
    {
        id: 'warehouse-dock',
        name: 'Warehouse with Loading Dock',
        description: 'Warehouse layout with integrated loading dock',
        category: 'warehouse',
        defaultWidth: 80,
        defaultDepth: 120,
        geometry: createWarehouseWithDock(80, 120),
        tags: ['warehouse', 'loading-dock', 'logistics'],
    },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: FloorPlanTemplate['category']): FloorPlanTemplate[] {
    return FLOOR_PLAN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Search templates by tag
 */
export function searchTemplatesByTag(tag: string): FloorPlanTemplate[] {
    return FLOOR_PLAN_TEMPLATES.filter((t) => t.tags.includes(tag.toLowerCase()));
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): FloorPlanTemplate | undefined {
    return FLOOR_PLAN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Scale template to custom dimensions
 */
export function scaleTemplate(
    template: FloorPlanTemplate,
    newWidth: number,
    newDepth: number
): BuildingFloorGeometry {
    const scaleX = newWidth / template.defaultWidth;
    const scaleY = newDepth / template.defaultDepth;

    const scaledVertices = template.geometry.vertices.map((v) => ({
        ...v,
        x: v.x * scaleX,
        y: v.y * scaleY,
    }));

    return {
        ...template.geometry,
        vertices: scaledVertices,
    };
}
