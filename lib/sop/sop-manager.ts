import { z } from 'zod';

/**
 * Standard Operating Procedures (SOP) Management
 * Create, manage, and track SOPs with photo instructions and QR codes
 */

// ============================================================================
// Types & Schemas
// ============================================================================

export const sopStepSchema = z.object({
    id: z.number().optional(),
    order: z.number().int().positive(),
    instruction: z.string().min(1),
    photoUrl: z.string().url().optional(),
    duration: z.number().positive().optional(), // minutes
    safetyNote: z.string().optional(),
});

export const sopSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    equipmentId: z.number().optional(),
    category: z.enum(['setup', 'operation', 'maintenance', 'safety', 'quality', 'other']),
    version: z.number().int().positive().default(1),
    status: z.enum(['draft', 'active', 'archived']).default('draft'),
    steps: z.array(sopStepSchema),
    tags: z.array(z.string()),
    createdBy: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type SOPStep = z.infer<typeof sopStepSchema>;
export type SOP = z.infer<typeof sopSchema>;

export interface SOPWithQR extends SOP {
    qrCode: string; // data URL
}

// ============================================================================
// SOP Management
// ============================================================================

/**
 * Create a new SOP
 */
export function createSOP(data: Omit<SOP, 'id' | 'version' | 'createdAt' | 'updatedAt'>): SOP {
    return {
        ...data,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Update SOP (creates new version)
 */
export function updateSOP(sop: SOP, changes: Partial<SOP>, incrementVersion = false): SOP {
    return {
        ...sop,
        ...changes,
        version: incrementVersion ? sop.version + 1 : sop.version,
        updatedAt: new Date(),
    };
}

/**
 * Add step to SOP
 */
export function addStep(sop: SOP, step: Omit<SOPStep, 'id' | 'order'>): SOP {
    const newStep: SOPStep = {
        ...step,
        order: sop.steps.length + 1,
    };

    return {
        ...sop,
        steps: [...sop.steps, newStep],
        updatedAt: new Date(),
    };
}

/**
 * Reorder steps
 */
export function reorderSteps(sop: SOP, newOrder: number[]): SOP {
    const reorderedSteps = newOrder.map((oldIndex, newIndex) => ({
        ...sop.steps[oldIndex],
        order: newIndex + 1,
    }));

    return {
        ...sop,
        steps: reorderedSteps,
        updatedAt: new Date(),
    };
}

/**
 * Calculate total estimated time
 */
export function calculateTotalTime(sop: SOP): number {
    return sop.steps.reduce((total, step) => total + (step.duration || 0), 0);
}

/**
 * Get steps with safety notes
 */
export function getSafetySteps(sop: SOP): SOPStep[] {
    return sop.steps.filter(step => step.safetyNote);
}

// ============================================================================
// SOP Search & Filter
// ============================================================================

/**
 * Search SOPs by text
 */
export function searchSOPs(sops: SOP[], query: string): SOP[] {
    const lowerQuery = query.toLowerCase();
    return sops.filter(sop =>
        sop.title.toLowerCase().includes(lowerQuery) ||
        sop.description?.toLowerCase().includes(lowerQuery) ||
        sop.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        sop.steps.some(step => step.instruction.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Filter SOPs by category
 */
export function filterByCategory(sops: SOP[], category: SOP['category']): SOP[] {
    return sops.filter(sop => sop.category === category);
}

/**
 * Filter SOPs by status
 */
export function filterByStatus(sops: SOP[], status: SOP['status']): SOP[] {
    return sops.filter(sop => sop.status === status);
}

/**
 * Filter SOPs by tag
 */
export function filterByTag(sops: SOP[], tag: string): SOP[] {
    return sops.filter(sop => sop.tags.includes(tag));
}

/**
 * Get SOPs for specific equipment
 */
export function getSOPsForEquipment(sops: SOP[], equipmentId: number): SOP[] {
    return sops.filter(sop => sop.equipmentId === equipmentId);
}

// ============================================================================
// SOP Statistics
// ============================================================================

export interface SOPStats {
    total: number;
    byStatus: {
        draft: number;
        active: number;
        archived: number;
    };
    byCategory: Record<SOP['category'], number>;
    totalSteps: number;
    averageSteps: number;
    withPhotos: number;
    withSafetyNotes: number;
}

/**
 * Calculate SOP statistics
 */
export function calculateSOPStats(sops: SOP[]): SOPStats {
    const stats: SOPStats = {
        total: sops.length,
        byStatus: { draft: 0, active: 0, archived: 0 },
        byCategory: {
            setup: 0,
            operation: 0,
            maintenance: 0,
            safety: 0,
            quality: 0,
            other: 0,
        },
        totalSteps: 0,
        averageSteps: 0,
        withPhotos: 0,
        withSafetyNotes: 0,
    };

    sops.forEach(sop => {
        // Status
        stats.byStatus[sop.status]++;

        // Category
        stats.byCategory[sop.category]++;

        // Steps
        stats.totalSteps += sop.steps.length;

        // Photos
        if (sop.steps.some(step => step.photoUrl)) {
            stats.withPhotos++;
        }

        // Safety notes
        if (sop.steps.some(step => step.safetyNote)) {
            stats.withSafetyNotes++;
        }
    });

    stats.averageSteps = sops.length > 0 ? Math.round(stats.totalSteps / sops.length) : 0;

    return stats;
}

// ============================================================================
// SOP Validation
// ============================================================================

export interface SOPValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validate SOP completeness
 */
export function validateSOP(sop: SOP): SOPValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!sop.title || sop.title.trim().length === 0) {
        errors.push('Title is required');
    }

    if (sop.steps.length === 0) {
        errors.push('At least one step is required');
    }

    // Step validation
    sop.steps.forEach((step, index) => {
        if (!step.instruction || step.instruction.trim().length === 0) {
            errors.push(`Step ${index + 1}: Instruction is required`);
        }

        if (step.instruction && step.instruction.length < 10) {
            warnings.push(`Step ${index + 1}: Instruction is very short`);
        }
    });

    // Warnings
    if (!sop.description) {
        warnings.push('Description is recommended');
    }

    if (sop.steps.length > 0 && !sop.steps.some(step => step.photoUrl)) {
        warnings.push('Consider adding photos to steps');
    }

    const safetySteps = getSafetySteps(sop);
    if (sop.category === 'safety' && safetySteps.length === 0) {
        warnings.push('Safety SOP should have safety notes');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// SOP Export
// ============================================================================

/**
 * Export SOP to printable format
 */
export function exportSOPToPrint(sop: SOP): string {
    let output = `# ${sop.title}\n\n`;

    if (sop.description) {
        output += `${sop.description}\n\n`;
    }

    output += `**Version:** ${sop.version}\n`;
    output += `**Category:** ${sop.category}\n`;
    output += `**Status:** ${sop.status}\n\n`;

    if (sop.tags.length > 0) {
        output += `**Tags:** ${sop.tags.join(', ')}\n\n`;
    }

    output += `## Steps\n\n`;

    sop.steps.forEach((step, index) => {
        output += `### Step ${index + 1}\n\n`;
        output += `${step.instruction}\n\n`;

        if (step.duration) {
            output += `⏱️ **Estimated time:** ${step.duration} minutes\n\n`;
        }

        if (step.safetyNote) {
            output += `⚠️ **Safety:** ${step.safetyNote}\n\n`;
        }

        if (step.photoUrl) {
            output += `![Step ${index + 1}](${step.photoUrl})\n\n`;
        }
    });

    const totalTime = calculateTotalTime(sop);
    if (totalTime > 0) {
        output += `\n**Total estimated time:** ${totalTime} minutes\n`;
    }

    return output;
}
