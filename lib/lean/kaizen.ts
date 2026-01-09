import { z } from 'zod';

/**
 * Kaizen (Continuous Improvement) System
 * Tracks layout improvements over time and measures impact
 */

// ============================================================================
// Types & Schemas
// ============================================================================

export const improvementSuggestionSchema = z.object({
    id: z.string(),
    category: z.enum(['equipment_placement', 'workflow', 'safety', 'organization', 'waste_reduction']),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    estimatedImpact: z.object({
        distanceReduction: z.number().optional(), // feet
        timeReduction: z.number().optional(), // minutes per day
        costSavings: z.number().optional(), // dollars per year
        efficiencyGain: z.number().optional(), // percentage
    }),
    effort: z.enum(['low', 'medium', 'high']), // Implementation effort
    status: z.enum(['suggested', 'planned', 'in_progress', 'completed', 'rejected']),
    createdAt: z.date(),
    completedAt: z.date().optional(),
});

export const kaizenEventSchema = z.object({
    id: z.string(),
    layoutId: z.number(),
    eventType: z.enum(['baseline', 'improvement', 'measurement']),
    date: z.date(),
    metrics: z.object({
        leanScore: z.number(),
        totalDistance: z.number(),
        efficiency: z.number(),
        wasteScore: z.number(),
        throughput: z.number().optional(), // units per day
    }),
    changes: z.array(z.string()).optional(), // What was changed
    notes: z.string().optional(),
});

export type ImprovementSuggestion = z.infer<typeof improvementSuggestionSchema>;
export type KaizenEvent = z.infer<typeof kaizenEventSchema>;

export interface KaizenDashboard {
    currentMetrics: {
        leanScore: number;
        totalDistance: number;
        efficiency: number;
        wasteScore: number;
    };
    improvements: {
        totalImplemented: number;
        totalSavings: number; // dollars per year
        distanceReduced: number; // feet
        efficiencyGained: number; // percentage points
    };
    timeline: KaizenEvent[];
    activeSuggestions: ImprovementSuggestion[];
    completedSuggestions: ImprovementSuggestion[];
}

// ============================================================================
// Kaizen Analysis
// ============================================================================

/**
 * Generate improvement suggestions based on lean analysis
 */
export function generateImprovementSuggestions(
    leanScore: number,
    workflowDistance: number,
    efficiency: number,
    equipmentCount: number
): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    const now = new Date();

    // 1. High travel distance
    if (workflowDistance > 300) {
        suggestions.push({
            id: `improve-${Date.now()}-1`,
            category: 'workflow',
            title: 'Reduce Material Travel Distance',
            description: `Current workflow requires ${workflowDistance} ft of travel. Relocate equipment to create a more compact workflow path.`,
            priority: workflowDistance > 500 ? 'critical' : 'high',
            estimatedImpact: {
                distanceReduction: workflowDistance * 0.4, // 40% reduction
                timeReduction: (workflowDistance * 0.4) / 200 * 60, // minutes saved per day
                costSavings: ((workflowDistance * 0.4) / 200 * 60 * 250 * 25), // $25/hr, 250 days
            },
            effort: 'high',
            status: 'suggested',
            createdAt: now,
        });
    }

    // 2. Low efficiency
    if (efficiency < 80) {
        suggestions.push({
            id: `improve-${Date.now()}-2`,
            category: 'waste_reduction',
            title: 'Eliminate Non-Value-Added Time',
            description: `Current efficiency is ${efficiency}%. Reduce transport and waiting time by optimizing equipment placement.`,
            priority: 'high',
            estimatedImpact: {
                efficiencyGain: 15,
                timeReduction: 30,
                costSavings: 30 * 250 * 25, // 30 min/day saved
            },
            effort: 'medium',
            status: 'suggested',
            createdAt: now,
        });
    }

    // 3. Equipment density
    const avgSpacing = workflowDistance / Math.max(1, equipmentCount - 1);
    if (avgSpacing > 100) {
        suggestions.push({
            id: `improve-${Date.now()}-3`,
            category: 'equipment_placement',
            title: 'Create Equipment Cells',
            description: `Equipment is spread out (avg ${Math.round(avgSpacing)} ft apart). Group related machines into manufacturing cells.`,
            priority: 'medium',
            estimatedImpact: {
                distanceReduction: avgSpacing * 0.5 * equipmentCount,
                efficiencyGain: 10,
                costSavings: 15000, // Annual savings from cell manufacturing
            },
            effort: 'high',
            status: 'suggested',
            createdAt: now,
        });
    }

    // 4. Organization improvements
    if (leanScore < 70) {
        suggestions.push({
            id: `improve-${Date.now()}-4`,
            category: 'organization',
            title: 'Implement 5S Methodology',
            description: 'Low lean score indicates organization issues. Implement Sort, Set in order, Shine, Standardize, Sustain.',
            priority: 'medium',
            estimatedImpact: {
                efficiencyGain: 8,
                costSavings: 10000,
            },
            effort: 'medium',
            status: 'suggested',
            createdAt: now,
        });
    }

    // 5. Quick wins
    suggestions.push({
        id: `improve-${Date.now()}-5`,
        category: 'organization',
        title: 'Add Tool Storage at Workstations',
        description: 'Reduce trips to tool crib by placing commonly-used tools at each workstation.',
        priority: 'low',
        estimatedImpact: {
            timeReduction: 15,
            costSavings: 15 * 250 * 25,
        },
        effort: 'low',
        status: 'suggested',
        createdAt: now,
    });

    return suggestions;
}

/**
 * Calculate improvement impact between two measurements
 */
export function calculateImprovementImpact(
    baseline: KaizenEvent,
    current: KaizenEvent
): {
    leanScoreChange: number;
    distanceChange: number;
    efficiencyChange: number;
    wasteScoreChange: number;
    percentImprovement: number;
} {
    return {
        leanScoreChange: current.metrics.leanScore - baseline.metrics.leanScore,
        distanceChange: current.metrics.totalDistance - baseline.metrics.totalDistance,
        efficiencyChange: current.metrics.efficiency - baseline.metrics.efficiency,
        wasteScoreChange: current.metrics.wasteScore - baseline.metrics.wasteScore,
        percentImprovement: ((current.metrics.leanScore - baseline.metrics.leanScore) / baseline.metrics.leanScore) * 100,
    };
}

/**
 * Generate Kaizen dashboard data
 */
export function generateKaizenDashboard(
    events: KaizenEvent[],
    suggestions: ImprovementSuggestion[]
): KaizenDashboard {
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
    const latestEvent = sortedEvents[sortedEvents.length - 1];
    const baseline = sortedEvents.find(e => e.eventType === 'baseline') || sortedEvents[0];

    const completedSuggestions = suggestions.filter(s => s.status === 'completed');
    const activeSuggestions = suggestions.filter(s => s.status !== 'completed' && s.status !== 'rejected');

    // Calculate total improvements
    const totalSavings = completedSuggestions.reduce(
        (sum, s) => sum + (s.estimatedImpact.costSavings || 0),
        0
    );
    const distanceReduced = completedSuggestions.reduce(
        (sum, s) => sum + (s.estimatedImpact.distanceReduction || 0),
        0
    );
    const efficiencyGained = completedSuggestions.reduce(
        (sum, s) => sum + (s.estimatedImpact.efficiencyGain || 0),
        0
    );

    return {
        currentMetrics: latestEvent ? latestEvent.metrics : {
            leanScore: 0,
            totalDistance: 0,
            efficiency: 0,
            wasteScore: 0,
        },
        improvements: {
            totalImplemented: completedSuggestions.length,
            totalSavings: Math.round(totalSavings),
            distanceReduced: Math.round(distanceReduced),
            efficiencyGained: Math.round(efficiencyGained),
        },
        timeline: sortedEvents,
        activeSuggestions,
        completedSuggestions,
    };
}

/**
 * Prioritize suggestions by ROI (Return on Investment)
 */
export function prioritizeSuggestionsByROI(
    suggestions: ImprovementSuggestion[]
): ImprovementSuggestion[] {
    return [...suggestions].sort((a, b) => {
        // Calculate simple ROI score
        const roiA = (a.estimatedImpact.costSavings || 0) / (a.effort === 'low' ? 1 : a.effort === 'medium' ? 2 : 3);
        const roiB = (b.estimatedImpact.costSavings || 0) / (b.effort === 'low' ? 1 : b.effort === 'medium' ? 2 : 3);
        return roiB - roiA;
    });
}

/**
 * Generate PDCA (Plan-Do-Check-Act) cycle recommendations
 */
export function generatePDCACycle(suggestion: ImprovementSuggestion): {
    plan: string[];
    do: string[];
    check: string[];
    act: string[];
} {
    return {
        plan: [
            `Define objective: ${suggestion.title}`,
            `Set target: ${suggestion.estimatedImpact.efficiencyGain || 0}% efficiency gain`,
            `Allocate resources: ${suggestion.effort} effort required`,
            'Create implementation timeline',
        ],
        do: [
            'Implement the change in a controlled area',
            'Document the process',
            'Train affected workers',
            'Monitor initial results',
        ],
        check: [
            'Measure actual vs. expected results',
            'Collect feedback from workers',
            'Identify any issues or obstacles',
            'Calculate actual ROI',
        ],
        act: [
            'If successful: Standardize the improvement',
            'If unsuccessful: Adjust and retry',
            'Document lessons learned',
            'Share best practices with team',
        ],
    };
}
