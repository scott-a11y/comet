"use client";

import { useMemo, useRef, useState, memo } from "react";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Component } from "@/lib/types/building-geometry";

interface ComponentModelProps {
    item: Component;
    scaleFtPerUnit: number;
}

function GltfModel({ url, width, height, depth }: { url: string; width: number; height: number; depth: number }) {
    try {
        const { scene } = useGLTF(url);

        // Clone the scene so we can have multiple instances
        const clonedScene = useMemo(() => scene.clone(), [scene]);

        // Calculate scale to fit the specified dimensions
        const boundingBox = useMemo(() => {
            const box = new THREE.Box3().setFromObject(clonedScene);
            return box;
        }, [clonedScene]);

        const size = new THREE.Vector3();
        boundingBox.getSize(size);

        const scaleX = width / (size.x || 1);
        const scaleY = height / (size.y || 1);
        const scaleZ = depth / (size.z || 1);

        return <primitive object={clonedScene} scale={[scaleX, scaleY, scaleZ]} />;
    } catch (error) {
        console.error("Failed to load 3D model:", error);
        return (
            <mesh>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color="#ef4444" wireframe />
            </mesh>
        );
    }
}

export const ComponentModel = memo(function ComponentModel({ item, scaleFtPerUnit }: ComponentModelProps) {
    const { x, y, width, depth, height = 5, rotation, color, name, category, metadata } = item;
    const [hovered, setHovered] = useState(false);

    // Convert grid coordinates to 3D world coordinates
    // In our 3D scene, Y is up, and X/Z are the floor plane.
    // The wall designer uses X/Y for the floor plane.
    const position: [number, number, number] = [
        x * scaleFtPerUnit,
        height / 2,
        y * scaleFtPerUnit
    ];

    const modelUrl = metadata?.notes?.startsWith("model:")
        ? metadata.notes.replace("model:", "").trim()
        : null;

    return (
        <group
            position={position}
            rotation={[0, -(rotation * Math.PI) / 180, 0]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {modelUrl ? (
                <GltfModel url={modelUrl} width={width} height={height} depth={depth} />
            ) : (
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[width, height, depth]} />
                    <meshStandardMaterial
                        color={color || "#64748b"}
                        roughness={0.7}
                        metalness={0.2}
                        emissive={hovered ? "#fbbf24" : "#000000"}
                        emissiveIntensity={hovered ? 0.2 : 0}
                    />
                </mesh>
            )}

            {hovered && (
                <Html distanceFactor={15}>
                    <div className="bg-slate-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap border border-slate-600 shadow-xl pointer-events-none">
                        <div className="font-bold">{name}</div>
                        <div className="text-[10px] opacity-70">{category}</div>
                        <div className="text-[10px] opacity-70">{width}' x {depth}' x {height}'</div>
                    </div>
                </Html>
            )}
        </group>
    );
});
