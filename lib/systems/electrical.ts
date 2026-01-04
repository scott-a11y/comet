/**
 * Electrical System Calculations
 * Based on NEC (National Electrical Code) standards
 */

export type WireSize =
    | '14 AWG' | '12 AWG' | '10 AWG' | '8 AWG' | '6 AWG'
    | '4 AWG' | '3 AWG' | '2 AWG' | '1 AWG' | '1/0 AWG'
    | '2/0 AWG' | '3/0 AWG' | '4/0 AWG';

export type ConduitSize =
    | '1/2"' | '3/4"' | '1"' | '1-1/4"' | '1-1/2"'
    | '2"' | '2-1/2"' | '3"' | '3-1/2"' | '4"';

// NEC ampacity tables (simplified - 75°C copper in conduit)
const AMPACITY_TABLE: Record<WireSize, number> = {
    '14 AWG': 20,
    '12 AWG': 25,
    '10 AWG': 35,
    '8 AWG': 50,
    '6 AWG': 65,
    '4 AWG': 85,
    '3 AWG': 100,
    '2 AWG': 115,
    '1 AWG': 130,
    '1/0 AWG': 150,
    '2/0 AWG': 175,
    '3/0 AWG': 200,
    '4/0 AWG': 230
};

// Wire resistance (ohms per 1000ft at 75°C)
const WIRE_RESISTANCE: Record<WireSize, number> = {
    '14 AWG': 3.07,
    '12 AWG': 1.93,
    '10 AWG': 1.21,
    '8 AWG': 0.764,
    '6 AWG': 0.491,
    '4 AWG': 0.308,
    '3 AWG': 0.245,
    '2 AWG': 0.194,
    '1 AWG': 0.154,
    '1/0 AWG': 0.122,
    '2/0 AWG': 0.0967,
    '3/0 AWG': 0.0766,
    '4/0 AWG': 0.0608
};

export type ElectricalLoad = {
    voltage: number;
    phase: 1 | 3;
    amps: number;
    powerFactor?: number; // Default 0.85 for motors
};

export type CircuitRun = {
    load: ElectricalLoad;
    lengthFt: number;
    maxVoltageDrop?: number; // Percentage (default 3%)
};

/**
 * Calculate minimum wire size based on ampacity
 */
export function calculateWireSizeByAmpacity(
    amps: number,
    derating: number = 1.0 // Derating factor for temperature, conduit fill, etc.
): WireSize {
    const requiredAmpacity = amps / derating;

    for (const [size, ampacity] of Object.entries(AMPACITY_TABLE)) {
        if (ampacity >= requiredAmpacity) {
            return size as WireSize;
        }
    }

    throw new Error(`Load ${amps}A exceeds maximum wire capacity`);
}

/**
 * Calculate voltage drop for a circuit
 * Formula: VD = 2 * K * I * L / CM (single phase)
 *          VD = 1.732 * K * I * L / CM (three phase)
 */
export function calculateVoltageDrop(
    wireSize: WireSize,
    lengthFt: number,
    amps: number,
    voltage: number,
    phase: 1 | 3
): { voltageDrop: number; percentDrop: number } {
    const resistance = WIRE_RESISTANCE[wireSize];

    // Total resistance for round trip (2x for single phase, 1.732x for 3-phase)
    const multiplier = phase === 1 ? 2 : 1.732;
    const totalResistance = (resistance * lengthFt) / 1000; // Convert to actual length

    const voltageDrop = multiplier * amps * totalResistance;
    const percentDrop = (voltageDrop / voltage) * 100;

    return { voltageDrop, percentDrop };
}

/**
 * Calculate optimal wire size considering both ampacity and voltage drop
 */
export function calculateOptimalWireSize(circuit: CircuitRun): {
    wireSize: WireSize;
    ampacity: number;
    voltageDrop: number;
    percentDrop: number;
    warnings: string[];
} {
    const warnings: string[] = [];
    const maxVD = circuit.maxVoltageDrop || 3;

    // Start with ampacity-based sizing
    let wireSize = calculateWireSizeByAmpacity(circuit.load.amps, 0.8); // 80% derating

    // Check voltage drop and upsize if needed
    let vd = calculateVoltageDrop(
        wireSize,
        circuit.lengthFt,
        circuit.load.amps,
        circuit.load.voltage,
        circuit.load.phase
    );

    // Upsize until voltage drop is acceptable
    const wireSizes = Object.keys(AMPACITY_TABLE) as WireSize[];
    let sizeIndex = wireSizes.indexOf(wireSize);

    while (vd.percentDrop > maxVD && sizeIndex < wireSizes.length - 1) {
        sizeIndex++;
        wireSize = wireSizes[sizeIndex];
        vd = calculateVoltageDrop(
            wireSize,
            circuit.lengthFt,
            circuit.load.amps,
            circuit.load.voltage,
            circuit.load.phase
        );
        warnings.push(`Upsized to ${wireSize} to meet voltage drop requirement`);
    }

    if (vd.percentDrop > maxVD) {
        warnings.push(`⚠️ Voltage drop ${vd.percentDrop.toFixed(2)}% exceeds ${maxVD}%`);
    }

    if (circuit.lengthFt > 100) {
        warnings.push(`Long run (${circuit.lengthFt}ft) - consider voltage drop carefully`);
    }

    return {
        wireSize,
        ampacity: AMPACITY_TABLE[wireSize],
        voltageDrop: vd.voltageDrop,
        percentDrop: vd.percentDrop,
        warnings
    };
}

/**
 * Calculate conduit fill (NEC Chapter 9)
 * Simplified - assumes THHN/THWN wire
 */
export function calculateConduitSize(
    wireSize: WireSize,
    numConductors: number
): ConduitSize {
    // Wire cross-sectional areas (sq in) - THHN
    const wireAreas: Record<WireSize, number> = {
        '14 AWG': 0.0097,
        '12 AWG': 0.0133,
        '10 AWG': 0.0211,
        '8 AWG': 0.0366,
        '6 AWG': 0.0507,
        '4 AWG': 0.0824,
        '3 AWG': 0.0973,
        '2 AWG': 0.1158,
        '1 AWG': 0.1562,
        '1/0 AWG': 0.1855,
        '2/0 AWG': 0.2223,
        '3/0 AWG': 0.2679,
        '4/0 AWG': 0.3237
    };

    // Conduit fill capacity at 40% (NEC)
    const conduitFill: Record<ConduitSize, number> = {
        '1/2"': 0.12,
        '3/4"': 0.21,
        '1"': 0.35,
        '1-1/4"': 0.61,
        '1-1/2"': 0.83,
        '2"': 1.36,
        '2-1/2"': 2.34,
        '3"': 3.54,
        '3-1/2"': 4.62,
        '4"': 5.86
    };

    const totalWireArea = wireAreas[wireSize] * numConductors;

    for (const [size, capacity] of Object.entries(conduitFill)) {
        if (capacity >= totalWireArea) {
            return size as ConduitSize;
        }
    }

    throw new Error(`Wire bundle too large for standard conduit`);
}

/**
 * Calculate breaker size (NEC 430.52 for motors, 210.20 for general)
 */
export function calculateBreakerSize(
    load: ElectricalLoad,
    isMotor: boolean = false
): number {
    // Standard breaker sizes
    const standardSizes = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100,
        110, 125, 150, 175, 200, 225, 250, 300, 350, 400];

    let minSize: number;

    if (isMotor) {
        // Motors: 250% of FLA for inverse time breakers (NEC 430.52)
        minSize = load.amps * 2.5;
    } else {
        // General loads: 125% of continuous load (NEC 210.20)
        minSize = load.amps * 1.25;
    }

    // Find next standard size up
    for (const size of standardSizes) {
        if (size >= minSize) {
            return size;
        }
    }

    throw new Error(`Load requires breaker larger than 400A`);
}
