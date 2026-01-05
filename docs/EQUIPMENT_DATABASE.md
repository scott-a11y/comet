# 📊 Equipment Database - Complete Guide

## 🗄️ **Database Location**

The equipment database is stored in **PostgreSQL** using **Prisma ORM**.

---

## 📁 **Key Files**

### **1. Database Schema**
**File:** `prisma/schema.prisma`

This is the main database schema defining all equipment tables and relationships.

### **2. Equipment Catalog**
**File:** `lib/data/catalog.ts`

This contains the pre-defined equipment catalog with 12 common shop items.

### **3. Validation Schema**
**File:** `lib/validations/equipment.ts`

Zod schemas for validating equipment creation and updates.

---

## 🏗️ **Database Structure**

### **Main Equipment Table**

```prisma
model Equipment {
  id                  Int       @id @default(autoincrement())
  shopBuildingId      Int
  name                String
  category            String
  widthFt             Float
  depthFt             Float
  orientation         Float     @default(0)
  requiresDust        Boolean   @default(false)
  requiresAir         Boolean   @default(false)
  requiresHighVoltage Boolean   @default(false)
  
  // Relations
  powerSpecs          EquipmentPowerSpecs?
  dustSpecs           EquipmentDustSpecs?
  airSpecs            EquipmentAirSpecs?
  layoutPositions     EquipmentLayoutPosition[]
}
```

### **Related Tables**

1. **EquipmentPowerSpecs** - Electrical requirements
   - voltage, phase, amps, powerKw, circuitType

2. **EquipmentDustSpecs** - Dust collection requirements
   - numPorts, portDiameterIn, cfmRequirement

3. **EquipmentAirSpecs** - Compressed air requirements
   - pressureBar, flowScfm

4. **EquipmentLayoutPosition** - Position in layouts
   - x, y, orientation, locked

---

## 📦 **Equipment Catalog**

### **Current Catalog Items (12 total)**

#### **MACHINERY (5 items)**
1. **Table Saw (Cabinet)**
   - Size: 3' x 3'
   - Power: 220V, 1-phase, 3kW
   - Ports: Power, Dust

2. **Jointer (8")**
   - Size: 2' x 6'
   - Power: 220V, 1-phase, 2kW
   - Ports: Power, Dust

3. **Planer (20")**
   - Size: 3' x 3'
   - Power: 220V, 3-phase, 5kW
   - Ports: Power, Dust

4. **Band Saw (14")**
   - Size: 2.5' x 3'
   - Power: 110V, 1-phase, 1.5kW
   - Ports: Power, Dust

5. **Drill Press**
   - Size: 1.5' x 2'
   - Power: 110V, 1-phase, 1kW
   - Ports: Power

#### **BENCH (2 items)**
6. **Workbench (6ft)**
   - Size: 3' x 6'
   - Height: 36"

7. **Assembly Table**
   - Size: 4' x 8'
   - Height: 30"

#### **STORAGE (2 items)**
8. **Lumber Rack (8ft)**
   - Size: 2' x 8'
   - Capacity: 2000 lbs, 5 shelves

9. **Tool Cabinet**
   - Size: 2' x 2'
   - Drawers: 6

#### **DUST (2 items)**
10. **Dust Collector (Cyclone)**
    - Size: 2.5' x 2.5'
    - CFM: 1200, HP: 3
    - Ports: Power, Main Duct

11. **Downdraft Table**
    - Size: 4' x 4'
    - CFM: 800

---

## 🎨 **Equipment Categories**

```typescript
type EquipmentCategory = "MACHINERY" | "BENCH" | "STORAGE" | "DUST"
```

**Category Icons:**
- 🛠️ All
- ⚙️ Machinery
- 🪑 Benches
- 📦 Storage
- 💨 Dust Control

---

## 💻 **How to Use**

### **1. Import Equipment Catalog**

```typescript
import { EQUIPMENT_CATALOG, CATEGORIES } from '@/lib/data/catalog';

// Get all equipment
const allEquipment = EQUIPMENT_CATALOG;

// Filter by category
const machinery = EQUIPMENT_CATALOG.filter(item => item.category === 'MACHINERY');

// Get specific item
const tableSaw = EQUIPMENT_CATALOG.find(item => item.id === 'table-saw-cabinet');
```

### **2. Create Equipment in Database**

```typescript
import { prisma } from '@/lib/prisma';

const equipment = await prisma.equipment.create({
  data: {
    shopBuildingId: 1,
    name: "Table Saw",
    category: "MACHINERY",
    widthFt: 3,
    depthFt: 3,
    orientation: 0,
    requiresDust: true,
    requiresAir: false,
    requiresHighVoltage: true,
    powerSpecs: {
      create: {
        voltage: 220,
        phase: 1,
        amps: 15,
        powerKw: 3,
        circuitType: "standard"
      }
    },
    dustSpecs: {
      create: {
        numPorts: 1,
        portDiameterIn: 4,
        cfmRequirement: 350
      }
    }
  }
});
```

### **3. Query Equipment**

```typescript
// Get all equipment for a building
const equipment = await prisma.equipment.findMany({
  where: { shopBuildingId: 1 },
  include: {
    powerSpecs: true,
    dustSpecs: true,
    airSpecs: true
  }
});

// Get equipment by category
const machinery = await prisma.equipment.findMany({
  where: {
    shopBuildingId: 1,
    category: "MACHINERY"
  }
});

// Get equipment requiring dust collection
const dustEquipment = await prisma.equipment.findMany({
  where: {
    shopBuildingId: 1,
    requiresDust: true
  },
  include: {
    dustSpecs: true
  }
});
```

---

## 🔌 **Equipment Ports**

Equipment can have multiple connection ports:

```typescript
interface Port {
  id: string;
  label?: string;
  system: "ELECTRICAL" | "AIR" | "DUCT" | "DUST" | "PIPING";
  offsetX: number; // feet from top-left
  offsetY: number; // feet from top-left
}
```

**Example:**
```typescript
ports: [
  { id: "power", label: "Power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 },
  { id: "dust", label: "Dust", system: "DUST", offsetX: 2.9, offsetY: 1.5 }
]
```

---

## 📊 **Equipment Properties**

### **Physical Properties**
- `widthFt` - Width in feet
- `depthFt` - Depth in feet
- `orientation` - Rotation in degrees (0-360)

### **Requirements**
- `requiresDust` - Needs dust collection
- `requiresAir` - Needs compressed air
- `requiresHighVoltage` - Needs 220V+

### **Power Specs**
- `voltage` - Operating voltage
- `phase` - 1 or 3 phase
- `amps` - Current draw
- `powerKw` - Power consumption
- `circuitType` - Circuit type

### **Dust Specs**
- `numPorts` - Number of dust ports
- `portDiameterIn` - Port diameter in inches
- `cfmRequirement` - Required CFM

### **Air Specs**
- `pressureBar` - Required pressure
- `flowScfm` - Flow rate in SCFM

---

## 🎯 **Adding New Equipment**

### **Option 1: Add to Catalog**

Edit `lib/data/catalog.ts`:

```typescript
{
  id: "cnc-router",
  name: "CNC Router",
  category: "MACHINERY",
  width: 5,
  length: 10,
  color: "#059669",
  defaults: { voltage: 220, phase: 3, powerKw: 7 },
  ports: [
    { id: "power", label: "Power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 },
    { id: "dust", label: "Dust", system: "DUST", offsetX: 4.9, offsetY: 5 },
    { id: "air", label: "Air", system: "AIR", offsetX: 2.5, offsetY: 0.1 }
  ]
}
```

### **Option 2: Add to Database**

Use Prisma to create:

```typescript
await prisma.equipment.create({
  data: {
    shopBuildingId: buildingId,
    name: "CNC Router",
    category: "MACHINERY",
    widthFt: 5,
    depthFt: 10,
    requiresDust: true,
    requiresAir: true,
    requiresHighVoltage: true
  }
});
```

---

## 🔍 **Database Queries**

### **Get Equipment with All Specs**

```typescript
const equipment = await prisma.equipment.findUnique({
  where: { id: equipmentId },
  include: {
    powerSpecs: true,
    dustSpecs: true,
    airSpecs: true,
    layoutPositions: {
      include: {
        layout: true
      }
    }
  }
});
```

### **Get Equipment by Building**

```typescript
const equipment = await prisma.equipment.findMany({
  where: { shopBuildingId: buildingId },
  orderBy: { category: 'asc' }
});
```

### **Get Equipment Needing Dust Collection**

```typescript
const dustEquipment = await prisma.equipment.findMany({
  where: {
    shopBuildingId: buildingId,
    requiresDust: true
  },
  include: {
    dustSpecs: true
  }
});

// Calculate total CFM
const totalCFM = dustEquipment.reduce((sum, eq) => 
  sum + (eq.dustSpecs?.cfmRequirement || 0), 0
);
```

---

## 📝 **Summary**

**Equipment Database Locations:**
- ✅ **Schema:** `prisma/schema.prisma`
- ✅ **Catalog:** `lib/data/catalog.ts`
- ✅ **Validation:** `lib/validations/equipment.ts`

**Current Catalog:**
- ✅ 12 pre-defined items
- ✅ 4 categories (Machinery, Bench, Storage, Dust)
- ✅ Full specs (power, dust, air)
- ✅ Connection ports defined

**Database Tables:**
- ✅ `equipment` - Main equipment table
- ✅ `equipment_power_specs` - Electrical specs
- ✅ `equipment_dust_specs` - Dust collection specs
- ✅ `equipment_air_specs` - Compressed air specs
- ✅ `equipment_layout_positions` - Positions in layouts

---

**The equipment database is fully set up and ready to use!** 🎉
