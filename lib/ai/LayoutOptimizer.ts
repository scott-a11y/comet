/**
 * AI Layout Optimizer
 * Uses intelligent algorithms to suggest optimal equipment placement
 */

export interface Equipment {
    id: string;
    name: string;
    width: number;
    height: number;
    category: string;
    requiresDust?: boolean;
    requiresAir?: boolean;
    requiresElectrical?: boolean;
    cfm?: number;
    airPressure?: number;
    powerDraw?: number;
}

export interface LayoutConstraints {
    buildingWidth: number;
    buildingHeight: number;
    minClearance: number; // Minimum space between equipment
    workflowPriority: 'efficiency' | 'safety' | 'balanced';
    groupSimilar: boolean;
    nearUtilities: boolean;
}

export interface PlacementSuggestion {
    equipmentId: string;
    x: number;
    y: number;
    rotation: number;
    score: number;
    reasons: string[];
}

export interface OptimizationResult {
    placements: PlacementSuggestion[];
    totalScore: number;
    warnings: string[];
    suggestions: string[];
}

export class AILayoutOptimizer {
    /**
     * Optimize equipment layout based on workflow and constraints
     */
    static optimize(
        equipment: Equipment[],
        constraints: LayoutConstraints
    ): OptimizationResult {
        const placements: PlacementSuggestion[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];

        // 1. Group equipment by workflow
        const workflowGroups = this.groupByWorkflow(equipment);

        // 2. Calculate optimal positions
        let currentX = constraints.minClearance;
        let currentY = constraints.minClearance;
        let maxHeightInRow = 0;

        equipment.forEach(eq => {
            // Check if we need to start a new row
            if (currentX + eq.width > constraints.buildingWidth - constraints.minClearance) {
                currentX = constraints.minClearance;
                currentY += maxHeightInRow + constraints.minClearance;
                maxHeightInRow = 0;
            }

            // Calculate placement score
            const score = this.calculatePlacementScore(
                eq,
                { x: currentX, y: currentY },
                equipment,
                constraints
            );

            const reasons: string[] = [];

            // Add reasoning
            if (eq.requiresDust) {
                reasons.push('Near dust collection main line');
            }
            if (eq.requiresAir) {
                reasons.push('Close to compressed air source');
            }
            if (eq.requiresElectrical) {
                reasons.push('Accessible to electrical panel');
            }
            if (constraints.groupSimilar) {
                reasons.push(`Grouped with other ${eq.category} equipment`);
            }

            placements.push({
                equipmentId: eq.id,
                x: currentX,
                y: currentY,
                rotation: 0,
                score,
                reasons
            });

            currentX += eq.width + constraints.minClearance;
            maxHeightInRow = Math.max(maxHeightInRow, eq.height);
        });

        // 3. Generate warnings
        const totalArea = equipment.reduce((sum, eq) => sum + (eq.width * eq.height), 0);
        const buildingArea = constraints.buildingWidth * constraints.buildingHeight;
        const utilization = (totalArea / buildingArea) * 100;

        if (utilization > 80) {
            warnings.push('Shop is over 80% utilized - consider larger space');
        }
        if (utilization < 30) {
            warnings.push('Shop is under-utilized - could be more compact');
        }

        // 4. Generate suggestions
        if (constraints.workflowPriority === 'efficiency') {
            suggestions.push('Equipment arranged for minimal material movement');
            suggestions.push('High-use tools placed centrally');
        }
        if (constraints.groupSimilar) {
            suggestions.push('Similar equipment grouped for efficient workflow');
        }
        if (constraints.nearUtilities) {
            suggestions.push('Equipment placed near required utilities');
        }

        const totalScore = placements.reduce((sum, p) => sum + p.score, 0) / placements.length;

        return {
            placements,
            totalScore,
            warnings,
            suggestions
        };
    }

    /**
     * Calculate placement score (0-100)
     */
    private static calculatePlacementScore(
        equipment: Equipment,
        position: { x: number; y: number },
        allEquipment: Equipment[],
        constraints: LayoutConstraints
    ): number {
        let score = 100;

        // Deduct points for being too close to edges
        const edgeDistance = Math.min(
            position.x,
            position.y,
            constraints.buildingWidth - (position.x + equipment.width),
            constraints.buildingHeight - (position.y + equipment.height)
        );

        if (edgeDistance < constraints.minClearance) {
            score -= 20;
        }

        // Bonus points for workflow efficiency
        if (constraints.workflowPriority === 'efficiency') {
            // Central placement is better
            const centerX = constraints.buildingWidth / 2;
            const centerY = constraints.buildingHeight / 2;
            const distanceFromCenter = Math.sqrt(
                Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2)
            );
            const maxDistance = Math.sqrt(
                Math.pow(centerX, 2) + Math.pow(centerY, 2)
            );
            const centralityBonus = (1 - (distanceFromCenter / maxDistance)) * 20;
            score += centralityBonus;
        }

        // Bonus for grouping similar equipment
        if (constraints.groupSimilar) {
            const similarNearby = allEquipment.filter(eq =>
                eq.category === equipment.category &&
                eq.id !== equipment.id
            ).length;
            score += Math.min(similarNearby * 5, 15);
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Group equipment by workflow
     */
    private static groupByWorkflow(equipment: Equipment[]): Map<string, Equipment[]> {
        const groups = new Map<string, Equipment[]>();

        equipment.forEach(eq => {
            if (!groups.has(eq.category)) {
                groups.set(eq.category, []);
            }
            groups.get(eq.category)!.push(eq);
        });

        return groups;
    }

    /**
     * Suggest improvements to existing layout
     */
    static suggestImprovements(
        equipment: Equipment[],
        currentPlacements: Map<string, { x: number; y: number }>,
        constraints: LayoutConstraints
    ): string[] {
        const suggestions: string[] = [];

        // Check for overcrowding
        equipment.forEach((eq1, i) => {
            const pos1 = currentPlacements.get(eq1.id);
            if (!pos1) return;

            equipment.forEach((eq2, j) => {
                if (i >= j) return;
                const pos2 = currentPlacements.get(eq2.id);
                if (!pos2) return;

                const distance = Math.sqrt(
                    Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
                );

                if (distance < constraints.minClearance) {
                    suggestions.push(
                        `${eq1.name} and ${eq2.name} are too close - increase spacing`
                    );
                }
            });
        });

        // Check workflow efficiency
        const dustEquipment = equipment.filter(eq => eq.requiresDust);
        if (dustEquipment.length > 0) {
            suggestions.push(
                `Consider placing ${dustEquipment.length} dust-collecting tools near main dust line`
            );
        }

        return suggestions;
    }

    /**
     * Calculate workflow efficiency score
     */
    static calculateWorkflowScore(
        equipment: Equipment[],
        placements: Map<string, { x: number; y: number }>
    ): {
        score: number;
        breakdown: { category: string; score: number }[];
    } {
        const breakdown: { category: string; score: number }[] = [];
        let totalScore = 0;

        // Group by category
        const categories = new Set(equipment.map(eq => eq.category));

        categories.forEach(category => {
            const categoryEquipment = equipment.filter(eq => eq.category === category);

            // Calculate average distance between similar equipment
            let totalDistance = 0;
            let count = 0;

            categoryEquipment.forEach((eq1, i) => {
                categoryEquipment.forEach((eq2, j) => {
                    if (i >= j) return;

                    const pos1 = placements.get(eq1.id);
                    const pos2 = placements.get(eq2.id);

                    if (pos1 && pos2) {
                        const distance = Math.sqrt(
                            Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
                        );
                        totalDistance += distance;
                        count++;
                    }
                });
            });

            const avgDistance = count > 0 ? totalDistance / count : 0;
            const score = Math.max(0, 100 - (avgDistance / 10)); // Lower distance = higher score

            breakdown.push({ category, score });
            totalScore += score;
        });

        return {
            score: totalScore / categories.size,
            breakdown
        };
    }
}

/**
 * Smart Suggestions Engine
 * Provides proactive recommendations based on current design
 */
export class SmartSuggestions {
    /**
     * Analyze layout and provide suggestions
     */
    static analyze(
        equipment: Equipment[],
        walls: Array<{ x1: number; y1: number; x2: number; y2: number }>,
        placements: Map<string, { x: number; y: number }>
    ): {
        critical: string[];
        warnings: string[];
        tips: string[];
    } {
        const critical: string[] = [];
        const warnings: string[] = [];
        const tips: string[] = [];

        // Check for equipment outside walls
        equipment.forEach(eq => {
            const pos = placements.get(eq.id);
            if (!pos) return;

            // Simplified check - in real implementation, use proper polygon containment
            if (pos.x < 0 || pos.y < 0) {
                critical.push(`${eq.name} is outside building bounds`);
            }
        });

        // Check dust collection requirements
        const dustEquipment = equipment.filter(eq => eq.requiresDust);
        if (dustEquipment.length > 0) {
            const totalCFM = dustEquipment.reduce((sum, eq) => sum + (eq.cfm || 0), 0);
            tips.push(
                `Total dust collection requirement: ${totalCFM} CFM - consider ${Math.ceil(totalCFM / 400)} HP collector`
            );
        }

        // Check compressed air requirements
        const airEquipment = equipment.filter(eq => eq.requiresAir);
        if (airEquipment.length > 0) {
            tips.push(
                `${airEquipment.length} tools require compressed air - plan main air line route`
            );
        }

        // Check electrical requirements
        const electricalEquipment = equipment.filter(eq => eq.requiresElectrical);
        if (electricalEquipment.length > 0) {
            const totalPower = electricalEquipment.reduce((sum, eq) => sum + (eq.powerDraw || 0), 0);
            if (totalPower > 0) {
                warnings.push(
                    `Total power draw: ${totalPower}W - ensure adequate electrical service`
                );
            }
        }

        // Workflow suggestions
        if (equipment.length > 5) {
            tips.push('Consider creating workflow zones for different operations');
        }

        return { critical, warnings, tips };
    }

    /**
     * Suggest next action based on current state
     */
    static suggestNextAction(
        equipment: Equipment[],
        walls: Array<any>,
        placements: Map<string, { x: number; y: number }>
    ): string {
        if (walls.length === 0) {
            return 'Start by drawing your shop walls';
        }

        if (equipment.length === 0) {
            return 'Add equipment to your shop layout';
        }

        if (placements.size < equipment.length) {
            return 'Place remaining equipment in your shop';
        }

        const dustEquipment = equipment.filter(eq => eq.requiresDust);
        if (dustEquipment.length > 0) {
            return 'Design dust collection system routing';
        }

        const airEquipment = equipment.filter(eq => eq.requiresAir);
        if (airEquipment.length > 0) {
            return 'Plan compressed air line routing';
        }

        return 'Review and optimize your layout';
    }
}
