# Mechanical Systems Improvements Plan
**Project:** Comet - Wall Designer & Shop Design  
**Focus:** Enhanced Mechanical Flow & Design  
**Date:** 2026-01-04

---

## Current State Analysis

### ✅ What You Have:
1. **Ducting System** (`lib/systems/ducting.ts`)
   - Optimal diameter calculation
   - Velocity calculations
   - Friction loss calculations
   - Tests passing ✅

2. **Systems Layer** (`app/buildings/new/_components/systems-layer.tsx`)
   - Visual rendering of DUST, AIR, ELECTRICAL runs
   - Different colors per system type
   - Basic polyline drawing

3. **Database Schema**
   - `DustRun` - CFM, velocity, static pressure
   - `AirRun` - Pipe diameter, length
   - `ElectricalCircuit` - Voltage, phase, amps, wire gauge

4. **Wall Editor Integration**
   - Systems mode for drawing runs
   - Basic point-to-point routing

### ⚠️ What's Missing:
1. **Electrical calculations** (wire sizing, voltage drop, load calculations)
2. **Air system calculations** (pressure drop, flow rates)
3. **Advanced routing** (auto-routing, collision detection)
4. **System validation** (check for errors, warnings)
5. **Bill of materials** (fittings, connectors, wire, conduit)
6. **3D visualization** of systems
7. **Export to CAD** (DXF, PDF)

---

## Improvement Plan

### Phase 1: Complete the Calculation Libraries (Week 1)

#### 1.1 Electrical System Calculations

```typescript
// lib/systems/electrical.ts

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
 * Where: K = resistance constant, I = current, L = length, CM = circular mils
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
```

#### 1.2 Compressed Air System Calculations

```typescript
// lib/systems/compressed-air.ts

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
 * Using Darcy-Weisbach equation simplified for compressed air
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
  // ΔP = (f * L * ρ * V²) / (2 * D * 144)
  // Simplified: ΔP ≈ 0.1025 * (Q^1.85 * L) / (D^4.97 * P)
  
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
  const pipeSizes = Object.keys({
    '1/2"': 0, '3/4"': 0, '1"': 0, '1-1/4"': 0, '1-1/2"': 0,
    '2"': 0, '2-1/2"': 0, '3"': 0, '4"': 0, '6"': 0
  }) as AirPipeSize[];
  
  for (const size of pipeSizes) {
    const result = calculateAirPressureDrop(size, params);
    
    if (result.pressureDropPer100Ft <= maxDropPer100) {
      // Check velocity (should be < 6000 fpm for noise/wear)
      if (result.velocity > 6000) {
        warnings.push(`High velocity (${result.velocity.toFixed(0)} fpm) - may cause noise`);
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
  
  // Rough HP estimate (4 CFM per HP at 90 PSI)
  const recommendedHP = Math.ceil(requiredCFM / 4);
  
  return { requiredCFM, recommendedHP };
}
```

#### 1.3 Enhanced Ducting Calculations

```typescript
// lib/systems/ducting-advanced.ts

import { calculateOptimalDiameter, calculateVelocity, calculateFrictionLossPre100Ft } from './ducting';

export type DuctFitting = 
  | '90_elbow' | '45_elbow' | 'tee_branch' | 'tee_straight'
  | 'reducer' | 'wye' | 'blast_gate';

// Fitting loss coefficients (in equivalent feet of straight duct)
const FITTING_LOSSES: Record<DuctFitting, number> = {
  '90_elbow': 20, // 20 diameters
  '45_elbow': 10,
  'tee_branch': 60,
  'tee_straight': 20,
  'reducer': 10,
  'wye': 30,
  'blast_gate': 5
};

export type DuctRun = {
  cfm: number;
  diameterIn: number;
  lengthFt: number;
  fittings: DuctFitting[];
};

/**
 * Calculate total static pressure loss for a duct run including fittings
 */
export function calculateTotalStaticPressure(run: DuctRun): {
  straightLoss: number;
  fittingLoss: number;
  totalLoss: number;
  velocity: number;
} {
  // Straight duct loss
  const lossPerFoot = calculateFrictionLossPre100Ft(run.cfm, run.diameterIn) / 100;
  const straightLoss = lossPerFoot * run.lengthFt;
  
  // Fitting losses
  let fittingEquivalentLength = 0;
  for (const fitting of run.fittings) {
    const equivalentDiameters = FITTING_LOSSES[fitting];
    fittingEquivalentLength += (equivalentDiameters * run.diameterIn) / 12; // Convert to feet
  }
  
  const fittingLoss = lossPerFoot * fittingEquivalentLength;
  
  const velocity = calculateVelocity(run.cfm, run.diameterIn);
  
  return {
    straightLoss,
    fittingLoss,
    totalLoss: straightLoss + fittingLoss,
    velocity
  };
}

/**
 * Design a complete dust collection system
 */
export type DustCollectionMachine = {
  name: string;
  cfmRequired: number;
  portDiameterIn: number;
  distanceFromCollectorFt: number;
};

export function designDustSystem(machines: DustCollectionMachine[]): {
  collectorCFM: number;
  collectorStaticPressure: number;
  runs: Array<{
    machine: string;
    diameter: number;
    velocity: number;
    staticPressure: number;
  }>;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Calculate each branch
  const runs = machines.map(machine => {
    // Use machine's port diameter or calculate optimal
    const diameter = machine.portDiameterIn || 
                    Math.ceil(calculateOptimalDiameter(machine.cfmRequired, 4000));
    
    // Assume 2 elbows per run on average
    const run: DuctRun = {
      cfm: machine.cfmRequired,
      diameterIn: diameter,
      lengthFt: machine.distanceFromCollectorFt,
      fittings: ['90_elbow', '90_elbow', 'blast_gate']
    };
    
    const pressure = calculateTotalStaticPressure(run);
    
    if (pressure.velocity < 3500) {
      warnings.push(`${machine.name}: Low velocity (${pressure.velocity.toFixed(0)} fpm) - may not transport chips`);
    }
    if (pressure.velocity > 5000) {
      warnings.push(`${machine.name}: High velocity (${pressure.velocity.toFixed(0)} fpm) - excessive wear`);
    }
    
    return {
      machine: machine.name,
      diameter,
      velocity: pressure.velocity,
      staticPressure: pressure.totalLoss
    };
  });
  
  // Total CFM (assuming only one machine runs at a time, use max)
  const collectorCFM = Math.max(...machines.map(m => m.cfmRequired));
  
  // Worst-case static pressure (longest/highest resistance run)
  const collectorStaticPressure = Math.max(...runs.map(r => r.staticPressure));
  
  return {
    collectorCFM,
    collectorStaticPressure,
    runs,
    warnings
  };
}
```

---

### Phase 2: Enhanced UI Components (Week 2)

#### 2.1 System Design Panel

```typescript
// app/buildings/new/_components/SystemDesignPanel.tsx

'use client';

import { useState } from 'react';
import { calculateOptimalWireSize } from '@/lib/systems/electrical';
import { calculateOptimalAirPipeSize } from '@/lib/systems/compressed-air';
import { designDustSystem } from '@/lib/systems/ducting-advanced';

type SystemType = 'ELECTRICAL' | 'AIR' | 'DUST';

export function SystemDesignPanel() {
  const [systemType, setSystemType] = useState<SystemType>('DUST');
  
  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">
        System Design Calculator
      </h3>
      
      {/* System Type Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSystemType('DUST')}
          className={`px-3 py-2 rounded ${
            systemType === 'DUST' 
              ? 'bg-slate-600 text-white' 
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          Dust Collection
        </button>
        <button
          onClick={() => setSystemType('AIR')}
          className={`px-3 py-2 rounded ${
            systemType === 'AIR' 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          Compressed Air
        </button>
        <button
          onClick={() => setSystemType('ELECTRICAL')}
          className={`px-3 py-2 rounded ${
            systemType === 'ELECTRICAL' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          Electrical
        </button>
      </div>
      
      {/* System-specific forms */}
      {systemType === 'DUST' && <DustSystemForm />}
      {systemType === 'AIR' && <AirSystemForm />}
      {systemType === 'ELECTRICAL' && <ElectricalSystemForm />}
    </div>
  );
}
```

#### 2.2 Auto-Routing Algorithm

```typescript
// lib/routing/auto-route.ts

export type Point = { x: number; y: number };
export type Obstacle = { x: number; y: number; width: number; height: number };

/**
 * A* pathfinding for system routing
 */
export function autoRoute(
  start: Point,
  end: Point,
  obstacles: Obstacle[],
  gridSize: number = 12 // 1 foot grid
): Point[] {
  // Implementation of A* algorithm
  // Returns array of waypoints avoiding obstacles
  
  // Simplified version - orthogonal routing
  const path: Point[] = [start];
  
  // Try horizontal first, then vertical
  const midX = start.x;
  const midY = end.y;
  
  if (!isPointInObstacle({ x: midX, y: midY }, obstacles)) {
    path.push({ x: midX, y: midY });
  }
  
  path.push(end);
  
  return path;
}

function isPointInObstacle(point: Point, obstacles: Obstacle[]): boolean {
  return obstacles.some(obs => 
    point.x >= obs.x && 
    point.x <= obs.x + obs.width &&
    point.y >= obs.y && 
    point.y <= obs.y + obs.height
  );
}
```

---

### Phase 3: Validation & BOM (Week 3)

#### 3.1 System Validation

```typescript
// lib/validation/systems.ts

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateDustSystem(runs: DustRun[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const run of runs) {
    const velocity = calculateVelocity(run.cfm, run.diameterIn);
    
    if (velocity < 3500) {
      errors.push(`Run has velocity ${velocity.toFixed(0)} fpm - minimum 3500 fpm required for chip transport`);
    }
    
    if (velocity > 6000) {
      warnings.push(`Run has velocity ${velocity.toFixed(0)} fpm - may cause excessive wear`);
    }
    
    if (run.diameterIn < 4) {
      warnings.push(`Small diameter (${run.diameterIn}") may clog easily`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

#### 3.2 Bill of Materials Generator

```typescript
// lib/manufacturing/bom.ts

export type BOMItem = {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  partNumber?: string;
  estimatedCost?: number;
};

export function generateDuctBOM(runs: DuctRun[]): BOMItem[] {
  const bom: BOMItem[] = [];
  
  // Group by diameter
  const byDiameter = new Map<number, { length: number; fittings: DuctFitting[] }>();
  
  for (const run of runs) {
    const existing = byDiameter.get(run.diameterIn) || { length: 0, fittings: [] };
    existing.length += run.lengthFt;
    existing.fittings.push(...run.fittings);
    byDiameter.set(run.diameterIn, existing);
  }
  
  // Generate BOM
  for (const [diameter, data] of byDiameter) {
    bom.push({
      category: 'Duct Pipe',
      description: `${diameter}" Spiral Duct Pipe`,
      quantity: Math.ceil(data.length / 10) * 10, // Round up to 10ft sections
      unit: 'ft'
    });
    
    // Count fittings
    const fittingCounts = new Map<DuctFitting, number>();
    for (const fitting of data.fittings) {
      fittingCounts.set(fitting, (fittingCounts.get(fitting) || 0) + 1);
    }
    
    for (const [fitting, count] of fittingCounts) {
      bom.push({
        category: 'Fittings',
        description: `${diameter}" ${fitting.replace('_', ' ')}`,
        quantity: count,
        unit: 'ea'
      });
    }
  }
  
  return bom;
}
```

---

## Implementation Priority

### 🔴 High Priority (Do First):
1. ✅ Complete electrical calculations library
2. ✅ Complete air system calculations
3. ✅ Enhanced ducting with fittings
4. ✅ System design panel UI
5. ✅ Validation logic

### 🟡 Medium Priority (Do Next):
6. Auto-routing algorithm
7. BOM generation
8. 3D visualization of systems
9. Export to DXF/PDF

### 🟢 Low Priority (Nice to Have):
10. Advanced optimization (minimize material)
11. Cost estimation
12. Integration with suppliers
13. Mobile app

---

## Next Steps

**Ready to start?** I can:

1. **Implement Phase 1** - Build all the calculation libraries
2. **Add tests** - Comprehensive test coverage
3. **Create UI components** - System design panels
4. **Integrate with wall editor** - Enhanced systems mode

Which would you like me to start with?
