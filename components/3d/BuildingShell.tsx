"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface BuildingShellProps {
    width: number;
    depth: number;
    height: number;
}

export function BuildingShell({ width, depth, height }: BuildingShellProps) {

    const floorGeometry = useMemo(() => {
        return new THREE.PlaneGeometry(width, depth);
    }, [width, depth]);

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <primitive object={floorGeometry} />
                <meshStandardMaterial color="#334155" />
            </mesh>

            {/* Basic Walls visual cue (corners) */}
            <mesh position={[width / 2, height / 2, depth / 2]}>
                <boxGeometry args={[1, height, 1]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[-width / 2, height / 2, depth / 2]}>
                <boxGeometry args={[1, height, 1]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[width / 2, height / 2, -depth / 2]}>
                <boxGeometry args={[1, height, 1]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[-width / 2, height / 2, -depth / 2]}>
                <boxGeometry args={[1, height, 1]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
        </group>
    );
}
