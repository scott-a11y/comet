import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLeanFeatures() {
    console.log('🌱 Seeding lean manufacturing features...');

    // Create sample SOPs
    const sops = [
        {
            title: 'Table Saw Safety Setup',
            category: 'Safety',
            status: 'active',
            description: 'Standard procedure for safely setting up and operating the table saw',
            tags: ['safety', 'woodworking', 'power-tools'],
            steps: [
                {
                    stepNumber: 1,
                    title: 'Inspect the Saw',
                    instructions: 'Check blade for damage, ensure guard is in place, verify fence alignment.',
                    estimatedMinutes: 3,
                    safetyNotes: 'Never operate with a damaged blade. Ensure all guards are properly installed.',
                },
                {
                    stepNumber: 2,
                    title: 'Set Blade Height',
                    instructions: 'Adjust blade height to 1/8" above the material thickness.',
                    estimatedMinutes: 2,
                    safetyNotes: 'Unplug saw before making adjustments.',
                },
                {
                    stepNumber: 3,
                    title: 'Position Fence',
                    instructions: 'Set fence to desired width and lock in place. Double-check measurement.',
                    estimatedMinutes: 2,
                },
                {
                    stepNumber: 4,
                    title: 'Test Cut',
                    instructions: 'Make a test cut on scrap material to verify setup.',
                    estimatedMinutes: 3,
                    safetyNotes: 'Use push stick for cuts narrower than 6 inches.',
                },
            ],
        },
        {
            title: 'Daily Quality Inspection',
            category: 'Quality',
            status: 'active',
            description: 'Daily quality control checklist for production output',
            tags: ['quality', 'inspection', 'daily'],
            steps: [
                {
                    stepNumber: 1,
                    title: 'Visual Inspection',
                    instructions: 'Check for surface defects, scratches, dents, or discoloration.',
                    estimatedMinutes: 5,
                },
                {
                    stepNumber: 2,
                    title: 'Dimensional Check',
                    instructions: 'Verify critical dimensions using calipers or tape measure.',
                    estimatedMinutes: 10,
                },
                {
                    stepNumber: 3,
                    title: 'Document Results',
                    instructions: 'Record all measurements and observations in quality log.',
                    estimatedMinutes: 5,
                },
            ],
        },
        {
            title: 'CNC Machine Maintenance',
            category: 'Maintenance',
            status: 'active',
            description: 'Weekly maintenance procedure for CNC router',
            tags: ['maintenance', 'cnc', 'weekly'],
            steps: [
                {
                    stepNumber: 1,
                    title: 'Clean Work Area',
                    instructions: 'Remove all chips and debris from table and rails.',
                    estimatedMinutes: 15,
                },
                {
                    stepNumber: 2,
                    title: 'Lubricate Rails',
                    instructions: 'Apply appropriate lubricant to all linear rails and ball screws.',
                    estimatedMinutes: 10,
                    safetyNotes: 'Ensure machine is powered off and locked out.',
                },
                {
                    stepNumber: 3,
                    title: 'Check Tool Holders',
                    instructions: 'Inspect all tool holders for wear and proper seating.',
                    estimatedMinutes: 10,
                },
                {
                    stepNumber: 4,
                    title: 'Test Run',
                    instructions: 'Run a test program to verify proper operation.',
                    estimatedMinutes: 15,
                },
            ],
        },
    ];

    console.log('Creating SOPs...');
    for (const sopData of sops) {
        const { steps, ...sopFields } = sopData;
        await prisma.sOP.create({
            data: {
                ...sopFields,
                steps: {
                    create: steps,
                },
            },
        });
    }
    console.log(`✅ Created ${sops.length} SOPs`);

    // Create sample defect logs
    const defects = [
        {
            defectType: 'Surface Scratch',
            severity: 'medium',
            description: 'Visible scratch on finished surface, approximately 3 inches long',
            location: 'Assembly Station 2',
            productLine: 'Cabinet Doors',
            status: 'resolved',
            rootCause: 'Material handling during transport',
            correctiveAction: 'Implemented protective padding on transport cart',
            reportedBy: 'John Smith',
        },
        {
            defectType: 'Surface Scratch',
            severity: 'low',
            description: 'Minor surface scratch on edge',
            location: 'Finishing Area',
            productLine: 'Cabinet Doors',
            status: 'closed',
        },
        {
            defectType: 'Surface Scratch',
            severity: 'medium',
            description: 'Deep scratch requiring refinishing',
            location: 'Assembly Station 1',
            productLine: 'Drawer Fronts',
            status: 'open',
        },
        {
            defectType: 'Dimensional Error',
            severity: 'high',
            description: 'Width measurement off by 1/8 inch',
            location: 'CNC Station',
            productLine: 'Cabinet Doors',
            status: 'investigating',
            rootCause: 'CNC calibration drift',
            reportedBy: 'Jane Doe',
            assignedTo: 'Mike Johnson',
        },
        {
            defectType: 'Dimensional Error',
            severity: 'critical',
            description: 'Length measurement off by 1/4 inch - part unusable',
            location: 'Table Saw Station',
            productLine: 'Shelves',
            status: 'resolved',
            rootCause: 'Fence not properly locked',
            correctiveAction: 'Retrained operator on fence locking procedure',
        },
        {
            defectType: 'Finish Defect',
            severity: 'medium',
            description: 'Uneven stain application with visible streaks',
            location: 'Finishing Area',
            productLine: 'Cabinet Doors',
            status: 'open',
        },
        {
            defectType: 'Finish Defect',
            severity: 'low',
            description: 'Minor dust particle in finish',
            location: 'Finishing Area',
            productLine: 'Drawer Fronts',
            status: 'closed',
        },
        {
            defectType: 'Assembly Error',
            severity: 'high',
            description: 'Hinge installed in wrong position',
            location: 'Assembly Station 3',
            productLine: 'Cabinet Doors',
            status: 'resolved',
            rootCause: 'Incorrect template used',
            correctiveAction: 'Color-coded templates by product type',
        },
        {
            defectType: 'Material Defect',
            severity: 'medium',
            description: 'Knot in wood causing structural weakness',
            location: 'Receiving',
            productLine: 'Raw Materials',
            status: 'open',
        },
        {
            defectType: 'Adhesive Failure',
            severity: 'critical',
            description: 'Edge banding delaminating from substrate',
            location: 'Assembly Station 1',
            productLine: 'Shelves',
            status: 'investigating',
            rootCause: 'Insufficient glue temperature',
            assignedTo: 'Sarah Williams',
        },
    ];

    console.log('Creating defect logs...');
    for (const defect of defects) {
        await prisma.defectLog.create({
            data: defect,
        });
    }
    console.log(`✅ Created ${defects.length} defect logs`);

    console.log('🎉 Lean features seeded successfully!');
}

seedLeanFeatures()
    .catch((e) => {
        console.error('Error seeding lean features:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
