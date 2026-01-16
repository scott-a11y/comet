import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Sanitize filename and add timestamp to prevent collisions
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${safeName}`;
        const filepath = join(uploadDir, filename);

        // Write file to public/uploads
        await writeFile(filepath, buffer);

        // Return the public URL
        // In production this wouldn't work well without a real specific domain config,
        // but this is specifically a local dev fallback.
        const url = `/uploads/${filename}`;

        return NextResponse.json({
            url,
            pathname: url,
            contentType: file.type,
        });

    } catch (error) {
        console.error('Local upload failed:', error);
        return NextResponse.json(
            { error: 'Local upload failed' },
            { status: 500 }
        );
    }
}
