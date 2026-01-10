import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { withRateLimit } from '@/lib/api-middleware';

// GET /api/quality/defects - List all defect logs
export const GET = withRateLimit(async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const severity = searchParams.get('severity');
        const status = searchParams.get('status');
        const defectType = searchParams.get('defectType');

        const defects = await prisma.defectLog.findMany({
            where: {
                ...(severity && { severity }),
                ...(status && { status }),
                ...(defectType && { defectType }),
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return apiSuccess(defects);
    } catch (error) {
        console.error('Error fetching defects:', error);
        return apiError('Failed to fetch defects', 500);
    }
});

// POST /api/quality/defects - Log a new defect
export const POST = withRateLimit(async (request: Request) => {
    try {
        const body = await request.json();
        const {
            defectType,
            severity,
            description,
            location,
            productLine,
            rootCause,
            correctiveAction,
            reportedBy,
            assignedTo,
        } = body;

        if (!defectType || !severity || !description) {
            return apiError('Defect type, severity, and description are required', 400);
        }

        const defect = await prisma.defectLog.create({
            data: {
                defectType,
                severity,
                description,
                location,
                productLine,
                rootCause,
                correctiveAction,
                reportedBy,
                assignedTo,
            },
        });

        return apiSuccess(defect, 201);
    } catch (error) {
        console.error('Error creating defect log:', error);
        return apiError('Failed to create defect log', 500);
    }
});
