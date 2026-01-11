import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BLUEPRINT_ANALYSIS_PROMPT, validateAnalysisResult, type BlueprintAnalysisResult } from '@/lib/wall-designer/blueprint-analyzer';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json();

        if (!image || typeof image !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request: image data URL required' },
                { status: 400 }
            );
        }

        // Validate image is a data URL
        if (!image.startsWith('data:image/')) {
            return NextResponse.json(
                { error: 'Invalid image format: must be a data URL' },
                { status: 400 }
            );
        }

        // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // or 'gpt-4-vision-preview'
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: BLUEPRINT_ANALYSIS_PROMPT,
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: image,
                                detail: 'high', // Use high detail for better accuracy
                            },
                        },
                    ],
                },
            ],
            max_tokens: 4096,
            temperature: 0.1, // Low temperature for more consistent results
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            return NextResponse.json(
                { error: 'No response from AI' },
                { status: 500 }
            );
        }

        // Parse JSON response
        let analysisResult: BlueprintAnalysisResult;
        try {
            // Remove markdown code blocks if present
            const cleanedContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            analysisResult = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error('Failed to parse AI response:', content);
            return NextResponse.json(
                { error: 'Failed to parse AI response as JSON', details: content },
                { status: 500 }
            );
        }

        // Validate result structure
        if (!validateAnalysisResult(analysisResult)) {
            return NextResponse.json(
                { error: 'Invalid analysis result structure', result: analysisResult },
                { status: 500 }
            );
        }

        // Return successful analysis
        return NextResponse.json(analysisResult);

    } catch (error) {
        console.error('Blueprint analysis error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Unknown error occurred during analysis' },
            { status: 500 }
        );
    }
}

// Optional: Add rate limiting
export const runtime = 'edge'; // Use edge runtime for faster responses
export const maxDuration = 60; // Allow up to 60 seconds for AI processing
