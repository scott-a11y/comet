"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { machinerySpecsSchema } from "@/lib/validations/machinery";
import { parsePdfText } from "@/lib/pdf";

// Input schema: Raw text or file content
// For prototype, we will handle "Text" extraction on the client or simple simple text input first, 
// OR simpler: Input is just the raw text extracted from PDF. 
// REAL WORLD: We want to upload a file. 
// Server Actions don't support FormData directly in ZSA inputs easily without casting. 
// Let's stick to a string input (extracted text) for the Alpha version, 
// relying on the Client to parse PDF? 
// No, `pdf-parse` is a Node library. Ideally we run it on server.
// Let's make the input a base64 string or FormData if ZSA supports it? 
// ZSA input usually validation schema. 
// Let's try: Input is a string (base64 of pdf)
// Actually, `pdf-parse` needs a Buffer.

const extractSpecsInputSchema = z.object({
    fileBase64: z.string().describe("Base64 encoded PDF file"),
});

export const extractMachinerySpecs = createServerAction()
    .input(extractSpecsInputSchema)
    .handler(async ({ input }) => {
        console.log('[Machinery Spec Agent] Starting extraction...');

        if (!env.OPENAI_API_KEY) {
            throw new Error("OpenAI API key not configured");
        }

        try {
            // 1. Decode Base64 to Buffer
            const buffer = Buffer.from(input.fileBase64, 'base64');

            // 2. Parse PDF Text
            const { text, pages } = await parsePdfText(buffer);

            console.log(`[Machinery Spec Agent] PDF Parsed. Pages: ${pages}, Length: ${text.length}`);

            // Truncate if too long (OpenAI Limits)
            const MAX_CHARS = 20000;
            const truncatedText = text.substring(0, MAX_CHARS);

            // 3. Call OpenAI
            const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Evaluate the following text from a machinery manual. Extract the technical specifications into a JSON format. 
            Focus on Physical Dimensions, Electrical Requirements, Weight, and Clearance. 
            If exact values aren't found, leave them optional. 
            For units, normalize to Common US units (in, lb, ft) if possible, or keep original.
            
            Return ONLY valid JSON matching this structure:
            {
               "manufacturer": string,
               "model": string,
               "dimensions": { "width": number, "depth": number, "height": number, "unit": "in"|"ft"|"mm" },
               "weight": { "value": number, "unit": "lb"|"kg" },
               "electrical": { "voltage": number, "phase": number, "amps": number, "power": number, "unit": "kW"|"HP" },
               "clearance": { "front": number, "unit": "in" ... } 
            }`
                    },
                    {
                        role: "user",
                        content: truncatedText
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) throw new Error("No response from AI");

            const rawJson = JSON.parse(content);

            // 4. Validate
            const validated = machinerySpecsSchema.safeParse(rawJson);

            if (!validated.success) {
                console.warn("[Machinery Spec Agent] Validation warning:", validated.error);
                // Return raw if validation fails slightly? Or enforce strictness? 
                // For prototype, return best effort or failing is fine.
                // Let's try to return what we got, but maybe `safeParse` failure means it's garbage.
                return { success: false, error: "Failed to validate extracted data", details: validated.error };
            }

            return { success: true, data: validated.data, pagesProcessed: pages };

        } catch (e: any) {
            console.error("[Machinery Spec Agent] Error:", e);
            throw new Error(e.message || "Extraction Failed");
        }
    });
