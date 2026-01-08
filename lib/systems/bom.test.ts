import { describe, it, expect } from 'vitest';
import { calculateBOM, RoutingSegment } from './bom';

describe('BOM Calculation Engine', () => {
    it('should calculate linear pipe requirements with waste factor', () => {
        const segments: RoutingSegment[] = [
            {
                id: '1',
                type: 'ducting',
                diameter: 4,
                start: [0, 0, 0],
                end: [10, 0, 0] // 10 feet
            }
        ];

        const bom = calculateBOM(segments, { wasteFactor: 1.10 });
        const ductItem = bom.items.find(i => i.category === 'pipe');

        expect(ductItem).toBeDefined();
        expect(ductItem?.quantity).toBe(11); // 10 * 1.1
        expect(bom.totalCost).toBeGreaterThan(0);
    });

    it('should detect turns and add elbow fittings', () => {
        const segments: RoutingSegment[] = [
            {
                id: '1',
                type: 'ducting',
                diameter: 4,
                start: [0, 0, 0],
                end: [10, 0, 0]
            },
            {
                id: '2',
                type: 'ducting',
                diameter: 4,
                start: [10, 0, 0],
                end: [10, 0, 10] // 90 degree turn
            }
        ];

        const bom = calculateBOM(segments);
        const elbowItem = bom.items.find(i => i.id === 'fitting-elbow-90');

        expect(elbowItem).toBeDefined();
        expect(elbowItem?.quantity).toBe(1);
    });

    it('should sum multiple circuit lengths correctly', () => {
        const segments: RoutingSegment[] = [
            { id: '1', type: 'electrical', gauge: '12 AWG', start: [0, 0, 0], end: [5, 0, 0] },
            { id: '2', type: 'electrical', gauge: '12 AWG', start: [5, 0, 0], end: [10, 0, 0] }
        ];

        const bom = calculateBOM(segments, { wasteFactor: 1.0 });
        const wireItem = bom.items.find(i => i.category === 'wire');

        expect(wireItem?.quantity).toBe(10);
    });
});
