
/**
 * Systems Engineering - Ducting Calculations
 * Based on standard formulas for industrial ventilation.
 */

// Common velocities (FPM)
export const VELOCITY_STANDARDS = {
    MAIN_LINE: 3500, // Standard for wood dust
    BRANCH_LINE: 4000,
    RETURN_AIR: 2000,
};

/**
 * Calculate optimal duct diameter for a given flow and velocity.
 * @param cfm Cubic Feet per Minute
 * @param targetVelocityFpm Feet per Minute (default 4000 for transport)
 * @returns diameter in inches (rounded to nearest inch typically, but returning float here)
 */
export function calculateOptimalDiameter(cfm: number, targetVelocityFpm: number = 4000): number {
    if (cfm <= 0 || targetVelocityFpm <= 0) return 0;

    // Q = V * A
    // A (sq ft) = Q / V
    const areaSqFt = cfm / targetVelocityFpm;

    // A = pi * (d/24)^2  (d in inches, r in feet = d/24)
    // or A = pi * r^2 = pi * (d/12 / 2)^2 = pi * (d^2 / 576) ? No.
    // r (ft) = d (in) / 24.
    // A = pi * (d/24)^2 = pi * d^2 / 576
    // d^2 = A * 576 / pi
    // d = sqrt(A * 576 / pi)

    const diameter = Math.sqrt((areaSqFt * 576) / Math.PI);
    return diameter;
}

/**
 * Calculate actual velocity given flow and diameter.
 */
export function calculateVelocity(cfm: number, diameterIn: number): number {
    if (diameterIn <= 0) return 0;
    const areaSqFt = (Math.PI * Math.pow(diameterIn / 24, 2));
    return cfm / areaSqFt;
}

/**
 * Calculate friction loss per 100ft.
 * Uses simplified standard approximation for galvanized steel spiral pipe.
 * 
 * Standard formula approximation (Friedman/Circle):
 * h_f = 1.36 * (V/4005)^1.9 * (1/d)^1.22  (for 100ft) - Typical rule of thumb variation.
 * 
 * We will use acgih/ashrae simplified:
 * Loss ~ coefficient * (Velocity/4000)^2 / Diameter
 */
export function calculateFrictionLossPre100Ft(cfm: number, diameterIn: number): number {
    const v = calculateVelocity(cfm, diameterIn);
    // Simplified relationship for standard air
    // VP = (V/4005)^2
    const vp = Math.pow(v / 4005, 2);

    // Typical loss for straight duct is roughly 55 diameters of length = 1 VP loss?
    // Or use standard friction chart equation:
    // h = 0.109136 * q^1.9 / d^5.02 (inch-pound units) - for round galvanized.

    const h = (0.109136 * Math.pow(cfm, 1.9)) / Math.pow(diameterIn, 5.02);
    return h;
}
