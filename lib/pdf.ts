
const pdf = require("pdf-parse");

export async function parsePdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
    const data = await pdf(buffer);
    return {
        text: data.text,
        pages: data.numpages
    };
}
