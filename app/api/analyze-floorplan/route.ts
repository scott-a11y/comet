import { NextRequest, NextResponse } from "next/server";
import { startFloorPlanAnalysis } from "@/actions/analyze";

export async function POST(request: NextRequest) {
    try {
        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: "Image URL is required" },
                { status: 400 }
            );
        }

        // Call the server action
        const [data, error] = await startFloorPlanAnalysis({ imageUrl });

        if (error) {
            console.error("Analysis error:", error);
            return NextResponse.json(
                { error: error.message || "Analysis failed" },
                { status: 500 }
            );
        }

        if (!data || !data.success || !data.data) {
            return NextResponse.json(
                { error: "No analysis data returned" },
                { status: 500 }
            );
        }

        return NextResponse.json(data.data);
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
