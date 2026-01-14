"use client";

import { useState } from "react";
import type { ShopBuilding, Equipment } from "@prisma/client";

interface Layout2DViewProps {
    building: ShopBuilding & { equipment: Equipment[] };
}

export function Layout2DView({ building }: Layout2DViewProps) {
    const width = building.widthFt ?? 50;
    const depth = building.depthFt ?? 50;
    const [scale, setScale] = useState(10); // pixels per foot

    // Calculate canvas dimensions
    const canvasWidth = width * scale;
    const canvasHeight = depth * scale;

    return (
        <div className="h-screen w-full bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{building.name}</h1>
                        <p className="text-slate-400">
                            {width}' × {depth}' • {building.ceilingHeightFt || 20}' ceiling
                        </p>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-4">
                        <span className="text-slate-400">Zoom:</span>
                        <button
                            onClick={() => setScale(Math.max(5, scale - 2))}
                            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                        >
                            −
                        </button>
                        <span className="text-white font-mono">{scale}px/ft</span>
                        <button
                            onClick={() => setScale(Math.min(20, scale + 2))}
                            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* 2D Layout Canvas */}
                <div className="bg-slate-900 rounded-lg p-8 overflow-auto">
                    <svg
                        width={canvasWidth}
                        height={canvasHeight}
                        className="border-2 border-slate-700"
                        style={{ minWidth: canvasWidth, minHeight: canvasHeight }}
                    >
                        {/* Grid */}
                        <defs>
                            <pattern
                                id="grid"
                                width={scale}
                                height={scale}
                                patternUnits="userSpaceOnUse"
                            >
                                <path
                                    d={`M ${scale} 0 L 0 0 0 ${scale}`}
                                    fill="none"
                                    stroke="#334155"
                                    strokeWidth="0.5"
                                />
                            </pattern>
                            <pattern
                                id="grid-major"
                                width={scale * 10}
                                height={scale * 10}
                                patternUnits="userSpaceOnUse"
                            >
                                <path
                                    d={`M ${scale * 10} 0 L 0 0 0 ${scale * 10}`}
                                    fill="none"
                                    stroke="#475569"
                                    strokeWidth="1"
                                />
                            </pattern>
                        </defs>

                        {/* Background */}
                        <rect width={canvasWidth} height={canvasHeight} fill="#1e293b" />
                        <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />
                        <rect width={canvasWidth} height={canvasHeight} fill="url(#grid-major)" />

                        {/* Building Outline */}
                        <rect
                            x="0"
                            y="0"
                            width={canvasWidth}
                            height={canvasHeight}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="3"
                        />

                        {/* Equipment */}
                        {building.equipment && building.equipment.map((eq) => {
                            const eqWidth = (eq.widthFt || 4) * scale;
                            const eqDepth = (eq.depthFt || 4) * scale;
                            const x = ((eq as any).xPos || 0) * scale;
                            const y = ((eq as any).yPos || 0) * scale;

                            return (
                                <g key={eq.id}>
                                    {/* Equipment Box */}
                                    <rect
                                        x={x}
                                        y={y}
                                        width={eqWidth}
                                        height={eqDepth}
                                        fill="#3b82f6"
                                        stroke="#60a5fa"
                                        strokeWidth="2"
                                        opacity="0.8"
                                    />

                                    {/* Equipment Label */}
                                    <text
                                        x={x + eqWidth / 2}
                                        y={y + eqDepth / 2}
                                        fill="white"
                                        fontSize="12"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        {eq.name}
                                    </text>

                                    {/* Dimensions */}
                                    <text
                                        x={x + eqWidth / 2}
                                        y={y + eqDepth / 2 + 15}
                                        fill="#94a3b8"
                                        fontSize="10"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        {eq.widthFt}'×{eq.depthFt}'
                                    </text>
                                </g>
                            );
                        })}

                        {/* Scale Reference */}
                        <g transform={`translate(20, ${canvasHeight - 40})`}>
                            <line x1="0" y1="0" x2={scale * 10} y2="0" stroke="white" strokeWidth="2" />
                            <line x1="0" y1="-5" x2="0" y2="5" stroke="white" strokeWidth="2" />
                            <line x1={scale * 10} y1="-5" x2={scale * 10} y2="5" stroke="white" strokeWidth="2" />
                            <text x={scale * 5} y="-10" fill="white" fontSize="12" textAnchor="middle">
                                10 feet
                            </text>
                        </g>
                    </svg>
                </div>

                {/* Equipment List */}
                <div className="mt-6 bg-slate-900 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Equipment ({building.equipment?.length || 0})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {building.equipment && building.equipment.length > 0 ? (
                            building.equipment.map((eq) => (
                                <div key={eq.id} className="bg-slate-800 rounded p-4">
                                    <h3 className="font-semibold text-white mb-2">{eq.name}</h3>
                                    <div className="text-sm text-slate-400 space-y-1">
                                        <p>Size: {eq.widthFt}' × {eq.depthFt}'</p>
                                        <p>Category: {eq.category || 'N/A'}</p>
                                        {eq.requiresDust && <span className="text-blue-400">• Dust Collection</span>}
                                        {eq.requiresAir && <span className="text-green-400">• Compressed Air</span>}
                                        {eq.requiresHighVoltage && <span className="text-yellow-400">• High Voltage</span>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 col-span-full">
                                No equipment added yet. Add equipment to see it on the layout.
                            </p>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <h3 className="text-blue-400 font-semibold mb-2">💡 2D Layout View</h3>
                    <p className="text-slate-300 text-sm">
                        This is a top-down 2D view of your shop. Equipment positions are shown in blue.
                        Use the zoom controls to adjust the view. The 3D view will be available soon.
                    </p>
                </div>
            </div>
        </div>
    );
}
