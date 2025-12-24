import { task } from "@trigger.dev/sdk/v3";
import { OpenAI } from "openai";
import { z } from "zod";

const InputSchema = z.object({
  pdfUrl: z.string().url(),
});

const OutputSchema = z.object({
  width: z.number(),
  length: z.number(),
  height: z.number().optional(),
  summary: z.string(),
});

export const analyzePdfTask = task({
  id: "analyze-pdf",
  maxDuration: 60,
  run: async (payload: z.infer<typeof InputSchema>) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze this floor plan image. Extract width, length (in feet) and provide a summary. Return JSON only with keys: width, length, height (optional), summary."
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: payload.pdfUrl }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No analysis returned");

    const parsed = JSON.parse(content);
    return OutputSchema.parse(parsed);
  },
});
