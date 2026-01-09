"use client";

import { useState } from "react";
import Link from "next/link";

// Equipment marketplace data
const equipmentCategories = [
    { id: 'saws', name: 'Saws', icon: '🪚', count: 45 },
    { id: 'cnc', name: 'CNC Machines', icon: '🤖', count: 23 },
    { id: 'sanders', name: 'Sanders', icon: '⚙️', count: 18 },
    { id: 'dust', name: 'Dust Collection', icon: '💨', count: 31 },
    { id: 'tools', name: 'Hand Tools', icon: '🔧', count: 127 },
    { id: 'materials', name: 'Materials', icon: '📦', count: 89 },
];

const featuredProducts = [
    {
        id: 1,
        name: 'SawStop Professional Cabinet Saw',
        category: 'saws',
        price: 3299,
        image: '🪚',
        rating: 4.9,
        reviews: 234,
        verified: true,
        description: '3HP, 52" fence, safety brake system',
        specs: {
            power: '3 HP',
            voltage: '230V',
            dimensions: '52" x 38" x 34"',
        },
    },
    {
        id: 2,
        name: 'Laguna CNC Router 4x8',
        category: 'cnc',
        price: 24999,
        image: '🤖',
        rating: 4.8,
        reviews: 89,
        verified: true,
        description: '4x8 working area, automatic tool changer',
        specs: {
            workArea: '48" x 96"',
            power: '7.5 HP',
            toolChanger: '8 tools',
        },
    },
    {
        id: 3,
        name: 'Oneida Cyclone Dust Collector',
        category: 'dust',
        price: 2499,
        image: '💨',
        rating: 4.7,
        reviews: 156,
        verified: true,
        description: '3HP, 1550 CFM, cyclone separator',
        specs: {
            cfm: '1550 CFM',
            power: '3 HP',
            filtration: '0.5 micron',
        },
    },
    {
        id: 4,
        name: 'Festool Domino XL Joiner',
        category: 'tools',
        price: 1299,
        image: '🔧',
        rating: 5.0,
        reviews: 412,
        verified: true,
        description: 'Professional mortise and tenon joinery system',
        specs: {
            mortiseSize: '8-14mm',
            power: '720W',
            weight: '8.8 lbs',
        },
    },
];

export default function StorePage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = featuredProducts.filter(product => {
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        const matchesSearch = !searchQuery ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-slate-100">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                🛒 Comet Marketplace
                            </h1>
                            <p className="text-slate-400">Equipment, tools, and materials for your shop</p>
                        </div>
                        <Link
                            href="/"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            ← Back to App
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search equipment, tools, materials..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                    </div>
                </div>

                {/* Categories */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-slate-300">Categories</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {equipmentCategories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(
                                    selectedCategory === category.id ? null : category.id
                                )}
                                className={`p-4 rounded-xl border transition-all ${selectedCategory === category.id
                                        ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/50'
                                        : 'bg-slate-900/50 border-slate-700/50 hover:border-purple-500/50'
                                    }`}
                            >
                                <div className="text-4xl mb-2">{category.icon}</div>
                                <div className="text-sm font-semibold text-slate-200">{category.name}</div>
                                <div className="text-xs text-slate-500 mt-1">{category.count} items</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Featured Products */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-slate-200">
                            {selectedCategory ? 'Filtered Products' : 'Featured Products'}
                        </h2>
                        {selectedCategory && (
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="text-sm text-purple-400 hover:text-purple-300"
                            >
                                Clear filter
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                            >
                                {/* Product Image */}
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-12 flex items-center justify-center border-b border-slate-700/50">
                                    <div className="text-8xl">{product.image}</div>
                                </div>

                                {/* Product Info */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-slate-200 flex-1">
                                            {product.name}
                                        </h3>
                                        {product.verified && (
                                            <span className="text-green-400 text-xl" title="Verified Seller">
                                                ✓
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-400 mb-4">{product.description}</p>

                                    {/* Specs */}
                                    <div className="mb-4 space-y-1">
                                        {Object.entries(product.specs).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                                </span>
                                                <span className="text-slate-300 font-mono">{value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-slate-600'}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-sm text-slate-400">
                                            {product.rating} ({product.reviews} reviews)
                                        </span>
                                    </div>

                                    {/* Price & CTA */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold text-purple-400">
                                            ${product.price.toLocaleString()}
                                        </div>
                                        <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-purple-500/50">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">No products found</h3>
                            <p className="text-slate-500">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>

                {/* Benefits Section */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-6">
                        <div className="text-4xl mb-3">✓</div>
                        <h3 className="text-lg font-semibold text-blue-300 mb-2">Verified Sellers</h3>
                        <p className="text-sm text-slate-400">
                            All equipment verified for compatibility with your Comet layouts
                        </p>
                    </div>

                    <div className="bg-green-950/30 border border-green-800/30 rounded-xl p-6">
                        <div className="text-4xl mb-3">📐</div>
                        <h3 className="text-lg font-semibold text-green-300 mb-2">Exact Dimensions</h3>
                        <p className="text-sm text-slate-400">
                            Automatically adds equipment to your layout with correct dimensions
                        </p>
                    </div>

                    <div className="bg-purple-950/30 border border-purple-800/30 rounded-xl p-6">
                        <div className="text-4xl mb-3">💰</div>
                        <h3 className="text-lg font-semibold text-purple-300 mb-2">Best Prices</h3>
                        <p className="text-sm text-slate-400">
                            Competitive pricing from trusted manufacturers and dealers
                        </p>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-12 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-700/50 rounded-xl p-8 text-center">
                    <h2 className="text-2xl font-bold mb-2 text-slate-100">Become a Seller</h2>
                    <p className="text-slate-300 mb-6">
                        List your equipment and reach thousands of woodworking shops
                    </p>
                    <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-purple-500/50">
                        Apply to Sell
                    </button>
                </div>
            </div>
        </div>
    );
}
