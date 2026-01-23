"use client";

import { useMemo, memo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

interface SystemRoutingProps {
    systemRuns?: Array<{
        id: string;
        type: 'DUST' | 'AIR' | 'ELECTRICAL';
        points: Array<{ x: number; y: number }>;
        diameter?: number;
        meta?: Record<string, any>;
    }>;
    height?: number; // Height at which to render the runs
}

export const SystemRouting = memo(function SystemRouting({ systemRuns = [], height = 8 }: SystemRoutingProps) {

    // Color coding for different system types
    const getSystemColor = (type: string) => {
        switch (type) {
            case 'DUST':
                return '#60a5fa'; // Blue
            case 'AIR':
                return '#34d399'; // Green
            case 'ELECTRICAL':
                return '#fbbf24'; // Yellow
            default:
                return '#94a3b8'; // Gray
        }
    };

    // Convert 2D points to 3D line
    const convertTo3D = (points: Array<{ x: number; y: number }>, runHeight: number): THREE.Vector3[] => {
        return points.map(p => new THREE.Vector3(p.x, runHeight, p.y));
    };

    return (
        <group>
            {systemRuns.map((run) => {
                const points3D = convertTo3D(run.points, height);
                const color = getSystemColor(run.type);
                const lineWidth = run.diameter ? run.diameter * 0.5 : 2;

                return (
                    <group key={run.id}>
                        {/* Main line */}
                        <Line
                            points={points3D}
                            color={color}
                            lineWidth={lineWidth}
                            dashed={false}
                        />

                        {/* Pipe/Duct representation */}
                        {run.points.length > 1 && run.points.map((point, idx) => {
                            if (idx === run.points.length - 1) return null;

                            const nextPoint = run.points[idx + 1];
                            const start = new THREE.Vector3(point.x, height, point.y);
                            const end = new THREE.Vector3(nextPoint.x, height, nextPoint.y);
                            const direction = new THREE.Vector3().subVectors(end, start);
                            const length = direction.length();
                            const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

                            // Calculate rotation to align cylinder with line
                            const axis = new THREE.Vector3(0, 1, 0);
                            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                                axis,
                                direction.clone().normalize()
                            );

                            const pipeRadius = run.diameter ? run.diameter / 24 : 0.15; // Convert inches to feet

                            return (
                                <mesh
                                    key={`${run.id}-segment-${idx}`}
                                    position={midpoint}
                                    quaternion={quaternion}
                                >
                                    <cylinderGeometry args={[pipeRadius, pipeRadius, length, 8]} />
                                    <meshStandardMaterial
                                        color={color}
                                        transparent
                                        opacity={0.6}
                                        roughness={0.4}
                                        metalness={0.6}
                                    />
                                </mesh>
                            );
                        })}

                        {/* Connection points */}
                        {run.points.map((point, idx) => (
                            <mesh
                                key={`${run.id}-point-${idx}`}
                                position={[point.x, height, point.y]}
                            >
                                <sphereGeometry args={[0.3, 16, 16]} />
                                <meshStandardMaterial
                                    color={color}
                                    emissive={color}
                                    emissiveIntensity={0.3}
                                />
                            </mesh>
                        ))}

                        {/* Labels for system type */}
                        {run.points.length > 0 && (
                            <sprite position={[run.points[0].x, height + 1, run.points[0].y]}>
                                <spriteMaterial color={color} />
                            </sprite>
                        )}
                    </group>
                );
            })}
        </group>
    );
});
