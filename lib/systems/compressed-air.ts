/**
 * Compressed Air System Calculations
 * Based on industry standards for pneumatic systems
 */

export type AirPipeSize =
    | '1/2"' | '3/4"' | '1"' | '1-1/4"' | '1-1/2"'
    | '2"' | '2-1/2"' | '3"' | '4"' | '6"';

export type AirSystemParams = {
    flowSCFM: number; // Standard Cubic Feet per Minute
    pressurePSI: number; // Pounds per Square Inch
    lengthFt: number;
    maxPressureDropPSI?: number; // Default 1 PSI per 100ft
};

/**
 * Calculate pressure drop in compressed air piping
 * Using simplified Darcy-Weisbach equation for compressed air
 */
export function calculateAirPressureDrop(
    pipeSize: AirPipeSize,
    params: AirSystemParams
): { pressureDropPSI: number; pressureDropPer100Ft: number; velocity: number } {
    // Pipe internal diameters (inches)
    const pipeDiameters: Record<AirPipeSize, number> = {
        '1/2"': 0.622,
        '3/4"': 0.824,
        '1"': 1.049,
        '1-1/4"': 1.380,
        '1-1/2"': 1.610,
        '2"': 2.067,
        '2-1/2"': 2.469,
        '3"': 3.068,
        '4"': 4.026,
        '6"': 6.065
    };

    const diameter = pipeDiameters[pipeSize];
    const area = Math.PI * Math.pow(diameter / 2, 2); // sq in

    // Velocity (ft/min)
    const velocity = (params.flowSCFM * 144) / area; // Convert to ft/min

    // Simplified pressure drop formula for compressed air
    // ΔP ≈ 0.1025 * (Q^1.85 * L) / (D^4.97 * P)
    // Where Q = SCFM, L = length (ft), D = diameter (in), P = pressure (PSI)

    const pressureDrop =
        (0.1025 * Math.pow(params.flowSCFM, 1.85) * params.lengthFt) /
        (Math.pow(diameter, 4.97) * params.pressurePSI);

    const pressureDropPer100Ft = (pressureDrop / params.lengthFt) * 100;

    return {
        pressureDropPSI: pressureDrop,
        pressureDropPer100Ft,
        velocity
    };
}

/**
 * Calculate optimal pipe size for compressed air
 */
export function calculateOptimalAirPipeSize(params: AirSystemParams): {
    pipeSize: AirPipeSize;
    pressureDrop: number;
    velocity: number;
    warnings: string[];
} {
    const warnings: string[] = [];
    const maxDropPer100 = params.maxPressureDropPSI || 1;
    const pipeSizes: AirPipeSize[] = [
        '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"',
        '2"', '2-1/2"', '3"', '4"', '6"'
    ];

    for (const size of pipeSizes) {
        const result = calculateAirPressureDrop(size, params);

        if (result.pressureDropPer100Ft <= maxDropPer100) {
            // Check velocity (should be < 6000 fpm for noise/wear)
            if (result.velocity > 6000) {
                warnings.push(`High velocity (${result.velocity.toFixed(0)} fpm) - may cause noise`);
            }

            if (result.velocity < 1000) {
                warnings.push(`Low velocity (${result.velocity.toFixed(0)} fpm) - pipe may be oversized`);
            }

            return {
                pipeSize: size,
                pressureDrop: result.pressureDropPSI,
                velocity: result.velocity,
                warnings
            };
        }
    }

    warnings.push('⚠️ Pressure drop exceeds maximum - consider larger pipe or shorter run');

    // Return largest size
    const largestSize = pipeSizes[pipeSizes.length - 1];
    const result = calculateAirPressureDrop(largestSize, params);

    return {
        pipeSize: largestSize,
        pressureDrop: result.pressureDropPSI,
        velocity: result.velocity,
        warnings
    };
}

/**
 * Calculate compressor CFM requirement for multiple tools
 */
export function calculateCompressorRequirement(
    tools: Array<{ cfm: number; dutyCycle: number }> // dutyCycle 0-1
): { requiredCFM: number; recommendedHP: number } {
    // Average CFM = sum of (tool CFM * duty cycle)
    const avgCFM = tools.reduce((sum, tool) => sum + (tool.cfm * tool.dutyCycle), 0);

    // Add 20% safety factor
    const requiredCFM = avgCFM * 1.2;

    // Rough HP estimate (4 CFM per HP at 90 PSI for reciprocating compressor)
    const recommendedHP = Math.ceil(requiredCFM / 4);

    return { requiredCFM, recommendedHP };
}

/**
 * Calculate air receiver tank size
 * Based on demand fluctuations and compressor capacity
 */
export function calculateReceiverSize(
    compressorCFM: number,
    peakDemandCFM: number,
    allowablePressureDropPSI: number = 10
): { gallons: number; recommendation: string } {
    // Simplified formula: V = (C * T * (P1 - P2)) / (P_atm * 60)
    // Where V = volume (cu ft), C = CFM difference, T = time (min)

    const cfmDifference = peakDemandCFM - compressorCFM;

    if (cfmDifference <= 0) {
        return {
            gallons: 60, // Minimum recommended
            recommendation: 'Compressor can handle peak demand. Minimum 60 gallon tank recommended for stability.'
        };
    }

    // Assume 1 minute buffer time
    const volumeCuFt = (cfmDifference * 1 * allowablePressureDropPSI) / 14.7;
    const volumeGallons = volumeCuFt * 7.48; // Convert cu ft to gallons

    // Round up to standard tank sizes
    const standardSizes = [60, 80, 120, 200, 240, 300, 500];
    const recommendedSize = standardSizes.find(size => size >= volumeGallons) || 500;

    return {
        gallons: recommendedSize,
        recommendation: `${recommendedSize} gallon tank recommended to handle ${cfmDifference.toFixed(1)} CFM peak demand`
    };
}
