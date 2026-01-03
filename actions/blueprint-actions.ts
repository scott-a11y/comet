'use server'

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Zod Schema for Wall/Segment updates
const WallSegmentSchema = z.object({
    id: z.string(),
    buildingId: z.number(),
    a: z.string(), // vertex ID
    b: z.string(), // vertex ID
    thickness: z.number().optional(),
    material: z.string().optional(),
});

const VertexSchema = z.object({
    id: z.string(),
    buildingId: z.number(),
    x: z.number(),
    y: z.number(),
});

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
        // Update in database (you'll need to add a WallSegment table or store in floorGeometry JSON)
        // For now, we'll update the building's floorGeometry
        const building = await prisma.shopBuilding.findUnique({
            where: { id: segment.buildingId },
            select: { floorGeometry: true }
        });

        if (!building) {
            return { success: false, error: "Building not found" };
        }

        const geometry = building.floorGeometry as any;
        if (geometry?.segments) {
            const segmentIndex = geometry.segments.findIndex((s: any) => s.id === segment.id);
            if (segmentIndex !== -1) {
                geometry.segments[segmentIndex] = {
                    ...geometry.segments[segmentIndex],
                    ...segment
                };

                await prisma.shopBuilding.update({
                    where: { id: segment.buildingId },
                    data: { floorGeometry: geometry }
                });
            }
        }

        // Revalidate the building page
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

        const geometry = building.floorGeometry as any;
        if (geometry?.vertices) {
            const vertexIndex = geometry.vertices.findIndex((v: any) => v.id === vertex.id);
            if (vertexIndex !== -1) {
                geometry.vertices[vertexIndex] = {
                    ...geometry.vertices[vertexIndex],
                    x: vertex.x,
                    y: vertex.y
                };

                await prisma.shopBuilding.update({
                    where: { id: vertex.buildingId },
                    data: { floorGeometry: geometry }
                });
            }
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

        const geometry = building.floorGeometry as any;
        if (!geometry) {
            return { success: false, error: "No floor geometry" };
        }

        if (!geometry.equipment) {
            geometry.equipment = [];
        }

        const eqIndex = geometry.equipment.findIndex((e: any) => e.id === equipment.id);
        if (eqIndex !== -1) {
            geometry.equipment[eqIndex] = equipment;
        } else {
            geometry.equipment.push(equipment);
        }

        await prisma.shopBuilding.update({
            where: { id: equipment.buildingId },
            data: { floorGeometry: geometry }
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

        const geometry = building.floorGeometry as any;
        if (!geometry) {
            return { success: false, error: "No floor geometry" };
        }

        if (!geometry.systemRuns) {
            geometry.systemRuns = [];
        }

        const runIndex = geometry.systemRuns.findIndex((r: any) => r.id === run.id);
        if (runIndex !== -1) {
            geometry.systemRuns[runIndex] = run;
        } else {
            geometry.systemRuns.push(run);
        }

        await prisma.shopBuilding.update({
            where: { id: run.buildingId },
            data: { floorGeometry: geometry }
        });

        // TODO: Trigger background job to recalculate pressure/voltage drop
        // await client.sendEvent({
        //   name: "engineering.recalculate_zone",
        //   payload: { buildingId: run.buildingId, systemType: run.type }
        // });

        revalidatePath(`/buildings/${run.buildingId}`);

        return { success: true, data: run };

    } catch (error) {
        console.error('System run update error:', error);
        return { success: false, error: "Database update failed" };
    }
}
