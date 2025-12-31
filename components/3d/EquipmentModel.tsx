"use client";

import { useMemo } from "react";
import type { Equipment } from "@prisma/client";

interface EquipmentModelProps {
    item: Equipment;
}

export function EquipmentModel({ item }: EquipmentModelProps) {
    const { widthFt, depthFt, name, category } = item;

    // Default height based on category if not available
    const height = useMemo(() => {
        if (category.toLowerCase().includes('cnc')) return 6;
        if (category.toLowerCase().includes('saw')) return 4;
        return 5;
    }, [category]);

    // Color code based on category
    const color = useMemo(() => {
        if (category.toLowerCase().includes('cnc')) return "#fb923c"; // Orange
        if (category.toLowerCase().includes('saw')) return "#fca5a5"; // Red
        if (category.toLowerCase().includes('dust')) return "#94a3b8"; // Slate
        return "#38bdf8"; // Sky Blue
    }, [category]);

    return (
        <group position={[0, height / 2, 0]}>
            <mesh castShadow>
                <boxGeometry args={[widthFt, height, depthFt]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    );
}
