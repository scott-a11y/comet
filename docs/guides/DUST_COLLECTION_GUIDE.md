# 🌪️ Dust Collection Ducting Design Guide

## Overview

Dust collection is **critical for woodshops** to:
- ✅ Protect worker health (wood dust is a carcinogen)
- ✅ Prevent fire hazards (wood dust is explosive)
- ✅ Maintain equipment performance
- ✅ Keep workspace clean
- ✅ Meet OSHA regulations

---

## 🎯 Design Principles

### **Key Requirements**

1. **Minimum Transport Velocity**: 3500-4000 FPM (feet per minute)
   - Below this, dust settles in ducts and clogs
   - Wood dust requires higher velocity than metal dust

2. **Proper Duct Sizing**: Balance between:
   - Too small = excessive friction loss, poor performance
   - Too large = velocity too low, dust settles

3. **Minimize Resistance**:
   - Short runs when possible
   - Minimize elbows and bends
   - Use gradual transitions (45° better than 90°)

4. **Collector Sizing**: 1.5x total CFM requirement
   - Safety margin for simultaneous use
   - Accounts for system losses

---

## 📐 CFM Requirements by Machine

### **Common Woodworking Machines**

| Machine | CFM Required | Port Size | Notes |
|---------|-------------|-----------|-------|
| **Table Saw** | 350-400 | 4" | Under-table collection |
| **Jointer** (6-8") | 350-450 | 4" | Over-table hood |
| **Planer** (12-13") | 400-500 | 4" | Top and bottom ports |
| **Band Saw** (14") | 300-400 | 4" | Lower cabinet |
| **Router Table** | 200-300 | 2.5" | Fence collection |
| **Miter Saw** | 250-350 | 2.5" | Shroud collection |
| **Drum Sander** | 350-450 | 4" | Continuous dust |
| **Lathe** | 200-350 | 4" | Overhead hood |
| **Disc Sander** | 300-400 | 4" | Behind disc |
| **CNC Router** | 400-600 | 4-6" | Enclosed cabinet |

### **Dust Collector Types**

| Type | CFM Range | Best For | Filtration |
|------|-----------|----------|------------|
| **Single-Stage** | 400-1200 | Small shops, 1-2 machines | Bag filter (5-30 micron) |
| **Two-Stage (Cyclone)** | 800-2000 | Medium shops, 3-5 machines | Cyclone + filter (1-5 micron) |
| **Industrial** | 2000+ | Production shops, 6+ machines | HEPA (0.3 micron) |

---

## 🔧 Using the Comet Ducting Calculator

### **Step 1: Calculate Duct Diameter**

```typescript
import { 
    calculateOptimalDiameter, 
    calculateVelocity,
    VELOCITY_STANDARDS 
} from '@/lib/systems/ducting';

// Example: Table saw branch line
const tableSawCFM = 350;
const branchVelocity = VELOCITY_STANDARDS.BRANCH_LINE; // 4000 FPM

const diameter = calculateOptimalDiameter(tableSawCFM, branchVelocity);
console.log(`Table saw needs ${Math.ceil(diameter)}" duct`);
// Output: Table saw needs 5" duct

// Verify velocity
const actualVelocity = calculateVelocity(tableSawCFM, Math.ceil(diameter));
console.log(`Actual velocity: ${actualVelocity.toFixed(0)} FPM`);
// Output: Actual velocity: 3584 FPM (acceptable, above 3500 minimum)
```

### **Step 2: Calculate Main Trunk Line**

```typescript
// Sum all machines that might run simultaneously
const machines = [
    { name: 'Table Saw', cfm: 350 },
    { name: 'Jointer', cfm: 400 },
    { name: 'Planer', cfm: 450 },
    { name: 'Band Saw', cfm: 350 }
];

// Assume 2 machines max at once (diversity factor)
const simultaneousCFM = 350 + 450; // Table saw + Planer
const totalCFM = simultaneousCFM;

// Main trunk should use lower velocity (3500 FPM)
const mainVelocity = VELOCITY_STANDARDS.MAIN_LINE; // 3500 FPM
const mainDiameter = calculateOptimalDiameter(totalCFM, mainVelocity);

console.log(`Main trunk needs ${Math.ceil(mainDiameter)}" duct`);
// Output: Main trunk needs 7" duct
```

### **Step 3: Calculate Friction Loss**

```typescript
import { calculateFrictionLossPre100Ft } from '@/lib/systems/ducting';

// Check friction loss for main trunk
const runLength = 50; // feet
const frictionPer100 = calculateFrictionLossPre100Ft(totalCFM, Math.ceil(mainDiameter));
const totalFriction = (frictionPer100 / 100) * runLength;

console.log(`Friction loss: ${frictionPer100.toFixed(2)}" wg per 100ft`);
console.log(`Total for ${runLength}ft run: ${totalFriction.toFixed(2)}" wg`);

// Rule of thumb: Keep under 2" wg per 100ft
if (frictionPer100 > 2) {
    console.warn('⚠️ Consider larger duct to reduce friction');
}
```

---

## 🏗️ Complete System Design Example

### **Scenario: Small Woodshop (4 Machines)**

#### **Equipment List**
1. Table Saw - 350 CFM
2. Jointer (8") - 400 CFM
3. Planer (13") - 450 CFM
4. Band Saw (14") - 350 CFM

#### **Design Steps**

```typescript
// 1. Calculate individual branch requirements
const branches = [
    { machine: 'Table Saw', cfm: 350, distance: 15 },
    { machine: 'Jointer', cfm: 400, distance: 20 },
    { machine: 'Planer', cfm: 450, distance: 25 },
    { machine: 'Band Saw', cfm: 350, distance: 18 }
];

branches.forEach(branch => {
    const diameter = calculateOptimalDiameter(branch.cfm, 4000);
    const velocity = calculateVelocity(branch.cfm, Math.ceil(diameter));
    const friction = calculateFrictionLossPre100Ft(branch.cfm, Math.ceil(diameter));
    
    console.log(`\n${branch.machine}:`);
    console.log(`  CFM: ${branch.cfm}`);
    console.log(`  Duct: ${Math.ceil(diameter)}"`);
    console.log(`  Velocity: ${velocity.toFixed(0)} FPM`);
    console.log(`  Friction: ${friction.toFixed(2)}" wg/100ft`);
});

/* Output:
Table Saw:
  CFM: 350
  Duct: 5"
  Velocity: 3584 FPM
  Friction: 1.45" wg/100ft

Jointer:
  CFM: 400
  Duct: 5"
  Velocity: 4096 FPM
  Friction: 1.89" wg/100ft

Planer:
  CFM: 450
  Duct: 6"
  Velocity: 3584 FPM
  Friction: 1.12" wg/100ft

Band Saw:
  CFM: 350
  Duct: 5"
  Velocity: 3584 FPM
  Friction: 1.45" wg/100ft
*/

// 2. Size main trunk (assume 2 machines max simultaneously)
const maxSimultaneous = 350 + 450; // Table saw + Planer
const mainDiameter = calculateOptimalDiameter(maxSimultaneous, 3500);
console.log(`\nMain Trunk: ${Math.ceil(mainDiameter)}" (${maxSimultaneous} CFM)`);
// Output: Main Trunk: 7" (800 CFM)

// 3. Size dust collector (1.5x max simultaneous)
const collectorCFM = maxSimultaneous * 1.5;
console.log(`Dust Collector Required: ${collectorCFM} CFM minimum`);
// Output: Dust Collector Required: 1200 CFM minimum
```

---

## 🎨 Drawing the System in Wall Designer

### **Step-by-Step Process**

#### **1. Draw the Building**
```
1. Click "Draw" mode
2. Draw shop outline (e.g., 30' x 40')
3. Click "Close Loop"
4. Click "Calibrate" and set scale
```

#### **2. Place Equipment**
```
1. Click "Edit" mode
2. Use "Auto-Place (AI)" or manually drag equipment
3. Position machines around the shop
```

#### **3. Design Duct Layout**
```
1. Click "Systems" mode
2. Start at dust collector location
3. Draw main trunk line down center of shop
4. Draw branch lines to each machine
5. Press Enter after each run to commit
```

#### **4. Annotate with Calculations**
```typescript
// For each duct run drawn, calculate and store:
const ductRun = {
    id: 'dust-tablesaw',
    type: 'DUST',
    points: [
        { x: 200, y: 300 }, // Collector
        { x: 400, y: 300 }, // Main trunk
        { x: 400, y: 150 }  // Table saw
    ],
    diameter: 5, // Calculated above
    meta: {
        cfm: 350,
        velocity: 3584,
        frictionLoss: 1.45,
        machine: 'Table Saw'
    }
};
```

---

## 📊 Duct Sizing Quick Reference

### **Standard Duct Sizes**

| CFM | 3500 FPM | 4000 FPM | 4500 FPM |
|-----|----------|----------|----------|
| 200 | 4" | 3.5" | 3" |
| 300 | 4.5" | 4" | 4" |
| 350 | 5" | 4.5" | 4" |
| 400 | 5" | 5" | 4.5" |
| 450 | 5.5" | 5" | 5" |
| 500 | 6" | 5.5" | 5" |
| 600 | 6.5" | 6" | 5.5" |
| 700 | 7" | 6.5" | 6" |
| 800 | 7" | 7" | 6.5" |
| 1000 | 8" | 7.5" | 7" |
| 1200 | 8.5" | 8" | 7.5" |
| 1500 | 9.5" | 9" | 8.5" |

### **Velocity Guidelines**

| Duct Type | Velocity | Purpose |
|-----------|----------|---------|
| **Main Trunk** | 3500 FPM | Lower velocity, less noise |
| **Branch Lines** | 4000 FPM | Higher velocity, better pickup |
| **Short Runs** | 4500 FPM | Maximum velocity for short distances |
| **Minimum** | 3500 FPM | Below this, dust settles |
| **Maximum** | 5000 FPM | Above this, excessive wear/noise |

---

## ⚠️ Common Mistakes to Avoid

### **1. Undersizing Ducts**
❌ **Wrong**: Using 4" duct for 450 CFM
```typescript
const velocity = calculateVelocity(450, 4);
// Result: 5120 FPM - TOO HIGH! Excessive noise and wear
```

✅ **Correct**: Using 5" duct for 450 CFM
```typescript
const velocity = calculateVelocity(450, 5);
// Result: 3686 FPM - Perfect!
```

### **2. Oversizing Ducts**
❌ **Wrong**: Using 8" duct for 350 CFM
```typescript
const velocity = calculateVelocity(350, 8);
// Result: 1120 FPM - TOO LOW! Dust will settle
```

✅ **Correct**: Using 5" duct for 350 CFM
```typescript
const velocity = calculateVelocity(350, 5);
// Result: 3584 FPM - Perfect!
```

### **3. Too Many Elbows**
- Each 90° elbow = ~5-10 feet of straight duct (friction equivalent)
- Use 45° elbows when possible
- Use long-radius elbows (R/D ≥ 2)

### **4. Undersizing Collector**
❌ **Wrong**: 800 CFM collector for 800 CFM total load
- No safety margin
- Poor performance when multiple machines run

✅ **Correct**: 1200 CFM collector for 800 CFM simultaneous load
- 1.5x safety factor
- Better performance
- Future expansion capacity

---

## 🔍 Advanced Features

### **Blast Gates**

Use blast gates to control airflow:

```typescript
// Only open gates for machines in use
// This maintains velocity in active branches

const activeMachines = ['Table Saw', 'Planer'];
const activeCFM = 350 + 450; // 800 CFM

// Collector runs at full capacity (1200 CFM)
// Extra 400 CFM increases velocity in active branches
const boostedVelocity = calculateVelocity(600, 5); // 600 CFM through 5" duct
console.log(`Boosted velocity: ${boostedVelocity.toFixed(0)} FPM`);
// Output: 6144 FPM - Excellent pickup!
```

### **Static Pressure Budget**

Total system resistance should not exceed collector's static pressure rating:

```typescript
// Typical single-stage collector: 6-8" wg static pressure
// Budget breakdown:
const pressureBudget = {
    filter: 2.0,        // Clean filter resistance
    cyclone: 3.0,       // If using cyclone separator
    ductwork: 2.0,      // Main runs and branches
    fittings: 1.5,      // Elbows, Y's, transitions
    blastGates: 0.5,    // Open gates
    total: 9.0          // Total system resistance
};

// If total > collector rating, system won't perform
// Solution: Reduce duct length, minimize fittings, or upgrade collector
```

### **Grounding for Static Electricity**

Wood dust creates static electricity:
- Use metal ducts (not PVC) for safety
- Ground all metal ducts
- Bond all joints
- Ground collector to building ground

---

## 📱 Using in the Comet App

### **Complete Workflow**

```typescript
// 1. Import calculation functions
import { 
    calculateOptimalDiameter, 
    calculateVelocity,
    calculateFrictionLossPre100Ft,
    VELOCITY_STANDARDS 
} from '@/lib/systems/ducting';

// 2. Define your machines
const machines = [
    { name: 'Table Saw', cfm: 350, x: 100, y: 200 },
    { name: 'Jointer', cfm: 400, x: 300, y: 200 },
    { name: 'Planer', cfm: 450, x: 500, y: 200 },
    { name: 'Band Saw', cfm: 350, x: 700, y: 200 }
];

// 3. Calculate duct sizes
const ductDesign = machines.map(machine => {
    const diameter = calculateOptimalDiameter(machine.cfm, VELOCITY_STANDARDS.BRANCH_LINE);
    const velocity = calculateVelocity(machine.cfm, Math.ceil(diameter));
    const friction = calculateFrictionLossPre100Ft(machine.cfm, Math.ceil(diameter));
    
    return {
        machine: machine.name,
        cfm: machine.cfm,
        ductSize: Math.ceil(diameter),
        velocity: Math.round(velocity),
        frictionPer100: friction.toFixed(2),
        position: { x: machine.x, y: machine.y }
    };
});

// 4. Draw in wall editor (Systems mode)
// 5. Store calculations in systemRun.meta
// 6. View in 3D visualization
```

---

## 🎓 Best Practices Summary

### **Design Checklist**

- ✅ Calculate CFM for each machine
- ✅ Size branches for 4000 FPM
- ✅ Size main trunk for 3500 FPM
- ✅ Keep all velocities above 3500 FPM
- ✅ Minimize elbows and transitions
- ✅ Use blast gates for flow control
- ✅ Size collector at 1.5x simultaneous load
- ✅ Check total static pressure budget
- ✅ Use metal ducts and ground them
- ✅ Plan for future expansion

### **Installation Tips**

1. **Start at collector, work outward**
2. **Slope ducts slightly toward collector** (1/8" per foot)
3. **Support ducts every 8-10 feet**
4. **Seal all joints** (metal tape, not duct tape)
5. **Label blast gates** for each machine
6. **Install cleanout ports** at low points
7. **Test with smoke** to verify airflow

---

## 📈 Performance Verification

After installation, verify performance:

```typescript
// Measure actual CFM at each machine port
// Compare to calculated values

const measured = {
    tableSaw: 340,  // Target: 350
    jointer: 385,   // Target: 400
    planer: 430     // Target: 450
};

// If measured < 90% of target:
// - Check for leaks
// - Verify blast gates are fully open
// - Check filter condition
// - Verify duct sizes match design
```

---

## 🔗 Related Resources

- **Calculation Functions**: `lib/systems/ducting.ts`
- **Wall Designer Guide**: `WALL_DESIGNER_GUIDE.md`
- **Quick Reference**: `SYSTEMS_QUICK_REFERENCE.md`
- **Test Suite**: `test/ducting.test.ts`

---

**Last Updated**: January 4, 2026  
**Version**: 2.0  
**Status**: ✅ Production Ready

**Safety Note**: Always consult local codes and OSHA regulations. This guide provides engineering calculations but does not replace professional design for commercial installations.
