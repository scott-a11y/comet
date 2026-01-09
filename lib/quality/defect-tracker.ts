import { z } from 'zod';

/**
 * Quality Tracking & Defect Management
 * Track defects, identify Top 3, analyze trends
 */

// ============================================================================
// Types & Schemas
// ============================================================================

export const defectLogSchema = z.object({
    id: z.number().optional(),
    date: z.date(),
    productType: z.string(),
    defectType: z.string(),
    location: z.string(), // where in shop
    quantity: z.number().int().positive(),
    severity: z.enum(['minor', 'major', 'critical']),
    rootCause: z.string().optional(),
    correctiveAction: z.string().optional(),
    status: z.enum(['open', 'in_progress', 'resolved']).default('open'),
    assignedTo: z.string().optional(),
});

export type DefectLog = z.infer<typeof defectLogSchema>;

export interface DefectSummary {
    type: string;
    count: number;
    percentage: number;
    trend: 'increasing' | 'stable' | 'decreasing';
}

export interface QualityMetrics {
    totalDefects: number;
    defectRate: number; // defects per 100 units
    top3Defects: DefectSummary[];
    trend: 'improving' | 'stable' | 'declining';
    byLocation: Record<string, number>;
    bySeverity: {
        minor: number;
        major: number;
        critical: number;
    };
}

// ============================================================================
// Defect Analysis
// ============================================================================

/**
 * Calculate Top 3 defects (Pareto principle)
 */
export function calculateTop3Defects(defects: DefectLog[]): DefectSummary[] {
    // Group by defect type
    const defectCounts = new Map<string, number>();

    defects.forEach(defect => {
        const current = defectCounts.get(defect.defectType) || 0;
        defectCounts.set(defect.defectType, current + defect.quantity);
    });

    // Convert to array and sort
    const sorted = Array.from(defectCounts.entries())
        .map(([type, count]) => ({
            type,
            count,
            percentage: 0, // will calculate below
            trend: 'stable' as const,
        }))
        .sort((a, b) => b.count - a.count);

    // Calculate percentages
    const total = sorted.reduce((sum, item) => sum + item.count, 0);
    sorted.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });

    // Return top 3
    return sorted.slice(0, 3);
}

/**
 * Calculate defect trend
 */
export function calculateDefectTrend(
    currentPeriod: DefectLog[],
    previousPeriod: DefectLog[]
): 'improving' | 'stable' | 'declining' {
    const currentTotal = currentPeriod.reduce((sum, d) => sum + d.quantity, 0);
    const previousTotal = previousPeriod.reduce((sum, d) => sum + d.quantity, 0);

    if (previousTotal === 0) return 'stable';

    const change = ((currentTotal - previousTotal) / previousTotal) * 100;

    if (change < -10) return 'improving'; // 10% reduction
    if (change > 10) return 'declining'; // 10% increase
    return 'stable';
}

/**
 * Calculate quality metrics
 */
export function calculateQualityMetrics(
    defects: DefectLog[],
    totalUnitsProduced: number
): QualityMetrics {
    const totalDefects = defects.reduce((sum, d) => sum + d.quantity, 0);
    const defectRate = totalUnitsProduced > 0
        ? (totalDefects / totalUnitsProduced) * 100
        : 0;

    // Top 3 defects
    const top3Defects = calculateTop3Defects(defects);

    // By location
    const byLocation: Record<string, number> = {};
    defects.forEach(defect => {
        byLocation[defect.location] = (byLocation[defect.location] || 0) + defect.quantity;
    });

    // By severity
    const bySeverity = {
        minor: 0,
        major: 0,
        critical: 0,
    };
    defects.forEach(defect => {
        bySeverity[defect.severity] += defect.quantity;
    });

    return {
        totalDefects,
        defectRate: Math.round(defectRate * 100) / 100,
        top3Defects,
        trend: 'stable', // Would need historical data
        byLocation,
        bySeverity,
    };
}

/**
 * Get defects by date range
 */
export function getDefectsByDateRange(
    defects: DefectLog[],
    startDate: Date,
    endDate: Date
): DefectLog[] {
    return defects.filter(
        defect => defect.date >= startDate && defect.date <= endDate
    );
}

/**
 * Get defects by severity
 */
export function getDefectsBySeverity(
    defects: DefectLog[],
    severity: DefectLog['severity']
): DefectLog[] {
    return defects.filter(defect => defect.severity === severity);
}

/**
 * Get open defects
 */
export function getOpenDefects(defects: DefectLog[]): DefectLog[] {
    return defects.filter(defect => defect.status === 'open');
}

// ============================================================================
// Pareto Chart Data
// ============================================================================

export interface ParetoChartData {
    labels: string[];
    counts: number[];
    percentages: number[];
    cumulativePercentages: number[];
}

/**
 * Generate Pareto chart data
 */
export function generateParetoData(defects: DefectLog[]): ParetoChartData {
    // Group by defect type
    const defectCounts = new Map<string, number>();

    defects.forEach(defect => {
        const current = defectCounts.get(defect.defectType) || 0;
        defectCounts.set(defect.defectType, current + defect.quantity);
    });

    // Sort by count (descending)
    const sorted = Array.from(defectCounts.entries())
        .sort((a, b) => b[1] - a[1]);

    const total = sorted.reduce((sum, [, count]) => sum + count, 0);

    const labels: string[] = [];
    const counts: number[] = [];
    const percentages: number[] = [];
    const cumulativePercentages: number[] = [];

    let cumulative = 0;

    sorted.forEach(([type, count]) => {
        labels.push(type);
        counts.push(count);

        const percentage = total > 0 ? (count / total) * 100 : 0;
        percentages.push(Math.round(percentage * 10) / 10);

        cumulative += percentage;
        cumulativePercentages.push(Math.round(cumulative * 10) / 10);
    });

    return {
        labels,
        counts,
        percentages,
        cumulativePercentages,
    };
}

// ============================================================================
// Corrective Actions
// ============================================================================

export interface CorrectiveAction {
    id: number;
    defectType: string;
    action: string;
    implementedDate?: Date;
    effectiveness: 'pending' | 'effective' | 'ineffective';
    notes?: string;
}

/**
 * Track corrective action effectiveness
 */
export function evaluateActionEffectiveness(
    defectType: string,
    beforeDefects: DefectLog[],
    afterDefects: DefectLog[]
): 'effective' | 'ineffective' | 'pending' {
    const beforeCount = beforeDefects
        .filter(d => d.defectType === defectType)
        .reduce((sum, d) => sum + d.quantity, 0);

    const afterCount = afterDefects
        .filter(d => d.defectType === defectType)
        .reduce((sum, d) => sum + d.quantity, 0);

    if (afterDefects.length === 0) return 'pending';

    const reduction = ((beforeCount - afterCount) / beforeCount) * 100;

    return reduction >= 50 ? 'effective' : 'ineffective';
}

// ============================================================================
// Quality Score Integration
// ============================================================================

/**
 * Calculate quality score (0-100)
 */
export function calculateQualityScore(
    defectRate: number,
    criticalDefects: number,
    openDefects: number
): number {
    let score = 100;

    // Penalize for defect rate
    score -= Math.min(defectRate * 5, 40); // Max 40 point penalty

    // Penalize for critical defects
    score -= Math.min(criticalDefects * 2, 30); // Max 30 point penalty

    // Penalize for open defects
    score -= Math.min(openDefects, 30); // Max 30 point penalty

    return Math.max(0, Math.round(score));
}

/**
 * Get quality recommendations
 */
export function getQualityRecommendations(metrics: QualityMetrics): string[] {
    const recommendations: string[] = [];

    // Top defects
    if (metrics.top3Defects.length > 0) {
        const top = metrics.top3Defects[0];
        recommendations.push(
            `Focus on reducing "${top.type}" defects (${top.percentage}% of all defects)`
        );
    }

    // Defect rate
    if (metrics.defectRate > 5) {
        recommendations.push(
            `High defect rate (${metrics.defectRate}%). Target: <2% for world-class quality`
        );
    }

    // Critical defects
    if (metrics.bySeverity.critical > 0) {
        recommendations.push(
            `${metrics.bySeverity.critical} critical defects require immediate attention`
        );
    }

    // Location-based
    const hotspotLocation = Object.entries(metrics.byLocation)
        .sort((a, b) => b[1] - a[1])[0];

    if (hotspotLocation && hotspotLocation[1] > metrics.totalDefects * 0.3) {
        recommendations.push(
            `${hotspotLocation[0]} has ${hotspotLocation[1]} defects (${Math.round((hotspotLocation[1] / metrics.totalDefects) * 100)}%). Investigate this area.`
        );
    }

    return recommendations;
}
