/**
 * Blueprint Analyzer - AI Vision Integration for Wall Detection
 * Uses OpenAI Vision API to analyze floor plan blueprints and extract geometry
 */

export interface WallSegment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness?: number;
}

export interface Opening {
    x: number;
    y: number;
    width: number;
    type: 'door' | 'window';
    swingDirection?: 'left' | 'right' | 'in' | 'out';
}

export interface ScaleInfo {
    pixels: number;
    feet: number;
    confidence: number;
}

export interface BlueprintAnalysisResult {
    walls: WallSegment[];
    doors: Opening[];
    windows: Opening[];
    scale?: ScaleInfo;
    dimensions?: {
        width: number;
        height: number;
        unit: 'feet' | 'meters';
    };
    confidence: number;
    notes?: string[];
}

/**
 * Structured prompt for OpenAI Vision API
 */
export const BLUEPRINT_ANALYSIS_PROMPT = `You are an expert architectural blueprint analyzer. Analyze this floor plan image and extract the following information:

1. **Wall Segments**: Identify all wall lines. For each wall, provide:
   - Start point (x1, y1) in pixels from top-left
   - End point (x2, y2) in pixels from top-left
   - Estimated thickness in pixels (if visible)

2. **Doors**: Identify all door openings. For each door, provide:
   - Center position (x, y) in pixels
   - Width in pixels
   - Swing direction if visible (left/right/in/out)

3. **Windows**: Identify all window openings. For each window, provide:
   - Center position (x, y) in pixels
   - Width in pixels

4. **Scale Detection**: If a scale bar or dimension annotations are visible:
   - Measure the scale bar length in pixels
   - Extract the real-world measurement (in feet or meters)
   - Provide confidence level (0-1)

5. **Overall Dimensions**: If building dimensions are annotated:
   - Total width and height
   - Unit of measurement

Return ONLY a valid JSON object with this exact structure:
{
  "walls": [{"x1": 0, "y1": 0, "x2": 100, "y2": 0, "thickness": 6}],
  "doors": [{"x": 50, "y": 0, "width": 36, "type": "door", "swingDirection": "right"}],
  "windows": [{"x": 150, "y": 0, "width": 48, "type": "window"}],
  "scale": {"pixels": 100, "feet": 10, "confidence": 0.9},
  "dimensions": {"width": 40, "height": 30, "unit": "feet"},
  "confidence": 0.85,
  "notes": ["Scale bar found in bottom right", "Some walls may be approximate"]
}

IMPORTANT:
- Use pixel coordinates relative to the image's top-left corner (0,0)
- Be as accurate as possible with measurements
- If you're uncertain about any element, note it in the "notes" array
- Set confidence to 0 if you cannot reliably detect walls
- Return valid JSON only, no markdown formatting`;

/**
 * Analyze blueprint image using OpenAI Vision API
 */
export async function analyzeBlueprintWithAI(
    imageDataUrl: string
): Promise<BlueprintAnalysisResult> {
    // This will be called from the API route
    // Keeping the logic here for reusability

    const response = await fetch('/api/analyze-blueprint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image: imageDataUrl,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze blueprint');
    }

    const result: BlueprintAnalysisResult = await response.json();

    // Validate result
    if (!result.walls || !Array.isArray(result.walls)) {
        throw new Error('Invalid analysis result: missing walls array');
    }

    return result;
}

/**
 * Validate blueprint analysis result
 */
export function validateAnalysisResult(result: any): result is BlueprintAnalysisResult {
    if (!result || typeof result !== 'object') return false;
    if (!Array.isArray(result.walls)) return false;
    if (!Array.isArray(result.doors)) return false;
    if (!Array.isArray(result.windows)) return false;
    if (typeof result.confidence !== 'number') return false;

    // Validate wall segments
    for (const wall of result.walls) {
        if (typeof wall.x1 !== 'number' || typeof wall.y1 !== 'number') return false;
        if (typeof wall.x2 !== 'number' || typeof wall.y2 !== 'number') return false;
    }

    return true;
}
