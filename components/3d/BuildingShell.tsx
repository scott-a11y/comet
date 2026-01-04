"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { BuildingFloorGeometry } from "@/lib/types/building-geometry";

interface BuildingShellProps {
    width: number;
    depth: number;
    height: number;
    floorGeometry?: BuildingFloorGeometry | null;
}

export function BuildingShell({ width, depth, height, floorGeometry }: BuildingShellProps) {

    const floorMesh = useMemo(() => {
        return new THREE.PlaneGeometry(width, depth);
    }, [width, depth]);

    // Wall thickness in feet
    const wallThickness = 0.5;

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
                <primitive object={floorMesh} />
                <meshStandardMaterial
                    color="#2d3748"
                    roughness={0.8}
                    metalness={0.2}
                />
            </mesh>

            {/* Walls - Full panels instead of just corners */}
            {/* North Wall */}
            <mesh position={[0, height / 2, -depth / 2]} castShadow receiveShadow>
                <boxGeometry args={[width, height, wallThickness]} />
                <meshStandardMaterial
                    color="#4a5568"
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* South Wall */}
            <mesh position={[0, height / 2, depth / 2]} castShadow receiveShadow>
                <boxGeometry args={[width, height, wallThickness]} />
                <meshStandardMaterial
                    color="#4a5568"
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* East Wall */}
            <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[wallThickness, height, depth]} />
                <meshStandardMaterial
                    color="#4a5568"
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* West Wall */}
            <mesh position={[-width / 2, height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[wallThickness, height, depth]} />
                <meshStandardMaterial
                    color="#4a5568"
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* Ceiling (semi-transparent to see inside) */}
            <mesh position={[0, height, 0]} receiveShadow>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial
                    color="#1a202c"
                    transparent
                    opacity={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Grid on floor for reference */}
            <gridHelper
                args={[Math.max(width, depth), 20, '#64748b', '#475569']}
                position={[0, 0.01, 0]}
            />
        </group>
    );
}
