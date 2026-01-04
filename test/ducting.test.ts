
import { describe, it, expect } from 'vitest';
import {
    calculateOptimalDiameter,
    calculateVelocity,
    calculateFrictionLossPre100Ft,
    VELOCITY_STANDARDS
} from '../lib/systems/ducting';

describe('Ducting Calculations', () => {

    describe('Optimal Diameter', () => {
        it('should calculate optimal diameter for standard 4000 FPM', () => {
            // CFM = 1000
            // A = 1000 / 4000 = 0.25 sq ft
            // d = sqrt(0.25 * 576 / pi) = sqrt(144 / pi) = sqrt(45.83) = ~6.77 inches
            const d = calculateOptimalDiameter(1000, 4000);
            expect(d).toBeCloseTo(6.77, 2);
        });

        it('should handle edge cases', () => {
            expect(calculateOptimalDiameter(0, 4000)).toBe(0);
            expect(calculateOptimalDiameter(400, 0)).toBe(0);
            expect(calculateOptimalDiameter(-100, 4000)).toBe(0);
        });

        it('should use velocity standards', () => {
            const d1 = calculateOptimalDiameter(600, VELOCITY_STANDARDS.MAIN_LINE);
            const d2 = calculateOptimalDiameter(600, VELOCITY_STANDARDS.BRANCH_LINE);

            // Branch line (higher velocity) needs smaller diameter
            expect(d2).toBeLessThan(d1);
        });
    });

    describe('Velocity Calculation', () => {
        it('should calculate velocity correctly', () => {
            // d=6 inch => A = pi * (0.25)^2 = 0.0625 * pi = 0.1963 sq ft
            // CFM = 800
            // V = 800 / 0.1963 = 4074 FPM
            const v = calculateVelocity(800, 6);
            expect(v).toBeCloseTo(4074, 0);
        });

        it('should return 0 for zero diameter', () => {
            expect(calculateVelocity(400, 0)).toBe(0);
        });

        it('should show inverse relationship with diameter', () => {
            const v1 = calculateVelocity(400, 4);
            const v2 = calculateVelocity(400, 6);
            expect(v1).toBeGreaterThan(v2);
        });
    });

    describe('Friction Loss', () => {
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

        it('should increase with CFM', () => {
            const loss1 = calculateFrictionLossPre100Ft(400, 6);
            const loss2 = calculateFrictionLossPre100Ft(800, 6);
            expect(loss2).toBeGreaterThan(loss1);
        });
    });

    describe('Real-World Scenarios', () => {
        it('should size duct for table saw (350 CFM)', () => {
            const cfm = 350;
            const diameter = calculateOptimalDiameter(cfm, VELOCITY_STANDARDS.BRANCH_LINE);
            const velocity = calculateVelocity(cfm, diameter);

            expect(diameter).toBeGreaterThan(3);
            expect(diameter).toBeLessThan(6);
            expect(velocity).toBeCloseTo(VELOCITY_STANDARDS.BRANCH_LINE, -2);
        });

        it('should size main trunk for shop (1500 CFM)', () => {
            const cfm = 1500;
            const diameter = calculateOptimalDiameter(cfm, VELOCITY_STANDARDS.MAIN_LINE);

            expect(diameter).toBeGreaterThan(8);
            expect(diameter).toBeLessThan(14);
        });
    });
});
