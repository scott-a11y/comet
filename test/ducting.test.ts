
import { describe, it, expect } from 'vitest';
import { calculateOptimalDiameter, calculateVelocity, calculateFrictionLossPre100Ft } from '../lib/systems/ducting';

describe('Ducting Calculations', () => {

    it('should calculate optimal diameter for standard 4000 FPM', () => {
        // CFM = 1000
        // A = 1000 / 4000 = 0.25 sq ft
        // d = sqrt(0.25 * 576 / pi) = sqrt(144 / pi) = sqrt(45.83) = ~6.77 inches
        const d = calculateOptimalDiameter(1000, 4000);
        expect(d).toBeCloseTo(6.77, 2);
    });

    it('should calculate velocity correctly', () => {
        // d=6 inch => A = pi * (0.25)^2 = 0.0625 * pi = 0.1963 sq ft
        // CFM = 800
        // V = 800 / 0.1963 = 4074 FPM
        const v = calculateVelocity(800, 6);
        expect(v).toBeCloseTo(4074, 0);
    });

    it('should calculate friction loss roughly correctly', () => {
        // 1000 CFM, 6 inch duct
        // h = 0.109136 * 1000^1.9 / 6^5.02
        // 1000^1.9 = 501,187
        // 6^5.02 = 8080
        // h = 0.109... * 501187 / 8080 = ~6.76 in wg / 100ft (quite high for 6", usually bigger duct needed for 1000cfm)

        const loss = calculateFrictionLossPre100Ft(1000, 6);
        expect(loss).toBeGreaterThan(5);
        expect(loss).toBeLessThan(8);

        // 1000 CFM, 8 inch duct (better)
        const loss8 = calculateFrictionLossPre100Ft(1000, 8);
        // Should be much lower
        expect(loss8).toBeLessThan(loss);
    });
});
