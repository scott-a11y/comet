/**
 * Equipment Type Definitions
 * Derived from Prisma schema for type-safe equipment handling
 */

export interface PowerSpecs {
    voltage: number;
    phase: 1 | 3;
    amps: number;
    powerKw?: number;
    circuitType: 'standard' | 'dedicated' | 'high-voltage';
}

export interface DustSpecs {
    portDiameterIn: number;
    cfmRequired: number;
    staticPressure?: number;
}

export interface AirSpecs {
    portDiameterIn: number;
    pressureBar: number;
    flowScfm?: number;
}

export interface Equipment {
    id: number;
    shopBuildingId: number;
    name: string;
    category: EquipmentCategory;
    widthFt: number;
    depthFt: number;
    heightFt?: number;
    orientation: number;
    preferredZoneId?: number;
    requiresDust: boolean;
    requiresAir: boolean;
    requiresHighVoltage: boolean;
    notes?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: Date;
    warrantyExpires?: Date;
    maintenanceIntervalDays?: number;
    createdAt: Date;
    updatedAt: Date;

    // Relations
    powerSpecs?: PowerSpecs;
    dustSpecs?: DustSpecs;
    airSpecs?: AirSpecs;
}

export type EquipmentCategory =
    | 'table-saw'
    | 'cnc'
    | 'planer'
    | 'jointer'
    | 'workbench'
    | 'assembly'
    | 'finishing'
    | 'storage'
    | 'dust-collector'
    | 'compressor'
    | 'other';

export interface EquipmentPosition {
    id: number;
    layoutId: number;
    equipmentId: number;
    x: number;
    y: number;
    orientation: number;
    equipment?: Equipment;
}

export interface CreateEquipmentInput {
    shopBuildingId: number;
    name: string;
    category: EquipmentCategory;
    widthFt: number;
    depthFt: number;
    heightFt?: number;
    orientation?: number;
    preferredZoneId?: number;
    requiresDust?: boolean;
    requiresAir?: boolean;
    requiresHighVoltage?: boolean;
    notes?: string;
}

export interface UpdateEquipmentInput extends Partial<CreateEquipmentInput> {
    id: number;
}

// Equipment with safety clearances
export interface EquipmentWithClearance extends Equipment {
    clearanceFront: number;
    clearanceBack: number;
    clearanceLeft: number;
    clearanceRight: number;
}
