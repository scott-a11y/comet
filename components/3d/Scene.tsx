"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { BuildingShell } from "./BuildingShell";

import type { ShopBuilding, Equipment } from "@prisma/client";

import { EquipmentModel } from "./EquipmentModel";

interface SceneProps {
    building: ShopBuilding & { equipment: Equipment[] };
}

export function Scene({ building }: SceneProps) {
    return (
        <Canvas>
            <PerspectiveCamera makeDefault position={[50, 50, 50]} fov={50} />
            <OrbitControls makeDefault />

            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

            <gridHelper args={[200, 200]} />

            <BuildingShell
                width={building.widthFt ?? 50}
                depth={building.depthFt ?? 50}
                height={building.ceilingHeightFt || 20}
            />

            {building.equipment.map((eq: Equipment) => (
                <EquipmentModel key={eq.id} item={eq} />
            ))}
        </Canvas>
    );
}
