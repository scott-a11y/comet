"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Sky } from "@react-three/drei";
import { BuildingShell } from "./BuildingShell";

import type { ShopBuilding, Equipment } from "@prisma/client";

import { EquipmentModel } from "./EquipmentModel";

interface SceneProps {
    building: ShopBuilding & { equipment: Equipment[] };
}

export function Scene({ building }: SceneProps) {
    const width = building.widthFt ?? 50;
    const depth = building.depthFt ?? 50;
    const height = building.ceilingHeightFt || 20;

    // Calculate optimal camera position based on building size
    const cameraDistance = Math.max(width, depth, height) * 1.5;

    return (
        <Canvas shadows>
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
                maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
                minDistance={10}
                maxDistance={cameraDistance * 2}
                enableDamping
                dampingFactor={0.05}
            />

            {/* Lighting Setup */}
            {/* Ambient light for base illumination */}
            <ambientLight intensity={0.4} />

            {/* Hemisphere light for natural sky/ground lighting */}
            <hemisphereLight
                args={['#87ceeb', '#545454', 0.6]}
                position={[0, 50, 0]}
            />

            {/* Main directional light with shadows */}
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

            {/* Fill light from opposite side */}
            <directionalLight
                position={[-20, 30, -20]}
                intensity={0.3}
            />

            {/* Sky background */}
            <Sky
                distance={450000}
                sunPosition={[30, 50, 30]}
                inclination={0.6}
                azimuth={0.25}
            />

            {/* Building Shell */}
            <BuildingShell
                width={width}
                depth={depth}
                height={height}
                floorGeometry={building.floorGeometry as any}
            />

            {/* Equipment */}
            {building.equipment.map((eq: Equipment) => (
                <EquipmentModel key={eq.id} item={eq} />
            ))}

            {/* Environment preset for reflections */}
            <Environment preset="warehouse" />
        </Canvas>
    );
}
