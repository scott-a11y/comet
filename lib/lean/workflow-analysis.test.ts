import { describe, it, expect } from 'vitest';
import {
    calculateWorkflowDistance,
    calculateLeanScore,
    generateSpaghettiDiagram,
    type WorkflowSequence,
} from './workflow-analysis';

describe('Lean Workflow Analysis', () => {
    const sampleWorkflow: WorkflowSequence = {
        name: 'Cabinet Door Production',
        steps: [
            {
                equipmentId: 1,
                equipmentName: 'Table Saw',
                operationName: 'Cut to size',
                cycleTimeMinutes: 5,
                position: { x: 0, y: 0 },
            },
            {
                equipmentId: 2,
                equipmentName: 'Router Table',
                operationName: 'Profile edges',
                cycleTimeMinutes: 3,
                position: { x: 10, y: 0 }, // 10 ft away
            },
            {
                equipmentId: 3,
                equipmentName: 'Drill Press',
                operationName: 'Drill hinge holes',
                cycleTimeMinutes: 2,
                position: { x: 10, y: 10 }, // 10 ft away
            },
            {
                equipmentId: 4,
                equipmentName: 'Sanding Station',
                operationName: 'Sand surfaces',
                cycleTimeMinutes: 4,
                position: { x: 0, y: 10 }, // 10 ft away
            },
        ],
    };

    describe('calculateWorkflowDistance', () => {
        it('should calculate total travel distance correctly', () => {
            const result = calculateWorkflowDistance(sampleWorkflow);

            // Distance: 0→10 (10ft) + 10→10 (10ft) + 10→0 (10ft) = 30ft
            expect(result.totalDistance).toBe(30);
        });

        it('should calculate cycle time correctly', () => {
            const result = calculateWorkflowDistance(sampleWorkflow);

            // Total cycle time: 5 + 3 + 2 + 4 = 14 minutes
            expect(result.totalCycleTime).toBe(14);
            expect(result.valueAddedTime).toBe(14);
        });

        it('should estimate transport time', () => {
            const result = calculateWorkflowDistance(sampleWorkflow);

            // Transport time: 30 ft / 200 ft/min = 0.15 min
            expect(result.transportTime).toBeCloseTo(0.15, 0);
        });

        it('should calculate efficiency', () => {
            const result = calculateWorkflowDistance(sampleWorkflow);

            // Efficiency: 14 / (14 + 0.15) ≈ 99%
            expect(result.efficiency).toBeGreaterThan(95);
        });

        it('should calculate waste score', () => {
            const result = calculateWorkflowDistance(sampleWorkflow);

            // Waste score: 100 - (30/5) = 94
            expect(result.wasteScore).toBe(94);
        });

        it('should generate path segments', () => {
            const result = calculateWorkflowDistance(sampleWorkflow);

            expect(result.pathSegments).toHaveLength(3);
            expect(result.pathSegments[0]).toEqual({
                from: 'Table Saw',
                to: 'Router Table',
                distance: 10,
            });
        });

        it('should provide suggestions for optimization', () => {
            const result = calculateWorkflowDistance(sampleWorkflow);

            expect(result.suggestions).toBeDefined();
            expect(result.suggestions.length).toBeGreaterThan(0);
        });

        it('should handle single-step workflow', () => {
            const singleStep: WorkflowSequence = {
                name: 'Single Operation',
                steps: [sampleWorkflow.steps[0]],
            };

            const result = calculateWorkflowDistance(singleStep);

            expect(result.totalDistance).toBe(0);
            expect(result.wasteScore).toBe(100);
        });
    });

    describe('calculateLeanScore', () => {
        it('should calculate overall lean score', () => {
            const workflowAnalysis = calculateWorkflowDistance(sampleWorkflow);
            const leanScore = calculateLeanScore(
                workflowAnalysis,
                4, // equipment count
                1200, // layout area (sq ft)
                true, // has organized storage
                true // has safety zones
            );

            expect(leanScore.overall).toBeGreaterThan(0);
            expect(leanScore.overall).toBeLessThanOrEqual(100);
        });

        it('should calculate material flow score', () => {
            const workflowAnalysis = calculateWorkflowDistance(sampleWorkflow);
            const leanScore = calculateLeanScore(workflowAnalysis, 4, 1200);

            expect(leanScore.materialFlow).toBeGreaterThan(0);
            expect(leanScore.materialFlow).toBeLessThanOrEqual(100);
        });

        it('should calculate worker movement score', () => {
            const workflowAnalysis = calculateWorkflowDistance(sampleWorkflow);
            const leanScore = calculateLeanScore(workflowAnalysis, 4, 1200);

            expect(leanScore.workerMovement).toBeGreaterThan(0);
            expect(leanScore.workerMovement).toBeLessThanOrEqual(100);
        });

        it('should provide breakdown by category', () => {
            const workflowAnalysis = calculateWorkflowDistance(sampleWorkflow);
            const leanScore = calculateLeanScore(workflowAnalysis, 4, 1200);

            expect(leanScore.breakdown).toHaveLength(4);
            expect(leanScore.breakdown[0].category).toBe('Material Flow');
            expect(leanScore.breakdown[0].weight).toBe(0.4);
        });

        it('should provide recommendations', () => {
            const workflowAnalysis = calculateWorkflowDistance(sampleWorkflow);
            const leanScore = calculateLeanScore(workflowAnalysis, 4, 1200);

            leanScore.breakdown.forEach(category => {
                expect(category.recommendations).toBeDefined();
                expect(Array.isArray(category.recommendations)).toBe(true);
            });
        });

        it('should penalize inefficient layouts', () => {
            const inefficientWorkflow: WorkflowSequence = {
                name: 'Inefficient Layout',
                steps: [
                    {
                        equipmentId: 1,
                        equipmentName: 'Machine A',
                        operationName: 'Op A',
                        cycleTimeMinutes: 5,
                        position: { x: 0, y: 0 },
                    },
                    {
                        equipmentId: 2,
                        equipmentName: 'Machine B',
                        operationName: 'Op B',
                        cycleTimeMinutes: 5,
                        position: { x: 200, y: 200 }, // Very far away
                    },
                ],
            };

            const workflowAnalysis = calculateWorkflowDistance(inefficientWorkflow);
            const leanScore = calculateLeanScore(workflowAnalysis, 2, 1200);

            // Should have low score due to high distance
            expect(leanScore.overall).toBeLessThan(70);
        });
    });

    describe('generateSpaghettiDiagram', () => {
        it('should generate path data', () => {
            const diagram = generateSpaghettiDiagram(sampleWorkflow, 10);

            expect(diagram.paths).toHaveLength(3);
            expect(diagram.totalDistance).toBe(300); // 30 ft * 10 trips
            expect(diagram.totalTrips).toBe(30); // 3 segments * 10 trips
        });

        it('should assign colors based on frequency', () => {
            const lowFreq = generateSpaghettiDiagram(sampleWorkflow, 5);
            const medFreq = generateSpaghettiDiagram(sampleWorkflow, 25);
            const highFreq = generateSpaghettiDiagram(sampleWorkflow, 60);

            expect(lowFreq.paths[0].color).toBe('#10b981'); // green
            expect(medFreq.paths[0].color).toBe('#f59e0b'); // orange
            expect(highFreq.paths[0].color).toBe('#ef4444'); // red
        });

        it('should include position and label data', () => {
            const diagram = generateSpaghettiDiagram(sampleWorkflow, 1);

            const firstPath = diagram.paths[0];
            expect(firstPath.from.label).toBe('Table Saw');
            expect(firstPath.to.label).toBe('Router Table');
            expect(firstPath.from.x).toBe(0);
            expect(firstPath.from.y).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle workflow with no movement (all equipment at same location)', () => {
            const colocatedWorkflow: WorkflowSequence = {
                name: 'Cell Manufacturing',
                steps: [
                    {
                        equipmentId: 1,
                        equipmentName: 'Machine A',
                        operationName: 'Op A',
                        cycleTimeMinutes: 5,
                        position: { x: 10, y: 10 },
                    },
                    {
                        equipmentId: 2,
                        equipmentName: 'Machine B',
                        operationName: 'Op B',
                        cycleTimeMinutes: 5,
                        position: { x: 10, y: 10 }, // Same location
                    },
                ],
            };

            const result = calculateWorkflowDistance(colocatedWorkflow);

            expect(result.totalDistance).toBe(0);
            expect(result.wasteScore).toBe(100);
            expect(result.efficiency).toBe(100);
        });

        it('should handle very large layouts', () => {
            const largeWorkflow: WorkflowSequence = {
                name: 'Large Shop',
                steps: [
                    {
                        equipmentId: 1,
                        equipmentName: 'Machine A',
                        operationName: 'Op A',
                        cycleTimeMinutes: 5,
                        position: { x: 0, y: 0 },
                    },
                    {
                        equipmentId: 2,
                        equipmentName: 'Machine B',
                        operationName: 'Op B',
                        cycleTimeMinutes: 5,
                        position: { x: 500, y: 500 }, // Very large distance
                    },
                ],
            };

            const result = calculateWorkflowDistance(largeWorkflow);

            expect(result.totalDistance).toBeGreaterThan(700); // ~707 ft
            expect(result.wasteScore).toBeLessThan(10); // Very wasteful
            expect(result.suggestions[0]).toContain('CRITICAL');
        });
    });
});
