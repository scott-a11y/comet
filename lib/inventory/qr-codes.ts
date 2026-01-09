import QRCode from 'qrcode';

/**
 * QR Code Generation for Inventory Items
 * Generate scannable QR codes for quick item lookup and stock management
 */

// ============================================================================
// Types
// ============================================================================

export interface InventoryQRData {
    type: 'inventory_item';
    id: number;
    sku: string;
    name: string;
    location?: string;
}

export interface QRCodeOptions {
    size?: number; // pixels
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    color?: {
        dark?: string;
        light?: string;
    };
}

export interface PrintLabel {
    qrCode: string; // data URL
    itemName: string;
    sku: string;
    location?: string;
    size: 'small' | 'medium' | 'large'; // 2x4, 3x5, 4x6 inches
}

// ============================================================================
// QR Code Generation
// ============================================================================

/**
 * Generate QR code data URL for an inventory item
 */
export async function generateInventoryQR(
    data: InventoryQRData,
    options: QRCodeOptions = {}
): Promise<string> {
    const defaultOptions: QRCodeOptions = {
        size: 300,
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    };

    const qrOptions = { ...defaultOptions, ...options };

    try {
        // Convert data to JSON string
        const jsonData = JSON.stringify(data);

        // Generate QR code as data URL
        const dataUrl = await QRCode.toDataURL(jsonData, {
            width: qrOptions.size,
            errorCorrectionLevel: qrOptions.errorCorrectionLevel,
            margin: qrOptions.margin,
            color: qrOptions.color,
        });

        return dataUrl;
    } catch (error) {
        console.error('QR code generation failed:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Parse QR code data
 */
export function parseInventoryQR(qrData: string): InventoryQRData | null {
    try {
        const parsed = JSON.parse(qrData);

        if (parsed.type !== 'inventory_item') {
            return null;
        }

        return parsed as InventoryQRData;
    } catch (error) {
        console.error('Failed to parse QR data:', error);
        return null;
    }
}

// ============================================================================
// Label Generation
// ============================================================================

/**
 * Generate printable label with QR code
 */
export async function generatePrintLabel(
    item: {
        id: number;
        name: string;
        sku: string;
        location?: string;
    },
    size: 'small' | 'medium' | 'large' = 'medium'
): Promise<PrintLabel> {
    const qrData: InventoryQRData = {
        type: 'inventory_item',
        id: item.id,
        sku: item.sku,
        name: item.name,
        location: item.location,
    };

    // Size determines QR code resolution
    const qrSize = size === 'small' ? 200 : size === 'medium' ? 300 : 400;

    const qrCode = await generateInventoryQR(qrData, { size: qrSize });

    return {
        qrCode,
        itemName: item.name,
        sku: item.sku,
        location: item.location,
        size,
    };
}

/**
 * Generate multiple labels for batch printing
 */
export async function generateBatchLabels(
    items: Array<{
        id: number;
        name: string;
        sku: string;
        location?: string;
    }>,
    size: 'small' | 'medium' | 'large' = 'medium'
): Promise<PrintLabel[]> {
    const labels = await Promise.all(
        items.map(item => generatePrintLabel(item, size))
    );

    return labels;
}

// ============================================================================
// Label Dimensions (in inches)
// ============================================================================

export const LABEL_DIMENSIONS = {
    small: { width: 2, height: 4 },   // 2" x 4"
    medium: { width: 3, height: 5 },  // 3" x 5"
    large: { width: 4, height: 6 },   // 4" x 6"
} as const;

/**
 * Get CSS dimensions for label size
 */
export function getLabelCSS(size: 'small' | 'medium' | 'large'): {
    width: string;
    height: string;
} {
    const dims = LABEL_DIMENSIONS[size];
    return {
        width: `${dims.width}in`,
        height: `${dims.height}in`,
    };
}

// ============================================================================
// QR Code Scanning Helpers
// ============================================================================

/**
 * Validate QR code data
 */
export function isValidInventoryQR(data: unknown): data is InventoryQRData {
    if (typeof data !== 'object' || data === null) return false;

    const obj = data as Record<string, unknown>;

    return (
        obj.type === 'inventory_item' &&
        typeof obj.id === 'number' &&
        typeof obj.sku === 'string' &&
        typeof obj.name === 'string'
    );
}

/**
 * Extract item ID from QR data
 */
export function getItemIdFromQR(qrData: string): number | null {
    const parsed = parseInventoryQR(qrData);
    return parsed?.id ?? null;
}
