import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PDFUploadResult {
    imageUrl: string;
    width: number;
    height: number;
    pageCount: number;
}

/**
 * Convert PDF file to image for canvas overlay
 * @param file PDF file from input
 * @param pageNumber Page to convert (default: 1)
 * @param scale Render scale (default: 2 for high quality)
 * @returns Image data URL and dimensions
 */
export async function convertPDFToImage(
    file: File,
    pageNumber: number = 1,
    scale: number = 2
): Promise<PDFUploadResult> {
    // Validate file
    if (!file.type.includes('pdf')) {
        throw new Error('File must be a PDF');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('PDF file must be less than 10MB');
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Get requested page
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
        throw new Error(`Page ${pageNumber} does not exist. PDF has ${pdf.numPages} pages.`);
    }

    const page = await pdf.getPage(pageNumber);

    // Get viewport
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Failed to get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render PDF page to canvas
    await page.render({
        canvasContext: context,
        viewport: viewport,
    }).promise;

    // Convert canvas to data URL
    const imageUrl = canvas.toDataURL('image/png');

    return {
        imageUrl,
        width: viewport.width,
        height: viewport.height,
        pageCount: pdf.numPages,
    };
}

/**
 * Validate PDF file before upload
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.includes('pdf')) {
        return { valid: false, error: 'File must be a PDF' };
    }

    if (file.size > 10 * 1024 * 1024) {
        return { valid: false, error: 'PDF file must be less than 10MB' };
    }

    return { valid: true };
}
