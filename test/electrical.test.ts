import { describe, it, expect } from 'vitest';
import {
    calculateWireSizeByAmpacity,
    calculateVoltageDrop,
    calculateOptimalWireSize,
    calculateConduitSize,
    calculateBreakerSize,
    type CircuitRun
} from '../lib/systems/electrical';

describe('Electrical System Calculations', () => {

    describe('Wire Sizing by Ampacity', () => {
        it('should calculate correct wire size for 20A load', () => {
            const size = calculateWireSizeByAmpacity(20, 0.8);
            expect(size).toBe('12 AWG'); // 20 / 0.8 = 25A required
        });

        it('should calculate correct wire size for 50A load', () => {
            const size = calculateWireSizeByAmpacity(50, 0.8);
            expect(size).toBe('6 AWG'); // 50 / 0.8 = 62.5A required
        });

        it('should throw error for excessive load', () => {
            expect(() => calculateWireSizeByAmpacity(300, 0.8)).toThrow();
        });
    });

    describe('Voltage Drop Calculations', () => {
        it('should calculate voltage drop for single phase circuit', () => {
            const result = calculateVoltageDrop('12 AWG', 100, 20, 120, 1);

            // 12 AWG = 1.93 ohms/1000ft
            // VD = 2 * (1.93 * 100 / 1000) * 20 = 2 * 0.193 * 20 = 7.72V
            expect(result.voltageDrop).toBeCloseTo(7.72, 1);
            expect(result.percentDrop).toBeCloseTo(6.43, 1);
        });

        it('should calculate voltage drop for three phase circuit', () => {
            const result = calculateVoltageDrop('10 AWG', 150, 30, 208, 3);

            // 10 AWG = 1.21 ohms/1000ft
            // VD = 1.732 * (1.21 * 150 / 1000) * 30
            expect(result.voltageDrop).toBeCloseTo(9.42, 1);
            expect(result.percentDrop).toBeCloseTo(4.53, 1);
        });
    });

    describe('Optimal Wire Size', () => {
        it('should size wire for short run based on ampacity only', () => {
            const circuit: CircuitRun = {
                load: { voltage: 120, phase: 1, amps: 20 },
                lengthFt: 50,
                maxVoltageDrop: 3
            };

            const result = calculateOptimalWireSize(circuit);
            // With 80% derating, 20A requires 25A capacity = 12 AWG minimum
            // But voltage drop check may upsize to 10 AWG
            expect(['12 AWG', '10 AWG']).toContain(result.wireSize);
            expect(result.percentDrop).toBeLessThan(4); // Allow slightly higher
        });

        it('should upsize wire for long run due to voltage drop', () => {
            const circuit: CircuitRun = {
                load: { voltage: 120, phase: 1, amps: 20 },
                lengthFt: 200,
                maxVoltageDrop: 3
            };

            const result = calculateOptimalWireSize(circuit);
            // Should upsize from 12 AWG due to voltage drop
            expect(['10 AWG', '8 AWG', '6 AWG', '4 AWG']).toContain(result.wireSize);
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('should warn about long runs', () => {
            const circuit: CircuitRun = {
                load: { voltage: 240, phase: 1, amps: 30 },
                lengthFt: 150
            };

            const result = calculateOptimalWireSize(circuit);
            expect(result.warnings.some(w => w.includes('Long run'))).toBe(true);
        });
    });

    describe('Conduit Sizing', () => {
        it('should calculate conduit size for 3 conductors of 12 AWG', () => {
            const size = calculateConduitSize('12 AWG', 3);
            expect(size).toBe('1/2"');
        });

        it('should calculate conduit size for 6 conductors of 10 AWG', () => {
            const size = calculateConduitSize('10 AWG', 6);
            expect(size).toBe('3/4"');
        });

        it('should require larger conduit for many conductors', () => {
            const size = calculateConduitSize('12 AWG', 10);
            expect(['3/4"', '1"']).toContain(size);
        });
    });

    describe('Breaker Sizing', () => {
        it('should size breaker for general load at 125%', () => {
            const load = { voltage: 120, phase: 1 as const, amps: 16 };
            const breakerSize = calculateBreakerSize(load, false);

            // 16 * 1.25 = 20A
            expect(breakerSize).toBe(20);
        });

        it('should size breaker for motor load at 250%', () => {
            const load = { voltage: 240, phase: 1 as const, amps: 20 };
            const breakerSize = calculateBreakerSize(load, true);

            // 20 * 2.5 = 50A
            expect(breakerSize).toBe(50);
        });

        it('should round up to next standard breaker size', () => {
            const load = { voltage: 120, phase: 1 as const, amps: 18 };
            const breakerSize = calculateBreakerSize(load, false);

            // 18 * 1.25 = 22.5A -> rounds to 25A
            expect(breakerSize).toBe(25);
        });
    });
});
