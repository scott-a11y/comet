import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        if (!env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key not configured" },
                { status: 500 }
            );
        }

        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are the Comet AI Assistant, an expert in shop layout design and lean manufacturing for cabinet and woodworking shops. You help users optimize their machine placement, material flow, and safety. Keep your responses concise and action-oriented."
                },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        return NextResponse.json({
            message: response.choices[0].message
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get AI response" },
            { status: 500 }
        );
    }
}
