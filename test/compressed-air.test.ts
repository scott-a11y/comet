import { describe, it, expect } from 'vitest';
import {
    calculateAirPressureDrop,
    calculateOptimalAirPipeSize,
    calculateCompressorRequirement,
    calculateReceiverSize,
    type AirSystemParams
} from '../lib/systems/compressed-air';

describe('Compressed Air System Calculations', () => {

    describe('Pressure Drop Calculations', () => {
        it('should calculate pressure drop for 1" pipe', () => {
            const params: AirSystemParams = {
                flowSCFM: 20,
                pressurePSI: 90,
                lengthFt: 100
            };

            const result = calculateAirPressureDrop('1"', params);

            expect(result.pressureDropPSI).toBeGreaterThan(0);
            expect(result.pressureDropPer100Ft).toBeCloseTo(result.pressureDropPSI, 1);
            expect(result.velocity).toBeGreaterThan(0);
        });

        it('should show lower pressure drop for larger pipe', () => {
            const params: AirSystemParams = {
                flowSCFM: 30,
                pressurePSI: 90,
                lengthFt: 100
            };

            const result1 = calculateAirPressureDrop('1"', params);
            const result2 = calculateAirPressureDrop('1-1/2"', params);

            expect(result2.pressureDropPSI).toBeLessThan(result1.pressureDropPSI);
        });
    });

    describe('Optimal Pipe Sizing', () => {
        it('should select appropriate pipe size for low flow', () => {
            const params: AirSystemParams = {
                flowSCFM: 10,
                pressurePSI: 90,
                lengthFt: 50,
                maxPressureDropPSI: 1
            };

            const result = calculateOptimalAirPipeSize(params);

            expect(result.pipeSize).toBeDefined();
            expect(result.pressureDrop).toBeLessThanOrEqual(params.maxPressureDropPSI!);
        });

        it('should select larger pipe for high flow', () => {
            const params: AirSystemParams = {
                flowSCFM: 100,
                pressurePSI: 90,
                lengthFt: 200,
                maxPressureDropPSI: 1
            };

            const result = calculateOptimalAirPipeSize(params);

            expect(['2"', '2-1/2"', '3"', '4"', '6"']).toContain(result.pipeSize);
        });

        it('should warn about high velocity', () => {
            const params: AirSystemParams = {
                flowSCFM: 50,
                pressurePSI: 90,
                lengthFt: 100,
                maxPressureDropPSI: 5 // Allow high drop to force small pipe
            };

            const result = calculateOptimalAirPipeSize(params);

            if (result.velocity > 6000) {
                expect(result.warnings.some(w => w.includes('velocity'))).toBe(true);
            }
        });
    });

    describe('Compressor Requirement Calculations', () => {
        it('should calculate CFM for single tool', () => {
            const tools = [
                { cfm: 10, dutyCycle: 0.5 }
            ];

            const result = calculateCompressorRequirement(tools);

            // 10 * 0.5 * 1.2 (safety factor) = 6 CFM
            expect(result.requiredCFM).toBeCloseTo(6, 1);
            expect(result.recommendedHP).toBeGreaterThanOrEqual(1);
        });

        it('should calculate CFM for multiple tools', () => {
            const tools = [
                { cfm: 15, dutyCycle: 0.3 },
                { cfm: 8, dutyCycle: 0.5 },
                { cfm: 12, dutyCycle: 0.2 }
            ];

            const result = calculateCompressorRequirement(tools);

            // (15*0.3 + 8*0.5 + 12*0.2) * 1.2 = (4.5 + 4 + 2.4) * 1.2 = 13.08 CFM
            expect(result.requiredCFM).toBeCloseTo(13.08, 1);
            expect(result.recommendedHP).toBeGreaterThanOrEqual(3);
        });

        it('should recommend appropriate HP', () => {
            const tools = [
                { cfm: 20, dutyCycle: 0.8 }
            ];

            const result = calculateCompressorRequirement(tools);

            // 20 * 0.8 * 1.2 = 19.2 CFM -> ~5 HP
            expect(result.recommendedHP).toBeGreaterThanOrEqual(4);
            expect(result.recommendedHP).toBeLessThanOrEqual(6);
        });
    });

    describe('Receiver Tank Sizing', () => {
        it('should recommend minimum tank when compressor meets demand', () => {
            const result = calculateReceiverSize(20, 15, 10);

            expect(result.gallons).toBe(60); // Minimum
            expect(result.recommendation).toContain('Minimum');
        });

        it('should size tank for peak demand', () => {
            const result = calculateReceiverSize(15, 30, 10);

            // Need buffer for 15 CFM difference
            expect(result.gallons).toBeGreaterThan(60);
            expect(result.recommendation).toContain('gallon');
        });

        it('should recommend standard tank sizes', () => {
            const result = calculateReceiverSize(20, 40, 10);

            const standardSizes = [60, 80, 120, 200, 240, 300, 500];
            expect(standardSizes).toContain(result.gallons);
        });
    });
});
