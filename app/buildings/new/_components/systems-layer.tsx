import React from 'react';
import { Group, Line } from 'react-konva';
import type { BuildingFloorGeometry } from '@/lib/types/building-geometry';

// Helper type alias
type SystemRun = NonNullable<BuildingFloorGeometry['systemRuns']>[0];

type Props = {
    runs: SystemRun[];
};

export const SystemsLayer = React.memo(function SystemsLayer({ runs }: Props) {
    return (
        <Group>
            {runs.map((run) => {
                const flatPoints = run.points.flatMap(p => [p.x, p.y]);

                if (run.type === 'DUST') {
                    return (
                        <Line
                            key={run.id}
                            points={flatPoints}
                            stroke="#64748b" // slate-500
                            strokeWidth={run.diameter || 10} // default thickness
                            lineCap="round"
                            lineJoin="round"
                            opacity={0.9}
                            tension={0.1} // slight curve for realistic flexible hose / smooth bends
                        />
                    );
                }

                if (run.type === 'AIR') {
                    return (
                        <Line
                            key={run.id}
                            points={flatPoints}
                            stroke="#3b82f6" // blue-500
                            strokeWidth={2}
                            lineCap="round"
                            lineJoin="round"
                            opacity={0.8}
                        />
                    );
                }

                if (run.type === 'ELECTRICAL') {
                    // Electrical usually straight or 90-degree, maybe dashed
                    return (
                        <Line
                            key={run.id}
                            points={flatPoints}
                            stroke="#eab308" // yellow-500
                            strokeWidth={2}
                            dash={[5, 5]}
                            lineCap="square"
                            opacity={0.9}
                        />
                    );
                }

                return null;
            })}
        </Group>
    );
});
