'use server'

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BuildingFloorGeometry, BuildingWallSegment, BuildingVertex, Component, SystemRun } from "@/lib/types/building-geometry";

// Zod Schema for Wall/Segment updates
const WallSegmentSchema = z.object({
    id: z.string(),
    buildingId: z.number(),
    a: z.string(), // vertex ID
    b: z.string(), // vertex ID
    thickness: z.number().optional(),
    material: z.enum(['brick', 'concrete', 'drywall', 'wood', 'steel', 'glass']).optional(),
});

const VertexSchema = z.object({
    id: z.string(),
    buildingId: z.number(),
    x: z.number(),
    y: z.number(),
});

/**
 * Parse floor geometry from Prisma JSON with type safety
 */
function parseFloorGeometry(json: unknown): BuildingFloorGeometry | null {
    if (!json || typeof json !== 'object') return null;
    const geo = json as Record<string, unknown>;

    // Ensure minimum structure
    return {
        version: 1 as const,
        vertices: (geo.vertices as BuildingVertex[]) || [],
        segments: (geo.segments as BuildingWallSegment[]) || [],
        openings: geo.openings as BuildingFloorGeometry['openings'],
        electricalEntries: geo.electricalEntries as BuildingFloorGeometry['electricalEntries'],
        components: (geo.components as Component[]) || [],
        systemRuns: (geo.systemRuns as SystemRun[]) || [],
        layerVisibility: geo.layerVisibility as BuildingFloorGeometry['layerVisibility'],
        ringVertexIds: geo.ringVertexIds as string[],
    };
}

/**
 * Update a wall segment with optimistic UI support
 */
export async function updateWallSegmentAction(rawInput: unknown) {
    const parsed = WallSegmentSchema.safeParse(rawInput);

    if (!parsed.success) {
        return { success: false, error: "Invalid wall segment data" };
    }

    const segment = parsed.data;

    try {
        const building = await prisma.shopBuilding.findUnique({
            where: { id: segment.buildingId },
            select: { floorGeometry: true }
        });

        if (!building) {
            return { success: false, error: "Building not found" };
        }

        const geometry = parseFloorGeometry(building.floorGeometry);
        if (!geometry) {
            return { success: false, error: "No floor geometry" };
        }

        const segmentIndex = geometry.segments.findIndex(s => s.id === segment.id);
        if (segmentIndex !== -1) {
            geometry.segments[segmentIndex] = {
                ...geometry.segments[segmentIndex],
                ...segment
            };

            await prisma.shopBuilding.update({
                where: { id: segment.buildingId },
                data: { floorGeometry: geometry as object }
            });
        }

        revalidatePath(`/buildings/${segment.buildingId}`);

        return { success: true, data: segment };

    } catch (error) {
        console.error('Wall segment update error:', error);
        return { success: false, error: "Database update failed" };
    }
}

/**
 * Update a vertex position with optimistic UI support
 */
export async function updateVertexAction(rawInput: unknown) {
    const parsed = VertexSchema.safeParse(rawInput);

    if (!parsed.success) {
        return { success: false, error: "Invalid vertex data" };
    }

    const vertex = parsed.data;

    try {
        const building = await prisma.shopBuilding.findUnique({
            where: { id: vertex.buildingId },
            select: { floorGeometry: true }
        });

        if (!building) {
            return { success: false, error: "Building not found" };
        }

        const geometry = parseFloorGeometry(building.floorGeometry);
        if (!geometry) {
            return { success: false, error: "No floor geometry" };
        }

        const vertexIndex = geometry.vertices.findIndex(v => v.id === vertex.id);
        if (vertexIndex !== -1) {
            geometry.vertices[vertexIndex] = {
                ...geometry.vertices[vertexIndex],
                x: vertex.x,
                y: vertex.y
            };

            await prisma.shopBuilding.update({
                where: { id: vertex.buildingId },
                data: { floorGeometry: geometry as object }
            });
        }

        revalidatePath(`/buildings/${vertex.buildingId}`);

        return { success: true, data: vertex };

    } catch (error) {
        console.error('Vertex update error:', error);
        return { success: false, error: "Database update failed" };
    }
}

/**
 * Update equipment placement with optimistic UI support
 */
const EquipmentPlacementSchema = z.object({
    id: z.string(),
    buildingId: z.number(),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    depth: z.number(),
    rotation: z.number().default(0),
});

export async function updateEquipmentPlacementAction(rawInput: unknown) {
    const parsed = EquipmentPlacementSchema.safeParse(rawInput);

    if (!parsed.success) {
        return { success: false, error: "Invalid equipment data" };
    }

    const equipment = parsed.data;

    try {
        const building = await prisma.shopBuilding.findUnique({
            where: { id: equipment.buildingId },
            select: { floorGeometry: true }
        });

        if (!building) {
            return { success: false, error: "Building not found" };
        }

        const geometry = parseFloorGeometry(building.floorGeometry);
        if (!geometry) {
            return { success: false, error: "No floor geometry" };
        }

        // Create component from equipment data
        const component: Component = {
            id: equipment.id,
            category: 'equipment',
            name: equipment.name,
            x: equipment.x,
            y: equipment.y,
            width: equipment.width,
            depth: equipment.depth,
            rotation: equipment.rotation,
        };

        const eqIndex = geometry.components?.findIndex(e => e.id === equipment.id) ?? -1;
        if (eqIndex !== -1 && geometry.components) {
            geometry.components[eqIndex] = component;
        } else {
            geometry.components = [...(geometry.components || []), component];
        }

        await prisma.shopBuilding.update({
            where: { id: equipment.buildingId },
            data: { floorGeometry: geometry as object }
        });

        revalidatePath(`/buildings/${equipment.buildingId}`);

        return { success: true, data: equipment };

    } catch (error) {
        console.error('Equipment placement update error:', error);
        return { success: false, error: "Database update failed" };
    }
}

/**
 * Update system run (duct, pipe, electrical) with optimistic UI support
 */
const SystemRunSchema = z.object({
    id: z.string(),
    buildingId: z.number(),
    type: z.enum(['DUST', 'AIR', 'ELECTRICAL']),
    points: z.array(z.object({ x: z.number(), y: z.number() })),
    diameter: z.number().optional(),
});

export async function updateSystemRunAction(rawInput: unknown) {
    const parsed = SystemRunSchema.safeParse(rawInput);

    if (!parsed.success) {
        return { success: false, error: "Invalid system run data" };
    }

    const run = parsed.data;

    try {
        const building = await prisma.shopBuilding.findUnique({
            where: { id: run.buildingId },
            select: { floorGeometry: true }
        });

        if (!building) {
            return { success: false, error: "Building not found" };
        }

        const geometry = parseFloorGeometry(building.floorGeometry);
        if (!geometry) {
            return { success: false, error: "No floor geometry" };
        }

        // Map action type to SystemRun type
        const systemRunType = run.type === 'DUST' ? 'DUST_COLLECTION'
            : run.type === 'AIR' ? 'COMPRESSED_AIR'
                : 'ELECTRICAL';

        const systemRun: SystemRun = {
            id: run.id,
            type: systemRunType,
            points: run.points,
            diameter: run.diameter,
        };

        const runIndex = geometry.systemRuns?.findIndex(r => r.id === run.id) ?? -1;
        if (runIndex !== -1 && geometry.systemRuns) {
            geometry.systemRuns[runIndex] = systemRun;
        } else {
            geometry.systemRuns = [...(geometry.systemRuns || []), systemRun];
        }

        await prisma.shopBuilding.update({
            where: { id: run.buildingId },
            data: { floorGeometry: geometry as object }
        });

        revalidatePath(`/buildings/${run.buildingId}`);

        return { success: true, data: run };

    } catch (error) {
        console.error('System run update error:', error);
        return { success: false, error: "Database update failed" };
    }
}
