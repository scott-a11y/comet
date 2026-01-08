/**
 * BOM (Bill of Materials) Engine
 * Calculates hardware requirements for shop systems.
 */

export type BOMItem = {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit: 'ft' | 'ea';
    estimatedUnitPrice: number;
    totalPrice: number;
    category: 'pipe' | 'wire' | 'conduit' | 'fitting' | 'hardware';
};

export type BOMReport = {
    items: BOMItem[];
    totalCost: number;
    wasteFactor: number;
    currency: string;
};

export interface RoutingSegment {
    id: string;
    start: [number, number, number];
    end: [number, number, number];
    type: 'electrical' | 'ducting' | 'pneumatic';
    diameter?: number; // for duct/pipe
    gauge?: string;   // for wire
}

/**
 * Calculates a BOM for a set of routing segments.
 */
export function calculateBOM(
    segments: RoutingSegment[],
    options: { wasteFactor?: number; currency?: string } = {}
): BOMReport {
    const { wasteFactor = 1.15, currency = 'USD' } = options;
    const items: BOMItem[] = [];

    // 1. Process Linear Components (Pipe/Wire)
    const linearGroups = new Map<string, { length: number; type: string; spec: string }>();

    segments.forEach(seg => {
        const length = Math.sqrt(
            Math.pow(seg.end[0] - seg.start[0], 2) +
            Math.pow(seg.end[1] - seg.start[1], 2) +
            Math.pow(seg.end[2] - seg.start[2], 2)
        );

        const spec = seg.type === 'electrical' ? seg.gauge || '12 AWG' : `${seg.diameter || 4}"`;
        const key = `${seg.type}-${spec}`;

        const existing = linearGroups.get(key) || { length: 0, type: seg.type, spec };
        linearGroups.set(key, { ...existing, length: existing.length + length });
    });

    // Convert linear groups to items
    linearGroups.forEach((group, key) => {
        const name = group.type === 'electrical' ? `${group.spec} Wire` : `${group.spec} Galvanized Duct`;
        const unitPrice = group.type === 'electrical' ? 1.5 : 8.5; // Placeholder pricing
        const quantity = group.length * wasteFactor;

        items.push({
            id: key,
            name,
            description: `${group.type === 'electrical' ? 'Electrical circuit' : 'Dust collection line'} - ${group.spec}`,
            quantity: parseFloat(quantity.toFixed(2)),
            unit: 'ft',
            estimatedUnitPrice: unitPrice,
            totalPrice: parseFloat((quantity * unitPrice).toFixed(2)),
            category: group.type === 'electrical' ? 'wire' : 'pipe'
        });
    });

    // 2. Process Fittings (Turns & Junctions)
    let elbowCount = 0;
    for (let i = 0; i < segments.length - 1; i++) {
        const s1 = segments[i];
        const s2 = segments[i + 1];

        // Check if segments are connected
        const areConnected = s1.end.every((val, idx) => Math.abs(val - s2.start[idx]) < 0.1);

        if (areConnected) {
            const v1 = [s1.end[0] - s1.start[0], s1.end[1] - s1.start[1], s1.end[2] - s1.start[2]];
            const v2 = [s2.end[0] - s2.start[0], s2.end[1] - s2.start[1], s2.end[2] - s2.start[2]];

            const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
            const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
            const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);

            const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);

            if (angle > 15) { // Any turns more than 15 degrees count as an elbow
                elbowCount++;
            }
        }
    }

    if (elbowCount > 0) {
        items.push({
            id: 'fitting-elbow-90',
            name: '90° Adjustable Elbow',
            description: 'Standard adjustable elbow for routing turns',
            quantity: elbowCount,
            unit: 'ea',
            estimatedUnitPrice: 12.00,
            totalPrice: elbowCount * 12.00,
            category: 'fitting'
        });
    }

    const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
        items,
        totalCost: parseFloat(totalCost.toFixed(2)),
        wasteFactor,
        currency
    };
}
