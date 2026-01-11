'use client';

import React from 'react';
import { Text, Arrow, Group } from 'react-konva';
import type { BuildingVertex, BuildingWallSegment } from '@/lib/types/building-geometry';

interface RoomLabel {
    id: string;
    x: number;
    y: number;
    text: string;
    fontSize?: number;
    color?: string;
}

interface DimensionAnnotation {
    id: string;
    v1: BuildingVertex;
    v2: BuildingVertex;
    lengthFt: number;
    offset?: number; // Offset from wall
}

interface Props {
    vertices: BuildingVertex[];
    segments: BuildingWallSegment[];
    scaleFtPerUnit: number;
    roomLabels?: RoomLabel[];
    showDimensions?: boolean;
    onLabelClick?: (labelId: string) => void;
}

export function AnnotationsLayer({
    vertices,
    segments,
    scaleFtPerUnit,
    roomLabels = [],
    showDimensions = true,
    onLabelClick,
}: Props) {
    // Calculate dimension annotations
    const dimensions: DimensionAnnotation[] = segments.map((seg) => {
        const v1 = vertices.find((v) => v.id === seg.a);
        const v2 = vertices.find((v) => v.id === seg.b);

        if (!v1 || !v2) return null;

        const dx = (v2.x - v1.x) * scaleFtPerUnit;
        const dy = (v2.y - v1.y) * scaleFtPerUnit;
        const lengthFt = Math.sqrt(dx * dx + dy * dy);

        return {
            id: seg.id,
            v1,
            v2,
            lengthFt,
            offset: 20,
        };
    }).filter(Boolean) as DimensionAnnotation[];

    return (
        <Group>
            {/* Dimension Annotations */}
            {showDimensions && dimensions.map((dim) => {
                const { v1, v2, lengthFt, offset = 20 } = dim;

                // Calculate perpendicular offset
                const dx = v2.x - v1.x;
                const dy = v2.y - v1.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const perpX = (-dy / length) * offset;
                const perpY = (dx / length) * offset;

                // Offset points
                const x1 = v1.x + perpX;
                const y1 = v1.y + perpY;
                const x2 = v2.x + perpX;
                const y2 = v2.y + perpY;

                // Midpoint for text
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                // Angle for text rotation
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                const textAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

                return (
                    <Group key={dim.id}>
                        {/* Dimension line */}
                        <Arrow
                            points={[x1, y1, x2, y2]}
                            stroke="#3b82f6"
                            strokeWidth={1}
                            fill="#3b82f6"
                            pointerLength={6}
                            pointerWidth={6}
                            pointerAtBeginning
                        />

                        {/* Extension lines */}
                        <Arrow
                            points={[v1.x, v1.y, x1, y1]}
                            stroke="#94a3b8"
                            strokeWidth={0.5}
                            dash={[3, 3]}
                            pointerLength={0}
                        />
                        <Arrow
                            points={[v2.x, v2.y, x2, y2]}
                            stroke="#94a3b8"
                            strokeWidth={0.5}
                            dash={[3, 3]}
                            pointerLength={0}
                        />

                        {/* Dimension text */}
                        <Text
                            x={midX}
                            y={midY - 8}
                            text={`${lengthFt.toFixed(1)}'`}
                            fontSize={11}
                            fill="#1e40af"
                            fontStyle="bold"
                            align="center"
                            offsetX={20}
                            rotation={textAngle}
                        />
                    </Group>
                );
            })}

            {/* Room Labels */}
            {roomLabels.map((label) => (
                <Group key={label.id}>
                    {/* Background */}
                    <Text
                        x={label.x}
                        y={label.y}
                        text={label.text}
                        fontSize={label.fontSize || 16}
                        fill={label.color || '#ffffff'}
                        fontStyle="bold"
                        align="center"
                        verticalAlign="middle"
                        padding={8}
                        onClick={() => onLabelClick?.(label.id)}
                        onTap={() => onLabelClick?.(label.id)}
                        shadowColor="black"
                        shadowBlur={4}
                        shadowOpacity={0.5}
                    />
                </Group>
            ))}
        </Group>
    );
}

/**
 * Auto-generate room labels from floor plan geometry
 */
export function generateRoomLabels(
    vertices: BuildingVertex[],
    segments: BuildingWallSegment[]
): RoomLabel[] {
    // Simple implementation: place label at centroid of all vertices
    if (vertices.length === 0) return [];

    const sumX = vertices.reduce((sum, v) => sum + v.x, 0);
    const sumY = vertices.reduce((sum, v) => sum + v.y, 0);
    const centerX = sumX / vertices.length;
    const centerY = sumY / vertices.length;

    return [
        {
            id: 'main-room',
            x: centerX,
            y: centerY,
            text: 'Main Area',
            fontSize: 18,
            color: '#60a5fa',
        },
    ];
}

/**
 * Calculate area of a polygon (Shoelace formula)
 */
export function calculatePolygonArea(vertices: BuildingVertex[]): number {
    if (vertices.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
    }

    return Math.abs(area / 2);
}
