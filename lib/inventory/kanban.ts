import { z } from 'zod';

/**
 * Kanban-based Inventory Management System
 * Visual workflow for tracking materials, supplies, and ordering
 */

// ============================================================================
// Types & Schemas
// ============================================================================

export const inventoryItemSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    sku: z.string(),
    category: z.enum(['lumber', 'hardware', 'finishing', 'tools', 'consumables', 'other']),
    currentStock: z.number().nonnegative(),
    unit: z.string(), // pieces, board feet, gallons, etc.
    reorderPoint: z.number().nonnegative(),
    reorderQuantity: z.number().positive(),
    costPerUnit: z.number().nonnegative(),
    supplierId: z.number().optional(),
    location: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const supplierSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    website: z.string().url().optional(),
    leadTimeDays: z.number().int().positive().optional(),
});

export const inventoryOrderSchema = z.object({
    id: z.number().optional(),
    itemId: z.number(),
    supplierId: z.number(),
    quantity: z.number().positive(),
    status: z.enum(['ordered', 'shipped', 'received', 'cancelled']),
    orderDate: z.date(),
    expectedDate: z.date().optional(),
    receivedDate: z.date().optional(),
    totalCost: z.number().nonnegative(),
    notes: z.string().optional(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type InventoryOrder = z.infer<typeof inventoryOrderSchema>;

// Kanban column types
export type KanbanColumn = 'in_stock' | 'low_stock' | 'order_needed' | 'ordered' | 'received';

export interface KanbanCard extends InventoryItem {
    column: KanbanColumn;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    daysUntilStockout?: number;
    pendingOrders?: InventoryOrder[];
}

export interface KanbanBoard {
    columns: {
        in_stock: KanbanCard[];
        low_stock: KanbanCard[];
        order_needed: KanbanCard[];
        ordered: KanbanCard[];
        received: KanbanCard[];
    };
    stats: {
        totalItems: number;
        lowStockCount: number;
        orderNeededCount: number;
        pendingOrdersCount: number;
        totalInventoryValue: number;
    };
}

// ============================================================================
// Stock Status Calculation
// ============================================================================

/**
 * Calculate which Kanban column an item belongs in
 */
export function calculateStockStatus(item: InventoryItem, pendingOrders: InventoryOrder[] = []): KanbanColumn {
    const { currentStock, reorderPoint } = item;

    // Check if there are pending orders
    const hasPendingOrder = pendingOrders.some(
        order => order.status === 'ordered' || order.status === 'shipped'
    );

    // Check if there are recently received orders
    const hasRecentDelivery = pendingOrders.some(
        order => order.status === 'received' &&
            order.receivedDate &&
            (new Date().getTime() - order.receivedDate.getTime()) < 24 * 60 * 60 * 1000 // within 24 hours
    );

    if (hasRecentDelivery) {
        return 'received';
    }

    if (hasPendingOrder) {
        return 'ordered';
    }

    if (currentStock <= 0) {
        return 'order_needed';
    }

    if (currentStock <= reorderPoint) {
        return 'order_needed';
    }

    if (currentStock <= reorderPoint * 1.5) {
        return 'low_stock';
    }

    return 'in_stock';
}

/**
 * Calculate urgency level for an item
 */
export function calculateUrgency(item: InventoryItem): 'low' | 'medium' | 'high' | 'critical' {
    const { currentStock, reorderPoint } = item;
    const stockPercentage = (currentStock / reorderPoint) * 100;

    if (currentStock <= 0) return 'critical';
    if (stockPercentage <= 50) return 'high';
    if (stockPercentage <= 100) return 'medium';
    return 'low';
}

/**
 * Estimate days until stockout (assuming constant usage)
 */
export function estimateDaysUntilStockout(
    currentStock: number,
    averageDailyUsage: number
): number | undefined {
    if (averageDailyUsage <= 0) return undefined;
    return Math.floor(currentStock / averageDailyUsage);
}

// ============================================================================
// Reorder Alerts
// ============================================================================

export interface ReorderAlert {
    itemId: number;
    itemName: string;
    currentStock: number;
    reorderPoint: number;
    reorderQuantity: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    estimatedCost: number;
    supplier?: string;
    message: string;
}

/**
 * Generate reorder alert for an item
 */
export function generateReorderAlert(
    item: InventoryItem,
    supplier?: Supplier
): ReorderAlert | null {
    const urgency = calculateUrgency(item);

    // Only alert if stock is low or critical
    if (urgency === 'low') return null;

    const estimatedCost = item.reorderQuantity * item.costPerUnit;

    let message = '';
    if (item.currentStock <= 0) {
        message = `OUT OF STOCK! Order ${item.reorderQuantity} ${item.unit} immediately.`;
    } else if (item.currentStock <= item.reorderPoint) {
        message = `Low stock (${item.currentStock} ${item.unit}). Reorder ${item.reorderQuantity} ${item.unit}.`;
    } else {
        message = `Stock running low. Consider reordering soon.`;
    }

    return {
        itemId: item.id!,
        itemName: item.name,
        currentStock: item.currentStock,
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        urgency,
        estimatedCost,
        supplier: supplier?.name,
        message,
    };
}

/**
 * Get all items needing reorder
 */
export function getItemsNeedingReorder(items: InventoryItem[]): InventoryItem[] {
    return items.filter(item => item.currentStock <= item.reorderPoint);
}

// ============================================================================
// Kanban Board Generation
// ============================================================================

/**
 * Generate complete Kanban board from inventory items
 */
export function generateKanbanBoard(
    items: InventoryItem[],
    orders: InventoryOrder[] = []
): KanbanBoard {
    const board: KanbanBoard = {
        columns: {
            in_stock: [],
            low_stock: [],
            order_needed: [],
            ordered: [],
            received: [],
        },
        stats: {
            totalItems: items.length,
            lowStockCount: 0,
            orderNeededCount: 0,
            pendingOrdersCount: 0,
            totalInventoryValue: 0,
        },
    };

    // Group orders by item
    const ordersByItem = new Map<number, InventoryOrder[]>();
    orders.forEach(order => {
        const itemOrders = ordersByItem.get(order.itemId) || [];
        itemOrders.push(order);
        ordersByItem.set(order.itemId, itemOrders);
    });

    // Process each item
    items.forEach(item => {
        const itemOrders = ordersByItem.get(item.id!) || [];
        const column = calculateStockStatus(item, itemOrders);
        const urgency = calculateUrgency(item);

        const card: KanbanCard = {
            ...item,
            column,
            urgency,
            pendingOrders: itemOrders.filter(o => o.status !== 'received' && o.status !== 'cancelled'),
        };

        board.columns[column].push(card);

        // Update stats
        if (column === 'low_stock') board.stats.lowStockCount++;
        if (column === 'order_needed') board.stats.orderNeededCount++;
        if (column === 'ordered') board.stats.pendingOrdersCount++;

        board.stats.totalInventoryValue += item.currentStock * item.costPerUnit;
    });

    return board;
}

// ============================================================================
// Inventory Operations
// ============================================================================

/**
 * Update inventory stock level
 */
export function updateInventory(
    item: InventoryItem,
    adjustment: number,
    reason: 'received' | 'consumed' | 'adjustment' | 'damaged'
): InventoryItem {
    const newStock = Math.max(0, item.currentStock + adjustment);

    return {
        ...item,
        currentStock: newStock,
        updatedAt: new Date(),
    };
}

/**
 * Create order for an item
 */
export function createOrder(
    item: InventoryItem,
    supplier: Supplier,
    quantity?: number
): Omit<InventoryOrder, 'id'> {
    const orderQuantity = quantity || item.reorderQuantity;
    const totalCost = orderQuantity * item.costPerUnit;
    const expectedDate = supplier.leadTimeDays
        ? new Date(Date.now() + supplier.leadTimeDays * 24 * 60 * 60 * 1000)
        : undefined;

    return {
        itemId: item.id!,
        supplierId: supplier.id!,
        quantity: orderQuantity,
        status: 'ordered',
        orderDate: new Date(),
        expectedDate,
        totalCost,
    };
}

/**
 * Receive order and update inventory
 */
export function receiveOrder(
    item: InventoryItem,
    order: InventoryOrder,
    quantityReceived?: number
): { item: InventoryItem; order: InventoryOrder } {
    const receivedQty = quantityReceived || order.quantity;

    const updatedItem = updateInventory(item, receivedQty, 'received');
    const updatedOrder: InventoryOrder = {
        ...order,
        status: 'received',
        receivedDate: new Date(),
    };

    return {
        item: updatedItem,
        order: updatedOrder,
    };
}

// ============================================================================
// Shopping List Generation
// ============================================================================

export interface ShoppingListItem {
    itemId: number;
    itemName: string;
    sku: string;
    quantityNeeded: number;
    unit: string;
    estimatedCost: number;
    supplier?: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Generate shopping list for items needing reorder
 */
export function generateShoppingList(
    items: InventoryItem[],
    suppliers: Map<number, Supplier>
): ShoppingListItem[] {
    return items
        .filter(item => item.currentStock <= item.reorderPoint)
        .map(item => {
            const supplier = item.supplierId ? suppliers.get(item.supplierId) : undefined;
            return {
                itemId: item.id!,
                itemName: item.name,
                sku: item.sku,
                quantityNeeded: item.reorderQuantity,
                unit: item.unit,
                estimatedCost: item.reorderQuantity * item.costPerUnit,
                supplier: supplier?.name,
                urgency: calculateUrgency(item),
            };
        })
        .sort((a, b) => {
            // Sort by urgency (critical first)
            const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        });
}

/**
 * Calculate total shopping list cost
 */
export function calculateShoppingListCost(shoppingList: ShoppingListItem[]): number {
    return shoppingList.reduce((total, item) => total + item.estimatedCost, 0);
}
