/**
 * Layout Type Definitions
 * Derived from Prisma schema for type-safe layout handling
 */

import { Equipment, EquipmentPosition } from './equipment';

export interface LayoutInstance {
    id: number;
    shopBuildingId: number;
    name: string;
    description?: string;
    isActive: boolean;

    // Collision tracking
    hasCollisions: boolean;
    collisionCount: number;
    collisionData?: CollisionData[];
    lastCollisionCheck?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Relations
    equipmentPositions?: EquipmentPosition[];
    dustRuns?: DustRun[];
    airRuns?: AirRun[];
    circuits?: ElectricalCircuit[];
    systemRuns?: SystemRunRecord[];
    materialFlowPaths?: MaterialFlowPath[];

    // Counts
    _count?: {
        equipmentPositions: number;
        dustRuns: number;
        airRuns: number;
        circuits: number;
    };
}

export interface CollisionData {
    equipment1Id: number;
    equipment2Id: number;
    equipment1Name: string;
    equipment2Name: string;
    overlapArea: number;
}

export interface SystemRunRecord {
    id: number;
    layoutId: number;
    systemType: 'DUST' | 'AIR' | 'ELECTRICAL';
    points: Array<{ x: number; y: number; z?: number }>;
    diameter?: number;
    gauge?: string;
    calculatedFlowRate?: number;
    calculatedPressureDrop?: number;
    status: 'planned' | 'installed' | 'inspected';
    createdAt: Date;
    updatedAt: Date;
}

export interface DustRun {
    id: number;
    layoutId: number;
    fromEquipmentId?: number;
    toUtilityId?: number;
    diameterIn: number;
    lengthFt: number;
    cfm?: number;
    velocityFpm?: number;
    staticLoss?: number;
}

export interface AirRun {
    id: number;
    layoutId: number;
    fromUtilityId: number;
    toEquipmentId?: number;
    diameterIn: number;
    lengthFt: number;
}

export interface ElectricalCircuit {
    id: number;
    layoutId: number;
    panelUtilityId: number;
    name: string;
    breakerAmps: number;
    wireGauge: string;
    lengthFt: number;
    voltageDrop?: number;
}

export interface MaterialFlowPath {
    id: number;
    layoutId: number;
    name: string;
    pathType: 'primary' | 'secondary' | 'waste';
    points: Array<{ x: number; y: number }>;
    color?: string;
}

export interface CreateLayoutInput {
    shopBuildingId: number;
    name: string;
    description?: string;
}

export interface UpdateLayoutInput extends Partial<CreateLayoutInput> {
    id: number;
    isActive?: boolean;
}

// Layout summary for list views
export interface LayoutSummary {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    hasCollisions: boolean;
    equipmentCount: number;
    createdAt: Date;
}
