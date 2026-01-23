import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";
import { withAuth } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/api-middleware";
import { apiError } from "@/lib/api-response";

// Validate chat input
const chatInputSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(10000),
    })).min(1).max(50),
});

async function chatHandler(userId: string, req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input
        const validated = chatInputSchema.safeParse(body);
        if (!validated.success) {
            return apiError('Invalid input: ' + validated.error.errors.map(e => e.message).join(', '), 400);
        }

        const { messages } = validated.data;

        if (!env.OPENAI_API_KEY) {
            return apiError('OpenAI API key not configured', 500);
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
    } catch (error) {
        console.error("Chat API error:", error);
        const message = error instanceof Error ? error.message : "Failed to get AI response";
        return apiError(message, 500);
    }
}

// Protected route with auth and rate limiting (stricter limit for AI calls)
export const POST = withRateLimit(withAuth(chatHandler));
