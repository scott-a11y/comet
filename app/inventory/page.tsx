"use client";

import { useState } from "react";
import {
    generateKanbanBoard,
    generateReorderAlert,
    generateShoppingList,
    calculateShoppingListCost,
    type InventoryItem,
    type Supplier,
    type KanbanCard,
    type KanbanColumn,
} from "@/lib/inventory/kanban";

// Sample data for demo
const sampleSuppliers: Map<number, Supplier> = new Map([
    [1, { id: 1, name: "Woodworkers Supply", contactEmail: "sales@wwsupply.com", leadTimeDays: 3 }],
    [2, { id: 2, name: "Hardware Direct", contactEmail: "orders@hwdirect.com", leadTimeDays: 5 }],
    [3, { id: 3, name: "Finishing Solutions", contactEmail: "info@finishingsolutions.com", leadTimeDays: 7 }],
]);

const sampleInventory: InventoryItem[] = [
    {
        id: 1,
        name: "Maple Plywood 4x8",
        sku: "MPL-48",
        category: "lumber",
        currentStock: 25,
        unit: "sheets",
        reorderPoint: 10,
        reorderQuantity: 20,
        costPerUnit: 65,
        supplierId: 1,
        location: "Rack A",
    },
    {
        id: 2,
        name: "Cabinet Hinges (Soft-Close)",
        sku: "HNG-SC",
        category: "hardware",
        currentStock: 8,
        unit: "pairs",
        reorderPoint: 20,
        reorderQuantity: 50,
        costPerUnit: 4.5,
        supplierId: 2,
        location: "Bin 12",
    },
    {
        id: 3,
        name: "Pre-Catalyzed Lacquer",
        sku: "LAC-PC",
        category: "finishing",
        currentStock: 2,
        unit: "gallons",
        reorderPoint: 5,
        reorderQuantity: 10,
        costPerUnit: 45,
        supplierId: 3,
        location: "Finishing Room",
    },
    {
        id: 4,
        name: "Drawer Slides 22\"",
        sku: "SLD-22",
        category: "hardware",
        currentStock: 0,
        unit: "pairs",
        reorderPoint: 15,
        reorderQuantity: 40,
        costPerUnit: 12,
        supplierId: 2,
        location: "Bin 8",
    },
    {
        id: 5,
        name: "Oak Hardwood S4S",
        sku: "OAK-S4S",
        category: "lumber",
        currentStock: 150,
        unit: "board feet",
        reorderPoint: 100,
        reorderQuantity: 200,
        costPerUnit: 8.5,
        supplierId: 1,
        location: "Rack B",
    },
];

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventory);
    const [showAddItem, setShowAddItem] = useState(false);
    const [showShoppingList, setShowShoppingList] = useState(false);

    const board = generateKanbanBoard(inventory);
    const shoppingList = generateShoppingList(inventory, sampleSuppliers);
    const shoppingListCost = calculateShoppingListCost(shoppingList);

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return 'border-red-500 bg-red-950/30';
            case 'high': return 'border-orange-500 bg-orange-950/30';
            case 'medium': return 'border-yellow-500 bg-yellow-950/30';
            default: return 'border-green-500 bg-green-950/30';
        }
    };

    const getColumnColor = (column: KanbanColumn) => {
        switch (column) {
            case 'in_stock': return 'from-green-900/50 to-emerald-900/50 border-green-700/50';
            case 'low_stock': return 'from-yellow-900/50 to-amber-900/50 border-yellow-700/50';
            case 'order_needed': return 'from-orange-900/50 to-red-900/50 border-orange-700/50';
            case 'ordered': return 'from-blue-900/50 to-cyan-900/50 border-blue-700/50';
            case 'received': return 'from-purple-900/50 to-pink-900/50 border-purple-700/50';
        }
    };

    const getColumnTitle = (column: KanbanColumn) => {
        switch (column) {
            case 'in_stock': return '✅ In Stock';
            case 'low_stock': return '⚠️ Low Stock';
            case 'order_needed': return '🔴 Order Needed';
            case 'ordered': return '📦 Ordered';
            case 'received': return '🎉 Received';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-slate-100 p-8">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            📋 Inventory Kanban
                        </h1>
                        <p className="text-slate-400">Visual inventory management and ordering</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowShoppingList(true)}
                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-orange-500/50"
                        >
                            🛒 Shopping List ({shoppingList.length})
                        </button>
                        <button
                            onClick={() => setShowAddItem(true)}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-indigo-500/50"
                        >
                            + Add Item
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                        <div className="text-sm text-slate-500 mb-1">Total Items</div>
                        <div className="text-2xl font-bold text-slate-200">{board.stats.totalItems}</div>
                    </div>
                    <div className="bg-yellow-950/30 border border-yellow-800/30 rounded-xl p-4">
                        <div className="text-sm text-slate-500 mb-1">Low Stock</div>
                        <div className="text-2xl font-bold text-yellow-300">{board.stats.lowStockCount}</div>
                    </div>
                    <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
                        <div className="text-sm text-slate-500 mb-1">Need to Order</div>
                        <div className="text-2xl font-bold text-red-300">{board.stats.orderNeededCount}</div>
                    </div>
                    <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-4">
                        <div className="text-sm text-slate-500 mb-1">Pending Orders</div>
                        <div className="text-2xl font-bold text-blue-300">{board.stats.pendingOrdersCount}</div>
                    </div>
                    <div className="bg-green-950/30 border border-green-800/30 rounded-xl p-4">
                        <div className="text-sm text-slate-500 mb-1">Inventory Value</div>
                        <div className="text-2xl font-bold text-green-300">
                            ${board.stats.totalInventoryValue.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {(Object.keys(board.columns) as KanbanColumn[]).map((column) => (
                        <div key={column} className="flex flex-col">
                            {/* Column Header */}
                            <div className={`bg-gradient-to-r ${getColumnColor(column)} backdrop-blur rounded-t-xl border p-4 mb-2`}>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-100">{getColumnTitle(column)}</h3>
                                    <span className="text-sm bg-slate-900/50 px-2 py-1 rounded-full">
                                        {board.columns[column].length}
                                    </span>
                                </div>
                            </div>

                            {/* Column Cards */}
                            <div className="space-y-3 flex-1">
                                {board.columns[column].map((card) => (
                                    <div
                                        key={card.id}
                                        className={`bg-slate-900/50 backdrop-blur rounded-lg border-2 ${getUrgencyColor(card.urgency)} p-4 cursor-move hover:shadow-lg transition-all`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-slate-200 text-sm">{card.name}</h4>
                                            <span className={`text-xs px-2 py-1 rounded-full ${card.urgency === 'critical' ? 'bg-red-600' :
                                                    card.urgency === 'high' ? 'bg-orange-600' :
                                                        card.urgency === 'medium' ? 'bg-yellow-600' :
                                                            'bg-green-600'
                                                }`}>
                                                {card.urgency}
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-500 mb-3">SKU: {card.sku}</div>

                                        {/* Stock Meter */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-slate-500">Stock</span>
                                                <span className="text-slate-300 font-mono">
                                                    {card.currentStock} / {card.reorderPoint} {card.unit}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${card.currentStock <= 0 ? 'bg-red-500' :
                                                            card.currentStock <= card.reorderPoint ? 'bg-orange-500' :
                                                                card.currentStock <= card.reorderPoint * 1.5 ? 'bg-yellow-500' :
                                                                    'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min(100, (card.currentStock / (card.reorderPoint * 2)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-1 text-xs text-slate-400 mb-3">
                                            <div>📍 {card.location || 'No location'}</div>
                                            <div>💰 ${card.costPerUnit}/{card.unit}</div>
                                            {card.supplierId && (
                                                <div>🏢 {sampleSuppliers.get(card.supplierId)?.name}</div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {column === 'order_needed' && (
                                                <button className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold transition-colors">
                                                    Order Now
                                                </button>
                                            )}
                                            {column === 'received' && (
                                                <button className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors">
                                                    Confirm Receipt
                                                </button>
                                            )}
                                            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold transition-colors">
                                                Adjust
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {board.columns[column].length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-sm">
                                        No items
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Shopping List Modal */}
                {showShoppingList && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-100">🛒 Shopping List</h2>
                                    <button
                                        onClick={() => setShowShoppingList(false)}
                                        className="text-slate-400 hover:text-slate-200 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                                <p className="text-slate-400 mt-1">Items needing reorder</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {shoppingList.length > 0 ? (
                                    <div className="space-y-3">
                                        {shoppingList.map((item) => (
                                            <div key={item.itemId} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-200">{item.itemName}</h3>
                                                        <div className="text-sm text-slate-500">SKU: {item.sku}</div>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${item.urgency === 'critical' ? 'bg-red-600' :
                                                            item.urgency === 'high' ? 'bg-orange-600' :
                                                                'bg-yellow-600'
                                                        }`}>
                                                        {item.urgency}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <div className="text-slate-500">Quantity</div>
                                                        <div className="text-slate-200 font-semibold">
                                                            {item.quantityNeeded} {item.unit}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-500">Cost</div>
                                                        <div className="text-green-400 font-semibold">
                                                            ${item.estimatedCost.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-500">Supplier</div>
                                                        <div className="text-slate-200 text-xs">
                                                            {item.supplier || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">✅</div>
                                        <h3 className="text-xl font-semibold text-slate-300 mb-2">All Stocked Up!</h3>
                                        <p className="text-slate-500">No items need reordering</p>
                                    </div>
                                )}
                            </div>

                            {shoppingList.length > 0 && (
                                <div className="p-6 border-t border-slate-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-slate-300 font-semibold">Total Estimated Cost:</span>
                                        <span className="text-2xl font-bold text-green-400">
                                            ${shoppingListCost.toLocaleString()}
                                        </span>
                                    </div>
                                    <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all">
                                        Order All Items
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
