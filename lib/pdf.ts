import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
if (typeof window === 'undefined') {
    // Server-side: use legacy build
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Convert the first page of a PDF to a PNG image data URL
 * @param pdfBuffer Buffer containing PDF data
 * @returns Data URL of the rendered PDF page as PNG
 */
export async function convertPdfToImage(pdfBuffer: Buffer): Promise<string> {
    try {
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Set scale for good quality (2x for retina displays)
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Create canvas (Node.js environment)
        const { createCanvas } = await import('canvas');
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // Render the page
        const renderContext = {
            canvasContext: context as any,
            viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Convert canvas to PNG data URL
        const dataUrl = canvas.toDataURL('image/png');

        return dataUrl;
    } catch (error) {
        console.error('PDF to image conversion error:', error);
        throw new Error('Failed to convert PDF to image');
    }
}

/**
 * Extract text from PDF (existing functionality)
 */
const pdfParse = require("pdf-parse");

export async function parsePdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
    const data = await pdfParse(buffer);
    return {
        text: data.text,
        pages: data.numpages
    };
}
