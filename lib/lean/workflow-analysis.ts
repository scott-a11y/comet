import { z } from 'zod';

/**
 * Lean Manufacturing Analysis for Shop Layouts
 * Calculates workflow efficiency, travel distance, and lean metrics
 */

// ============================================================================
// Types & Schemas
// ============================================================================

export const workflowStepSchema = z.object({
    equipmentId: z.number(),
    equipmentName: z.string(),
    operationName: z.string(),
    cycleTimeMinutes: z.number().positive(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
});

export const workflowSequenceSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    steps: z.array(workflowStepSchema),
    unitsPerDay: z.number().positive().optional(),
});

export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type WorkflowSequence = z.infer<typeof workflowSequenceSchema>;

export interface WorkflowAnalysisResult {
    totalDistance: number; // feet
    totalCycleTime: number; // minutes
    valueAddedTime: number; // minutes
    transportTime: number; // minutes (estimated)
    wasteScore: number; // 0-100 (100 = no waste)
    efficiency: number; // 0-100 (value-added / total time)
    suggestions: string[];
    pathSegments: Array<{
        from: string;
        to: string;
        distance: number;
    }>;
}

export interface LeanScore {
    overall: number; // 0-100
    materialFlow: number; // 0-100
    workerMovement: number; // 0-100
    organization: number; // 0-100
    safety: number; // 0-100
    breakdown: {
        category: string;
        score: number;
        weight: number;
        issues: string[];
        recommendations: string[];
    }[];
}

// ============================================================================
// Workflow Path Analysis
// ============================================================================

/**
 * Calculate total travel distance for a workflow sequence
 */
export function calculateWorkflowDistance(
    sequence: WorkflowSequence
): WorkflowAnalysisResult {
    const steps = sequence.steps;

    if (steps.length < 2) {
        return {
            totalDistance: 0,
            totalCycleTime: steps[0]?.cycleTimeMinutes || 0,
            valueAddedTime: steps[0]?.cycleTimeMinutes || 0,
            transportTime: 0,
            wasteScore: 100,
            efficiency: 100,
            suggestions: ['Add more steps to analyze workflow'],
            pathSegments: [],
        };
    }

    let totalDistance = 0;
    const pathSegments: Array<{ from: string; to: string; distance: number }> = [];

    // Calculate distance between each consecutive step
    for (let i = 0; i < steps.length - 1; i++) {
        const current = steps[i];
        const next = steps[i + 1];

        const distance = calculateDistance(
            current.position,
            next.position
        );

        totalDistance += distance;
        pathSegments.push({
            from: current.equipmentName,
            to: next.equipmentName,
            distance: Math.round(distance * 10) / 10,
        });
    }

    // Calculate time metrics
    const totalCycleTime = steps.reduce((sum, step) => sum + step.cycleTimeMinutes, 0);
    const valueAddedTime = totalCycleTime;

    // Estimate transport time (assume 200 ft/min walking speed with material)
    const transportTime = totalDistance / 200;

    const totalTime = valueAddedTime + transportTime;
    const efficiency = (valueAddedTime / totalTime) * 100;

    // Calculate waste score (inverse of distance - less distance = less waste)
    // Benchmark: <100 ft = excellent, 100-300 ft = good, 300-500 ft = fair, >500 ft = poor
    const wasteScore = Math.max(0, Math.min(100, 100 - (totalDistance / 5)));

    // Generate suggestions
    const suggestions = generateWorkflowSuggestions(
        totalDistance,
        pathSegments,
        efficiency
    );

    return {
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalCycleTime: Math.round(totalCycleTime * 10) / 10,
        valueAddedTime: Math.round(valueAddedTime * 10) / 10,
        transportTime: Math.round(transportTime * 10) / 10,
        wasteScore: Math.round(wasteScore),
        efficiency: Math.round(efficiency),
        suggestions,
        pathSegments,
    };
}

/**
 * Calculate Euclidean distance between two points
 */
function calculateDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number }
): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate actionable suggestions based on workflow analysis
 */
function generateWorkflowSuggestions(
    totalDistance: number,
    pathSegments: Array<{ from: string; to: string; distance: number }>,
    efficiency: number
): string[] {
    const suggestions: string[] = [];

    // Distance-based suggestions
    if (totalDistance > 500) {
        suggestions.push('🔴 CRITICAL: Total travel distance is very high (>500 ft). Consider major layout reorganization.');
    } else if (totalDistance > 300) {
        suggestions.push('⚠️ WARNING: Travel distance is high (>300 ft). Look for opportunities to relocate equipment.');
    } else if (totalDistance > 100) {
        suggestions.push('💡 TIP: Travel distance is acceptable but could be optimized further.');
    } else {
        suggestions.push('✅ EXCELLENT: Travel distance is minimal. Layout is well-optimized.');
    }

    // Find longest path segment
    const longestSegment = pathSegments.reduce((max, segment) =>
        segment.distance > max.distance ? segment : max
        , pathSegments[0]);

    if (longestSegment && longestSegment.distance > 100) {
        suggestions.push(
            `🎯 PRIORITY: Reduce distance between ${longestSegment.from} and ${longestSegment.to} (currently ${longestSegment.distance} ft)`
        );
    }

    // Efficiency-based suggestions
    if (efficiency < 70) {
        suggestions.push('⏱️ Low efficiency detected. Consider grouping related operations closer together.');
    } else if (efficiency > 90) {
        suggestions.push('✅ Excellent workflow efficiency! Minimal transport waste.');
    }

    // Backtracking detection
    const backtracking = detectBacktracking(pathSegments);
    if (backtracking.length > 0) {
        suggestions.push(
            `🔄 BACKTRACKING DETECTED: Material moves backward ${backtracking.length} time(s). Resequence operations or relocate equipment.`
        );
    }

    return suggestions;
}

/**
 * Detect if material backtracks (moves in opposite direction)
 */
function detectBacktracking(
    pathSegments: Array<{ from: string; to: string; distance: number }>
): number[] {
    // Simplified: detect if we visit same area multiple times
    // In a real implementation, would track x,y coordinates
    const backtrackIndices: number[] = [];

    // For now, just flag very long segments as potential backtracking
    pathSegments.forEach((segment, index) => {
        if (segment.distance > 150) {
            backtrackIndices.push(index);
        }
    });

    return backtrackIndices;
}

// ============================================================================
// Lean Score Calculation
// ============================================================================

/**
 * Calculate comprehensive lean score for a layout
 */
export function calculateLeanScore(
    workflowAnalysis: WorkflowAnalysisResult,
    equipmentCount: number,
    layoutArea: number, // square feet
    hasOrganizedStorage: boolean = false,
    hasSafetyZones: boolean = false
): LeanScore {
    const breakdown: LeanScore['breakdown'] = [];

    // 1. Material Flow (40% weight)
    const materialFlowScore = calculateMaterialFlowScore(workflowAnalysis);
    breakdown.push({
        category: 'Material Flow',
        score: materialFlowScore,
        weight: 0.4,
        issues: materialFlowScore < 70 ? [
            'High travel distance between operations',
            'Inefficient workflow sequence',
        ] : [],
        recommendations: materialFlowScore < 70 ? [
            'Relocate equipment to minimize travel',
            'Consider U-shaped or cellular layout',
        ] : ['Material flow is optimized'],
    });

    // 2. Worker Movement (30% weight)
    const workerMovementScore = calculateWorkerMovementScore(
        workflowAnalysis.totalDistance,
        equipmentCount
    );
    breakdown.push({
        category: 'Worker Movement',
        score: workerMovementScore,
        weight: 0.3,
        issues: workerMovementScore < 70 ? [
            'Excessive walking between stations',
            'Poor equipment accessibility',
        ] : [],
        recommendations: workerMovementScore < 70 ? [
            'Group frequently-used equipment together',
            'Add tool storage at each workstation',
        ] : ['Worker movement is efficient'],
    });

    // 3. Organization (20% weight)
    const organizationScore = calculateOrganizationScore(
        equipmentCount,
        layoutArea,
        hasOrganizedStorage
    );
    breakdown.push({
        category: 'Workspace Organization',
        score: organizationScore,
        weight: 0.2,
        issues: organizationScore < 70 ? [
            'Cluttered workspace',
            'Insufficient storage',
        ] : [],
        recommendations: organizationScore < 70 ? [
            'Implement 5S methodology',
            'Add designated storage areas',
        ] : ['Workspace is well-organized'],
    });

    // 4. Safety (10% weight)
    const safetyScore = calculateSafetyScore(
        equipmentCount,
        layoutArea,
        hasSafetyZones
    );
    breakdown.push({
        category: 'Safety & Ergonomics',
        score: safetyScore,
        weight: 0.1,
        issues: safetyScore < 70 ? [
            'Insufficient safety clearances',
            'Poor ergonomic layout',
        ] : [],
        recommendations: safetyScore < 70 ? [
            'Add safety zones around equipment',
            'Ensure proper aisle widths (min 4 ft)',
        ] : ['Safety standards met'],
    });

    // Calculate weighted overall score
    const overall = Math.round(
        breakdown.reduce((sum, item) => sum + (item.score * item.weight), 0)
    );

    return {
        overall,
        materialFlow: materialFlowScore,
        workerMovement: workerMovementScore,
        organization: organizationScore,
        safety: safetyScore,
        breakdown,
    };
}

function calculateMaterialFlowScore(analysis: WorkflowAnalysisResult): number {
    // Based on waste score and efficiency
    return Math.round((analysis.wasteScore * 0.6) + (analysis.efficiency * 0.4));
}

function calculateWorkerMovementScore(totalDistance: number, equipmentCount: number): number {
    // Benchmark: <50 ft per equipment piece = excellent
    const avgDistancePerEquipment = totalDistance / Math.max(1, equipmentCount - 1);

    if (avgDistancePerEquipment < 50) return 95;
    if (avgDistancePerEquipment < 100) return 80;
    if (avgDistancePerEquipment < 150) return 65;
    if (avgDistancePerEquipment < 200) return 50;
    return 30;
}

function calculateOrganizationScore(
    equipmentCount: number,
    layoutArea: number,
    hasOrganizedStorage: boolean
): number {
    // Benchmark: 100-150 sq ft per equipment piece = good density
    const sqFtPerEquipment = layoutArea / Math.max(1, equipmentCount);

    let score = 70; // Base score

    if (sqFtPerEquipment >= 100 && sqFtPerEquipment <= 200) {
        score += 20; // Good density
    } else if (sqFtPerEquipment < 100) {
        score -= 10; // Too cramped
    } else if (sqFtPerEquipment > 300) {
        score -= 10; // Too spread out
    }

    if (hasOrganizedStorage) {
        score += 10;
    }

    return Math.min(100, Math.max(0, score));
}

function calculateSafetyScore(
    equipmentCount: number,
    layoutArea: number,
    hasSafetyZones: boolean
): number {
    let score = 60; // Base score

    // Check if there's enough space for safety
    const sqFtPerEquipment = layoutArea / Math.max(1, equipmentCount);
    if (sqFtPerEquipment >= 150) {
        score += 20; // Adequate space for safety
    }

    if (hasSafetyZones) {
        score += 20;
    }

    return Math.min(100, Math.max(0, score));
}

// ============================================================================
// Spaghetti Diagram Data
// ============================================================================

export interface SpaghettiDiagramData {
    paths: Array<{
        from: { x: number; y: number; label: string };
        to: { x: number; y: number; label: string };
        distance: number;
        frequency: number; // trips per day
        color: string; // based on frequency
    }>;
    totalDistance: number;
    totalTrips: number;
}

/**
 * Generate spaghetti diagram data for visualization
 */
export function generateSpaghettiDiagram(
    sequence: WorkflowSequence,
    tripsPerDay: number = 1
): SpaghettiDiagramData {
    const paths: SpaghettiDiagramData['paths'] = [];
    let totalDistance = 0;

    for (let i = 0; i < sequence.steps.length - 1; i++) {
        const current = sequence.steps[i];
        const next = sequence.steps[i + 1];

        const distance = calculateDistance(current.position, next.position);
        totalDistance += distance * tripsPerDay;

        // Color based on frequency (trips per day)
        let color = '#10b981'; // green (low)
        if (tripsPerDay > 50) color = '#ef4444'; // red (high)
        else if (tripsPerDay > 20) color = '#f59e0b'; // orange (medium)

        paths.push({
            from: {
                x: current.position.x,
                y: current.position.y,
                label: current.equipmentName,
            },
            to: {
                x: next.position.x,
                y: next.position.y,
                label: next.equipmentName,
            },
            distance: Math.round(distance * 10) / 10,
            frequency: tripsPerDay,
            color,
        });
    }

    return {
        paths,
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalTrips: tripsPerDay * (sequence.steps.length - 1),
    };
}
