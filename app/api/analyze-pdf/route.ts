import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { PDFAnalysisResponse, FloorPlanData } from '@/lib/types/pdf-analysis';

const analyzeSchema = z.object({
  pdfUrl: z.string().url(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfUrl } = analyzeSchema.parse(body);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' } as PDFAnalysisResponse,
        { status: 500 }
      );
    }

    // Use OpenAI Vision to analyze the PDF
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this floor plan PDF and extract the following information in JSON format:

1. Building dimensions (width, length, height in feet)
2. Wall positions (start/end coordinates)
3. Door and window locations with dimensions
4. Equipment placements with names and positions
5. Scale/units information
6. Any text labels or dimensions shown

Return a JSON object with this structure:
{
  "dimensions": {
    "width": number,
    "length": number,
    "height": number (optional)
  },
  "scale": {
    "unit": "feet" | "inches" | "meters" | "centimeters",
    "pixelsPerUnit": number (optional)
  },
  "walls": [
    {
      "startX": number,
      "startY": number,
      "endX": number,
      "endY": number,
      "thickness": number (optional)
    }
  ],
  "doors": [
    {
      "type": "door",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "orientation": number (optional)
    }
  ],
  "windows": [
    {
      "type": "window",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "orientation": number (optional)
    }
  ],
  "equipment": [
    {
      "name": string,
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "category": string (optional)
    }
  ],
  "labels": ["array of text labels found"],
  "notes": "additional observations"
}

If you cannot determine certain values, use null or omit the field. Focus on accuracy over completeness.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: pdfUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'No response from AI analysis' } as PDFAnalysisResponse,
        { status: 500 }
      );
    }

    // Try to parse the JSON response
    let analysisData: FloorPlanData;
    try {
      // Extract JSON from the response (it might be wrapped in markdown)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

      analysisData = JSON.parse(jsonString);

      // Validate the structure
      if (typeof analysisData.width !== 'number' || typeof analysisData.length !== 'number') {
        throw new Error('Invalid analysis structure');
      }

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse floor plan analysis'
        } as PDFAnalysisResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysisData,
      confidence: 0.8, // Estimated confidence
    } as PDFAnalysisResponse);

  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' } as PDFAnalysisResponse,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to analyze PDF' } as PDFAnalysisResponse,
      { status: 500 }
    );
  }
}
