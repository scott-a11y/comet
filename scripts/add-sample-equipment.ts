import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Adding sample equipment to Building #3...')

    const equipment = await prisma.equipment.create({
        data: {
            shopBuildingId: 3,
            name: 'Table Saw',
            category: 'SAW',
            widthFt: 4,
            depthFt: 6,
            orientation: 0,
            requiresDust: true,
            requiresAir: false,
            requiresHighVoltage: true,
            powerSpecs: {
                create: {
                    voltage: 240,
                    phase: 1,
                    amps: 20,
                    powerKw: 3.5,
                    circuitType: 'dedicated'
                }
            },
            dustSpecs: {
                create: {
                    numPorts: 1,
                    portDiameterIn: 4,
                    cfmRequirement: 350
                }
            }
        },
        include: {
            powerSpecs: true,
            dustSpecs: true
        }
    })

    console.log('✅ Equipment created:', equipment)

    // Add a few more pieces
    await prisma.equipment.createMany({
        data: [
            {
                shopBuildingId: 3,
                name: 'CNC Router',
                category: 'CNC',
                widthFt: 5,
                depthFt: 10,
                orientation: 0,
                requiresDust: true,
                requiresAir: false,
                requiresHighVoltage: true,
            },
            {
                shopBuildingId: 3,
                name: 'Panel Saw',
                category: 'SAW',
                widthFt: 10,
                depthFt: 4,
                orientation: 90,
                requiresDust: true,
                requiresAir: false,
                requiresHighVoltage: false,
            },
            {
                shopBuildingId: 3,
                name: 'Dust Collector',
                category: 'DUST_COLLECTION',
                widthFt: 3,
                depthFt: 4,
                orientation: 0,
                requiresDust: false,
                requiresAir: false,
                requiresHighVoltage: true,
            }
        ]
    })

    console.log('✅ Added 3 more equipment items')

    const count = await prisma.equipment.count({
        where: { shopBuildingId: 3 }
    })

    console.log(`\n🎉 Building #3 now has ${count} equipment items!`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
