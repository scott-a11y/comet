import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { withRateLimit } from '@/lib/api-middleware';

// GET /api/sops - List all SOPs
export const GET = withRateLimit(async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const status = searchParams.get('status');

        const sops = await prisma.sOP.findMany({
            where: {
                ...(category && { category }),
                ...(status && { status }),
            },
            include: {
                steps: {
                    orderBy: {
                        stepNumber: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return apiSuccess(sops);
    } catch (error) {
        console.error('Error fetching SOPs:', error);
        return apiError('Failed to fetch SOPs', 500);
    }
});

// POST /api/sops - Create a new SOP
export const POST = withRateLimit(async (request: Request) => {
    try {
        const body = await request.json();
        const { title, category, description, tags, steps } = body;

        if (!title || !category) {
            return apiError('Title and category are required', 400);
        }

        const sop = await prisma.sOP.create({
            data: {
                title,
                category,
                description,
                tags: tags || [],
                steps: {
                    create: steps?.map((step: any, index: number) => ({
                        stepNumber: index + 1,
                        title: step.title,
                        instructions: step.instructions,
                        photoUrl: step.photoUrl,
                        estimatedMinutes: step.estimatedMinutes,
                        safetyNotes: step.safetyNotes,
                    })) || [],
                },
            },
            include: {
                steps: {
                    orderBy: {
                        stepNumber: 'asc',
                    },
                },
            },
        });

        return apiSuccess(sop, 201);
    } catch (error) {
        console.error('Error creating SOP:', error);
        return apiError('Failed to create SOP', 500);
    }
});
