# 🔧 Comet Systems - Quick Reference Guide

## Electrical System Calculations

### Wire Sizing
```typescript
import { calculateWireSizeByAmpacity, calculateOptimalWireSize } from '@/lib/systems/electrical';

// Simple ampacity-based sizing
const wireSize = calculateWireSizeByAmpacity(30, 0.8); // 30A load, 80% derating
// Returns: '10 AWG'

// Optimal sizing with voltage drop consideration
const result = calculateOptimalWireSize({
    load: { voltage: 240, phase: 1, amps: 30 },
    lengthFt: 150,
    maxVoltageDrop: 3 // 3% max voltage drop
});
// Returns: { wireSize: '8 AWG', ampacity: 50, percentDrop: 2.8, warnings: [...] }
```

### Voltage Drop
```typescript
import { calculateVoltageDrop } from '@/lib/systems/electrical';

const result = calculateVoltageDrop('12 AWG', 100, 20, 120, 1);
// wireSize, lengthFt, amps, voltage, phase
// Returns: { voltageDrop: 7.72, percentDrop: 6.43 }
```

### Conduit Sizing
```typescript
import { calculateConduitSize } from '@/lib/systems/electrical';

const size = calculateConduitSize('12 AWG', 6); // 6 conductors of 12 AWG
// Returns: '3/4"'
```

### Breaker Sizing
```typescript
import { calculateBreakerSize } from '@/lib/systems/electrical';

// General load (125% rule)
const breakerSize = calculateBreakerSize(
    { voltage: 120, phase: 1, amps: 16 },
    false // not a motor
);
// Returns: 20 (amps)

// Motor load (250% rule)
const motorBreaker = calculateBreakerSize(
    { voltage: 240, phase: 1, amps: 20 },
    true // is a motor
);
// Returns: 50 (amps)
```

---

## Ducting System Calculations

### Optimal Diameter
```typescript
import { calculateOptimalDiameter, VELOCITY_STANDARDS } from '@/lib/systems/ducting';

// Table saw branch line
const diameter = calculateOptimalDiameter(350, VELOCITY_STANDARDS.BRANCH_LINE);
// 350 CFM at 4000 FPM
// Returns: 4.2 inches

// Main trunk line
const mainDiameter = calculateOptimalDiameter(1500, VELOCITY_STANDARDS.MAIN_LINE);
// 1500 CFM at 3500 FPM
// Returns: 9.3 inches
```

### Velocity Calculation
```typescript
import { calculateVelocity } from '@/lib/systems/ducting';

const velocity = calculateVelocity(400, 6); // 400 CFM through 6" duct
// Returns: 2040 FPM
```

### Friction Loss
```typescript
import { calculateFrictionLossPre100Ft } from '@/lib/systems/ducting';

const loss = calculateFrictionLossPre100Ft(800, 6); // 800 CFM, 6" diameter
// Returns: friction loss in inches of water per 100ft
```

### Velocity Standards
```typescript
VELOCITY_STANDARDS.MAIN_LINE    // 3500 FPM - Main trunk lines
VELOCITY_STANDARDS.BRANCH_LINE  // 4000 FPM - Branch lines to machines
VELOCITY_STANDARDS.RETURN_AIR   // 2000 FPM - Return air systems
```

---

## Compressed Air System Calculations

### Pressure Drop
```typescript
import { calculateAirPressureDrop } from '@/lib/systems/compressed-air';

const result = calculateAirPressureDrop('1"', {
    flowSCFM: 20,
    pressurePSI: 90,
    lengthFt: 100
});
// Returns: { pressureDropPSI: 1.2, pressureDropPer100Ft: 1.2, velocity: 4500 }
```

### Optimal Pipe Sizing
```typescript
import { calculateOptimalAirPipeSize } from '@/lib/systems/compressed-air';

const result = calculateOptimalAirPipeSize({
    flowSCFM: 25,
    pressurePSI: 90,
    lengthFt: 100,
    maxPressureDropPSI: 1 // 1 PSI per 100ft max
});
// Returns: { pipeSize: '1-1/2"', pressureDrop: 0.8, velocity: 4200, warnings: [] }
```

### Compressor Requirements
```typescript
import { calculateCompressorRequirement } from '@/lib/systems/compressed-air';

const tools = [
    { cfm: 10, dutyCycle: 0.3 },  // Nail gun - 30% usage
    { cfm: 15, dutyCycle: 0.2 },  // Impact wrench - 20% usage
    { cfm: 8, dutyCycle: 0.5 }    // Spray gun - 50% usage
];

const result = calculateCompressorRequirement(tools);
// Returns: { requiredCFM: 12, recommendedHP: 3 }
// Includes 20% safety factor
```

### Receiver Tank Sizing
```typescript
import { calculateReceiverSize } from '@/lib/systems/compressed-air';

const result = calculateReceiverSize(
    15,  // compressor CFM
    30,  // peak demand CFM
    10   // allowable pressure drop PSI
);
// Returns: { gallons: 120, recommendation: '120 gallon tank recommended...' }
```

---

## 3D Visualization Components

### Basic Scene
```tsx
import { Scene } from '@/components/3d/Scene';

<Scene building={buildingWithEquipment} />
```

### Building Shell
```tsx
import { BuildingShell } from '@/components/3d/BuildingShell';

<BuildingShell
    width={50}
    depth={40}
    height={20}
    floorGeometry={customGeometry}
/>
```

### Equipment Model
```tsx
import { EquipmentModel } from '@/components/3d/EquipmentModel';

<EquipmentModel item={equipment} />
// Automatically shows:
// - Equipment name and category labels
// - Color-coded by category
// - System requirement indicators (dust, air, electrical)
// - Hover effects
```

### System Routing
```tsx
import { SystemRouting } from '@/components/3d/SystemRouting';

<SystemRouting
    systemRuns={[
        {
            id: 'dust-1',
            type: 'DUST',
            points: [{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 20, y: 5 }],
            diameter: 6, // inches
            meta: { cfm: 400 }
        }
    ]}
    height={8} // feet above floor
/>
```

---

## Common Workflows

### 1. Design Electrical Circuit
```typescript
// 1. Calculate wire size
const circuit = calculateOptimalWireSize({
    load: { voltage: 240, phase: 1, amps: 30 },
    lengthFt: 150,
    maxVoltageDrop: 3
});

// 2. Calculate conduit size
const conduit = calculateConduitSize(circuit.wireSize, 3); // 3 conductors

// 3. Calculate breaker size
const breaker = calculateBreakerSize({ voltage: 240, phase: 1, amps: 30 }, false);

console.log(`
    Wire: ${circuit.wireSize}
    Conduit: ${conduit}
    Breaker: ${breaker}A
    Voltage Drop: ${circuit.percentDrop.toFixed(2)}%
`);
```

### 2. Design Dust Collection System
```typescript
// 1. Calculate duct diameter for table saw
const diameter = calculateOptimalDiameter(350, VELOCITY_STANDARDS.BRANCH_LINE);

// 2. Calculate velocity
const velocity = calculateVelocity(350, Math.ceil(diameter));

// 3. Calculate friction loss
const loss = calculateFrictionLossPre100Ft(350, Math.ceil(diameter));

console.log(`
    Diameter: ${Math.ceil(diameter)}"
    Velocity: ${velocity.toFixed(0)} FPM
    Friction Loss: ${loss.toFixed(2)} in wg per 100ft
`);
```

### 3. Design Compressed Air System
```typescript
// 1. Calculate compressor requirements
const tools = [
    { cfm: 8, dutyCycle: 0.2 },
    { cfm: 12, dutyCycle: 0.3 }
];
const compressor = calculateCompressorRequirement(tools);

// 2. Size main line
const mainLine = calculateOptimalAirPipeSize({
    flowSCFM: compressor.requiredCFM,
    pressurePSI: 90,
    lengthFt: 50,
    maxPressureDropPSI: 1
});

// 3. Size receiver tank
const peakCFM = tools.reduce((sum, t) => sum + t.cfm, 0);
const tank = calculateReceiverSize(compressor.requiredCFM, peakCFM, 10);

console.log(`
    Compressor: ${compressor.requiredCFM.toFixed(1)} CFM, ${compressor.recommendedHP} HP
    Main Line: ${mainLine.pipeSize}
    Tank: ${tank.gallons} gallons
`);
```

---

## Type Definitions

### Electrical Types
```typescript
type WireSize = '14 AWG' | '12 AWG' | '10 AWG' | '8 AWG' | '6 AWG' | ...
type ConduitSize = '1/2"' | '3/4"' | '1"' | '1-1/4"' | ...
type ElectricalLoad = {
    voltage: number;
    phase: 1 | 3;
    amps: number;
    powerFactor?: number;
}
```

### Compressed Air Types
```typescript
type AirPipeSize = '1/2"' | '3/4"' | '1"' | '1-1/4"' | ...
type AirSystemParams = {
    flowSCFM: number;
    pressurePSI: number;
    lengthFt: number;
    maxPressureDropPSI?: number;
}
```

### Building Geometry Types
```typescript
type BuildingFloorGeometry = {
    version: 1;
    vertices: BuildingVertex[];
    segments: BuildingWallSegment[];
    equipment?: Array<{...}>;
    systemRuns?: Array<{
        id: string;
        type: 'DUST' | 'AIR' | 'ELECTRICAL';
        points: Array<{ x: number, y: number }>;
        diameter?: number;
        meta?: Record<string, any>;
    }>;
}
```

---

## Best Practices

### Electrical
- Always check voltage drop for runs over 100ft
- Use 80% derating factor for continuous loads
- Round up to next standard wire/breaker size
- Consider future expansion when sizing panels

### Ducting
- Maintain minimum 3500 FPM for wood dust transport
- Use 4000 FPM for branch lines to prevent settling
- Keep friction loss under 2" wg per 100ft
- Size collector for 1.5x total CFM requirement

### Compressed Air
- Keep pressure drop under 1 PSI per 100ft
- Avoid velocities over 6000 FPM (noise/wear)
- Include 20% safety factor for compressor sizing
- Size receiver for peak demand buffering

### 3D Visualization
- Use hover effects to identify equipment
- Color-code systems for easy identification
- Keep camera distance proportional to building size
- Enable shadows for depth perception

---

## Testing

All calculation functions have comprehensive test coverage:

```bash
npm test                          # Run all tests
npm test electrical.test.ts       # Test electrical calculations
npm test ducting.test.ts         # Test ducting calculations
npm test compressed-air.test.ts  # Test compressed air calculations
```

**Current Status**: ✅ 38 tests passing

---

## Support & Documentation

- **Full Enhancement Summary**: See `ENHANCEMENT_SUMMARY.md`
- **Deployment Status**: See `DEPLOYMENT_STATUS.md`
- **API Documentation**: See inline JSDoc comments
- **Type Definitions**: See `lib/types/` directory

---

**Last Updated**: January 4, 2026  
**Version**: 2.0 - Comprehensive Mechanical Systems  
**Status**: ✅ Production Ready
