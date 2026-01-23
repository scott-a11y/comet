"use client";

import { useMemo, useRef, useState, useEffect, memo } from "react";
import { Text } from "@react-three/drei";
import type { Equipment } from "@prisma/client";
import * as THREE from "three";

interface EquipmentModelProps {
    item: Equipment;
    position?: [number, number, number];
    isColliding?: boolean;
    onBoundsUpdate?: (id: string, bounds: THREE.Box3) => void;
}

export const EquipmentModel = memo(function EquipmentModel({
    item,
    position: externalPosition,
    isColliding = false,
    onBoundsUpdate
}: EquipmentModelProps) {
    const { widthFt, depthFt, name, category, orientation = 0 } = item;
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Default height based on category if not available
    const height = useMemo(() => {
        if (category.toLowerCase().includes('cnc')) return 6;
        if (category.toLowerCase().includes('saw')) return 4;
        if (category.toLowerCase().includes('lathe')) return 5;
        if (category.toLowerCase().includes('mill')) return 6;
        if (category.toLowerCase().includes('dust')) return 8;
        return 5;
    }, [category]);

    // Color code based on category and collision state
    const color = useMemo(() => {
        if (isColliding) return "#ef4444"; // Red for collision (highest priority)
        if (hovered) return "#fbbf24"; // Yellow when hovered
        if (category.toLowerCase().includes('cnc')) return "#fb923c"; // Orange
        if (category.toLowerCase().includes('saw')) return "#f87171"; // Red
        if (category.toLowerCase().includes('dust')) return "#94a3b8"; // Slate
        if (category.toLowerCase().includes('lathe')) return "#a78bfa"; // Purple
        if (category.toLowerCase().includes('mill')) return "#34d399"; // Green
        return "#38bdf8"; // Sky Blue
    }, [category, hovered, isColliding]);

    // Position from equipment data (if available)
    // Use external position if provided, otherwise default
    const position: [number, number, number] = useMemo(() => {
        if (externalPosition) {
            return [externalPosition[0], externalPosition[1] + height / 2, externalPosition[2]];
        }
        return [0, height / 2, 0];
    }, [externalPosition, height]);

    // Rotation from orientation
    const rotation: [number, number, number] = useMemo(() => {
        return [0, (orientation * Math.PI) / 180, 0];
    }, [orientation]);

    // Report bounding box to parent for collision detection
    useEffect(() => {
        if (meshRef.current && onBoundsUpdate) {
            const box = new THREE.Box3().setFromObject(meshRef.current);
            onBoundsUpdate(item.id.toString(), box);
        }
    }, [position, widthFt, depthFt, height, orientation, item.id, onBoundsUpdate]);

    return (
        <group position={position} rotation={rotation}>
            {/* Main equipment body */}
            <mesh
                ref={meshRef}
                castShadow
                receiveShadow
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={[widthFt, height, depthFt]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.6}
                    metalness={0.3}
                    emissive={hovered ? "#fbbf24" : "#000000"}
                    emissiveIntensity={hovered ? 0.2 : 0}
                />
            </mesh>

            {/* Equipment label */}
            <Text
                position={[0, height + 1, 0]}
                fontSize={0.8}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.1}
                outlineColor="#000000"
            >
                {name}
            </Text>

            {/* Category label */}
            <Text
                position={[0, height + 0.3, 0]}
                fontSize={0.4}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
            >
                {category}
            </Text>

            {/* System requirement indicators */}
            {item.requiresDust && (
                <mesh position={[widthFt / 2 + 0.3, height / 2, 0]}>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.5} />
                </mesh>
            )}

            {item.requiresAir && (
                <mesh position={[-widthFt / 2 - 0.3, height / 2, 0]}>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.5} />
                </mesh>
            )}

            {item.requiresHighVoltage && (
                <mesh position={[0, height + 0.5, depthFt / 2 + 0.3]}>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
                </mesh>
            )}

            {/* Base/footprint outline */}
            <lineSegments position={[0, 0.05, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(widthFt, 0.1, depthFt)]} />
                <lineBasicMaterial color={hovered ? "#fbbf24" : "#64748b"} linewidth={2} />
            </lineSegments>

            {/* Collision warning outline */}
            {isColliding && (
                <lineSegments position={[0, height / 2, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(widthFt, height, depthFt)]} />
                    <lineBasicMaterial color="#ef4444" linewidth={4} />
                </lineSegments>
            )}
        </group>
    );
});
