"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Html } from "@react-three/drei";
import { BuildingShell } from "./BuildingShell";
import { Suspense } from "react";

import type { ShopBuilding, Equipment } from "@prisma/client";

interface SceneProps {
    building: ShopBuilding & { equipment: Equipment[] };
}

function LoadingFallback() {
    return (
        <Html center>
            <div className="bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg">
                Loading 3D View...
            </div>
        </Html>
    );
}

export function Scene({ building }: SceneProps) {
    const width = building.widthFt ?? 50;
    const depth = building.depthFt ?? 50;
    const height = building.ceilingHeightFt || 20;

    // Calculate optimal camera position based on building size
    const cameraDistance = Math.max(width, depth, height) * 1.5;

    return (
        <Canvas shadows>
            <Suspense fallback={<LoadingFallback />}>
                {/* Camera */}
                <PerspectiveCamera
                    makeDefault
                    position={[cameraDistance, cameraDistance * 0.7, cameraDistance]}
                    fov={50}
                />

                {/* Controls */}
                <OrbitControls
                    makeDefault
                    target={[0, height / 2, 0]}
                    maxPolarAngle={Math.PI / 2 - 0.1}
                    minDistance={10}
                    maxDistance={cameraDistance * 2}
                    enableDamping
                    dampingFactor={0.05}
                />

                {/* Lighting Setup */}
                <ambientLight intensity={0.4} />

                <hemisphereLight
                    args={['#87ceeb', '#545454', 0.6]}
                    position={[0, 50, 0]}
                />

                <directionalLight
                    position={[30, 50, 30]}
                    intensity={0.8}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-far={200}
                    shadow-camera-left={-100}
                    shadow-camera-right={100}
                    shadow-camera-top={100}
                    shadow-camera-bottom={-100}
                />

                <directionalLight
                    position={[-20, 30, -20]}
                    intensity={0.3}
                />

                {/* Simple sky color */}
                <color attach="background" args={['#87ceeb']} />

                {/* Building Shell */}
                <BuildingShell
                    width={width}
                    depth={depth}
                    height={height}
                    floorGeometry={building.floorGeometry as any}
                />

                {/* Equipment count display */}
                {building.equipment && building.equipment.length > 0 && (
                    <Html position={[0, height + 5, 0]} center>
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold">
                            {building.equipment.length} Equipment Item{building.equipment.length > 1 ? 's' : ''}
                        </div>
                    </Html>
                )}

                {/* Environment preset for reflections */}
                <Environment preset="warehouse" />
            </Suspense>
        </Canvas>
    );
}
