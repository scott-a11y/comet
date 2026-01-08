import { prisma } from "@/lib/prisma";
import { AnalysisData } from "@/lib/validations/analysis";

/**
 * Converts AI Analysis data into a persisted LayoutInstance
 */
export async function createLayoutFromAnalysis(
    buildingId: number,
    data: AnalysisData
) {
    // 1. Create the layout record
    const layout = await prisma.layoutInstance.create({
        data: {
            shopBuildingId: buildingId,
            name: `AI Generated - ${new Date().toLocaleDateString()}`,
        }
    });

    // 2. Map detected equipment to actual equipment catalog
    if (data.detectedEquipment) {
        for (const detected of data.detectedEquipment) {
            // Find best match in catalog (Fuzzy search or category match)
            const match = await prisma.equipment.findFirst({
                where: {
                    OR: [
                        { category: { contains: detected.type, mode: 'insensitive' } },
                        { name: { contains: detected.type, mode: 'insensitive' } }
                    ]
                }
            });

            if (match) {
                // Calculate position based on normalized building coordinates
                const x = detected.position.x * data.width;
                const y = detected.position.y * data.length;

                await prisma.equipmentLayoutPosition.create({
                    data: {
                        layoutId: layout.id,
                        equipmentId: match.id,
                        x: x,
                        y: y,
                        orientation: 0
                    }
                });
            }
        }
    }

    return layout;
}
