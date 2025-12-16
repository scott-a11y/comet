import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create the building
  const building = await prisma.shopBuilding.create({
    data: {
      name: '804 N Killingsworth Ct',
      widthFt: 100,
      depthFt: 43,
      ceilingHeightFt: 20,
      hasMezzanine: false,
      notes: 'Main warehouse with offices and outside paved equipment yard'
    }
  })

  console.log('Created building:', building.name)

  // Create zones
  const warehouseZone = await prisma.shopZone.create({
    data: {
      shopBuildingId: building.id,
      name: 'Warehouse',
      x: 0,
      y: 0,
      width: 100,
      height: 43,
      zoneType: 'warehouse'
    }
  })

  const officeZone = await prisma.shopZone.create({
    data: {
      shopBuildingId: building.id,
      name: 'Office Area',
      x: 0,
      y: 43,
      width: 20,
      height: 15,
      zoneType: 'office'
    }
  })

  const yardZone = await prisma.shopZone.create({
    data: {
      shopBuildingId: building.id,
      name: 'Storage Yard',
      x: 100,
      y: 0,
      width: 30,
      height: 30,
      zoneType: 'yard'
    }
  })

  console.log('Created zones')

  // Create utility points
  const mainPanel = await prisma.utilityPoint.create({
    data: {
      shopBuildingId: building.id,
      type: 'electrical_panel',
      name: 'Main 480V Panel',
      x: 5,
      y: 5,
      voltage: 480,
      phase: 3,
      amps: 200,
      isMainService: true,
      isOutdoor: false
    }
  })

  const autoTransformer = await prisma.utilityPoint.create({
    data: {
      shopBuildingId: building.id,
      type: 'transformer',
      name: 'Auto Transformer 40 kVA',
      x: 6,
      y: 6,
      voltage: 480,
      kva: 40,
      isMainService: false,
      isOutdoor: false
    }
  })

  const dustCollector = await prisma.utilityPoint.create({
    data: {
      shopBuildingId: building.id,
      type: 'dust_collector',
      name: 'AL-KO APU 250 P',
      x: 95,
      y: 40,
      voltage: 220,
      phase: 3,
      amps: 24,
      isMainService: false,
      isOutdoor: true
    }
  })

  console.log('Created utility points')

  // Create equipment
  const panelRack = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'Horizontal Panel Storage Rack',
      category: 'storage_rack',
      widthFt: 12,
      depthFt: 4,
      orientation: 0,
      requiresDust: false,
      requiresAir: false,
      requiresHighVoltage: false,
      preferredZoneId: warehouseZone.id
    }
  })

  const omgaMiterSaw = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'OMGA T 50/350 O.P. US',
      category: 'saw',
      widthFt: 6,
      depthFt: 4,
      orientation: 0,
      requiresDust: true,
      requiresAir: false,
      requiresHighVoltage: true,
      preferredZoneId: warehouseZone.id,
      powerSpecs: {
        create: {
          voltage: 230,
          phase: 1,
          amps: 6,
          powerKw: 2.2,
          circuitType: 'standard'
        }
      },
      dustSpecs: {
        create: {
          numPorts: 1,
          portDiameterIn: 4,
          cfmRequirement: 400
        }
      }
    }
  })

  const festoolKapex = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'Festool KAPEX KS 120 REB',
      category: 'saw',
      widthFt: 3,
      depthFt: 2,
      orientation: 0,
      requiresDust: true,
      requiresAir: false,
      requiresHighVoltage: false,
      preferredZoneId: warehouseZone.id,
      powerSpecs: {
        create: {
          voltage: 120,
          phase: 1,
          amps: 20,
          circuitType: 'standard'
        }
      },
      dustSpecs: {
        create: {
          numPorts: 1,
          portDiameterIn: 2.5,
          cfmRequirement: 200
        }
      }
    }
  })

  const bandsaw = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'Grizzly G0621X Bandsaw',
      category: 'bandsaw',
      widthFt: 3,
      depthFt: 3,
      orientation: 0,
      requiresDust: true,
      requiresAir: false,
      requiresHighVoltage: true,
      preferredZoneId: warehouseZone.id,
      powerSpecs: {
        create: {
          voltage: 220,
          phase: 1,
          amps: 8,
          powerKw: 0.75,
          circuitType: 'standard'
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
  })

  const drillPress = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'Central Machinery 39955 Drill Press',
      category: 'drill_press',
      widthFt: 2,
      depthFt: 2,
      orientation: 0,
      requiresDust: false,
      requiresAir: false,
      requiresHighVoltage: false,
      preferredZoneId: warehouseZone.id,
      powerSpecs: {
        create: {
          voltage: 120,
          phase: 1,
          amps: 5,
          powerKw: 0.37,
          circuitType: 'standard'
        }
      }
    }
  })

  const planer1 = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'Maksiwa PHM.30 Planer',
      category: 'planer',
      widthFt: 4,
      depthFt: 3,
      orientation: 0,
      requiresDust: true,
      requiresAir: false,
      requiresHighVoltage: false,
      preferredZoneId: warehouseZone.id,
      powerSpecs: {
        create: {
          voltage: 120,
          phase: 1,
          amps: 20,
          circuitType: 'high_inrush'
        }
      },
      dustSpecs: {
        create: {
          numPorts: 1,
          portDiameterIn: 4,
          cfmRequirement: 600
        }
      }
    }
  })

  const planer2 = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'DeWalt DW735 Thickness Planer',
      category: 'planer',
      widthFt: 3,
      depthFt: 2,
      orientation: 0,
      requiresDust: true,
      requiresAir: false,
      requiresHighVoltage: false,
      preferredZoneId: warehouseZone.id,
      powerSpecs: {
        create: {
          voltage: 120,
          phase: 1,
          amps: 15,
          circuitType: 'high_inrush'
        }
      },
      dustSpecs: {
        create: {
          numPorts: 1,
          portDiameterIn: 4,
          cfmRequirement: 600
        }
      }
    }
  })

  const welder = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'Azzuno MF-200PRO Welder',
      category: 'welder',
      widthFt: 2,
      depthFt: 2,
      orientation: 0,
      requiresDust: false,
      requiresAir: false,
      requiresHighVoltage: true,
      preferredZoneId: warehouseZone.id,
      powerSpecs: {
        create: {
          voltage: 220,
          phase: 1,
          amps: 50,
          circuitType: 'welder'
        }
      }
    }
  })

  const liftTable = await prisma.equipment.create({
    data: {
      shopBuildingId: building.id,
      name: 'BARTH Hydraulic Lift Table',
      category: 'lift_table',
      widthFt: 4,
      depthFt: 4,
      orientation: 0,
      requiresDust: false,
      requiresAir: true,
      requiresHighVoltage: false,
      preferredZoneId: warehouseZone.id,
      airSpecs: {
        create: {
          pressureBar: 6,
          flowScfm: 5
        }
      }
    }
  })

  console.log('Created equipment')

  // Create a default layout
  const layout = await prisma.layoutInstance.create({
    data: {
      shopBuildingId: building.id,
      name: 'Initial Layout'
    }
  })

  console.log('Created layout:', layout.name)

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
