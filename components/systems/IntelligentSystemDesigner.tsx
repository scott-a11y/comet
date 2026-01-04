"use client";

import { useState, useMemo } from 'react';
import {
    calculateOptimalDiameter,
    calculateVelocity,
    calculateFrictionLossPre100Ft,
    VELOCITY_STANDARDS
} from '@/lib/systems/ducting';
import { calculateOptimalAirPipeSize } from '@/lib/systems/compressed-air';
import { calculateOptimalWireSize } from '@/lib/systems/electrical';
import type { BuildingFloorGeometry } from '@/lib/types/building-geometry';

type SystemType = 'DUST' | 'AIR' | 'ELECTRICAL';

interface EquipmentWithRequirements {
    id: string;
    name: string;
    x: number;
    y: number;
    requiresDust?: boolean;
    requiresAir?: boolean;
    requiresHighVoltage?: boolean;
    dustCFM?: number;
    airCFM?: number;
    electricalLoad?: { voltage: number; phase: 1 | 3; amps: number };
}

interface UtilityPoint {
    id: string;
    type: 'DUST_COLLECTOR' | 'AIR_COMPRESSOR' | 'ELECTRICAL_PANEL';
    x: number;
    y: number;
}

interface AutoRoutedSystem {
    id: string;
    type: SystemType;
    fromEquipmentId?: string;
    toUtilityId: string;
    points: Array<{ x: number; y: number }>;
    diameter?: number;
    wireSize?: string;
    calculations: {
        cfm?: number;
        velocity?: number;
        frictionLoss?: number;
        voltageDrop?: number;
        warnings: string[];
    };
}

interface Props {
    equipment: EquipmentWithRequirements[];
    utilityPoints: UtilityPoint[];
    floorGeometry?: BuildingFloorGeometry | null;
    onSystemsGenerated: (systems: AutoRoutedSystem[]) => void;
}

export function IntelligentSystemDesigner({
    equipment,
    utilityPoints,
    floorGeometry,
    onSystemsGenerated
}: Props) {
    const [selectedSystem, setSelectedSystem] = useState<SystemType>('DUST');
    const [routingStrategy, setRoutingStrategy] = useState<'direct' | 'manhattan' | 'smart'>('smart');
    const [generatedSystems, setGeneratedSystems] = useState<AutoRoutedSystem[]>([]);

    // Find utility points by type
    const dustCollector = utilityPoints.find(u => u.type === 'DUST_COLLECTOR');
    const airCompressor = utilityPoints.find(u => u.type === 'AIR_COMPRESSOR');
    const electricalPanel = utilityPoints.find(u => u.type === 'ELECTRICAL_PANEL');

    // Calculate distance between two points
    const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    // Simple pathfinding (Manhattan routing with obstacle avoidance)
    const generatePath = (
        from: { x: number; y: number },
        to: { x: number; y: number },
        strategy: 'direct' | 'manhattan' | 'smart'
    ): Array<{ x: number; y: number }> => {
        if (strategy === 'direct') {
            return [from, to];
        }

        if (strategy === 'manhattan') {
            // Route along X then Y (or Y then X based on which is longer)
            const dx = Math.abs(to.x - from.x);
            const dy = Math.abs(to.y - from.y);

            if (dx > dy) {
                // X first
                return [
                    from,
                    { x: to.x, y: from.y },
                    to
                ];
            } else {
                // Y first
                return [
                    from,
                    { x: from.x, y: to.y },
                    to
                ];
            }
        }

        // Smart routing: Try to follow walls/existing paths
        // For now, use manhattan with some intelligence
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        return [
            from,
            { x: midX, y: from.y },
            { x: midX, y: to.y },
            to
        ];
    };

    // Auto-generate dust collection system
    const generateDustSystem = (): AutoRoutedSystem[] => {
        if (!dustCollector) {
            return [];
        }

        const systems: AutoRoutedSystem[] = [];
        const equipmentNeedingDust = equipment.filter(e => e.requiresDust);

        equipmentNeedingDust.forEach(eq => {
            const cfm = eq.dustCFM || 400; // Default CFM
            const path = generatePath(eq, dustCollector, routingStrategy);
            const pathLength = path.reduce((sum, point, i) => {
                if (i === 0) return 0;
                return sum + distance(path[i - 1], point);
            }, 0);

            // Calculate duct size
            const diameter = calculateOptimalDiameter(cfm, VELOCITY_STANDARDS.BRANCH_LINE);
            const roundedDiameter = Math.ceil(diameter);
            const velocity = calculateVelocity(cfm, roundedDiameter);
            const frictionPer100 = calculateFrictionLossPre100Ft(cfm, roundedDiameter);
            const totalFriction = (frictionPer100 / 100) * pathLength;

            const warnings: string[] = [];
            if (velocity < 3500) warnings.push('⚠️ Velocity too low - dust may settle');
            if (velocity > 5000) warnings.push('⚠️ Velocity too high - excessive noise/wear');
            if (frictionPer100 > 2) warnings.push('⚠️ High friction loss - consider larger duct');
            if (pathLength > 100) warnings.push('Long run - verify collector capacity');

            systems.push({
                id: `dust-${eq.id}`,
                type: 'DUST',
                fromEquipmentId: eq.id,
                toUtilityId: dustCollector.id,
                points: path,
                diameter: roundedDiameter,
                calculations: {
                    cfm,
                    velocity: Math.round(velocity),
                    frictionLoss: parseFloat(totalFriction.toFixed(2)),
                    warnings
                }
            });
        });

        return systems;
    };

    // Auto-generate compressed air system
    const generateAirSystem = (): AutoRoutedSystem[] => {
        if (!airCompressor) {
            return [];
        }

        const systems: AutoRoutedSystem[] = [];
        const equipmentNeedingAir = equipment.filter(e => e.requiresAir);

        equipmentNeedingAir.forEach(eq => {
            const cfm = eq.airCFM || 10; // Default SCFM
            const path = generatePath(eq, airCompressor, routingStrategy);
            const pathLength = path.reduce((sum, point, i) => {
                if (i === 0) return 0;
                return sum + distance(path[i - 1], point);
            }, 0);

            // Calculate pipe size
            const result = calculateOptimalAirPipeSize({
                flowSCFM: cfm,
                pressurePSI: 90,
                lengthFt: pathLength,
                maxPressureDropPSI: 1
            });

            systems.push({
                id: `air-${eq.id}`,
                type: 'AIR',
                fromEquipmentId: eq.id,
                toUtilityId: airCompressor.id,
                points: path,
                diameter: parseFloat(result.pipeSize.replace('"', '')),
                calculations: {
                    cfm,
                    warnings: result.warnings
                }
            });
        });

        return systems;
    };

    // Auto-generate electrical system
    const generateElectricalSystem = (): AutoRoutedSystem[] => {
        if (!electricalPanel) {
            return [];
        }

        const systems: AutoRoutedSystem[] = [];
        const equipmentNeedingPower = equipment.filter(e => e.requiresHighVoltage);

        equipmentNeedingPower.forEach(eq => {
            if (!eq.electricalLoad) return;

            const path = generatePath(eq, electricalPanel, routingStrategy);
            const pathLength = path.reduce((sum, point, i) => {
                if (i === 0) return 0;
                return sum + distance(path[i - 1], point);
            }, 0);

            // Calculate wire size
            const result = calculateOptimalWireSize({
                load: eq.electricalLoad,
                lengthFt: pathLength,
                maxVoltageDrop: 3
            });

            systems.push({
                id: `elec-${eq.id}`,
                type: 'ELECTRICAL',
                fromEquipmentId: eq.id,
                toUtilityId: electricalPanel.id,
                points: path,
                wireSize: result.wireSize,
                calculations: {
                    voltageDrop: result.percentDrop,
                    warnings: result.warnings
                }
            });
        });

        return systems;
    };

    // Generate all systems
    const handleGenerateSystems = () => {
        let systems: AutoRoutedSystem[] = [];

        if (selectedSystem === 'DUST') {
            systems = generateDustSystem();
        } else if (selectedSystem === 'AIR') {
            systems = generateAirSystem();
        } else if (selectedSystem === 'ELECTRICAL') {
            systems = generateElectricalSystem();
        }

        setGeneratedSystems(systems);
        onSystemsGenerated(systems);
    };

    // Generate all systems at once
    const handleGenerateAll = () => {
        const allSystems = [
            ...generateDustSystem(),
            ...generateAirSystem(),
            ...generateElectricalSystem()
        ];
        setGeneratedSystems(allSystems);
        onSystemsGenerated(allSystems);
    };

    // Summary statistics
    const summary = useMemo(() => {
        const dust = generatedSystems.filter(s => s.type === 'DUST');
        const air = generatedSystems.filter(s => s.type === 'AIR');
        const electrical = generatedSystems.filter(s => s.type === 'ELECTRICAL');

        const totalDustCFM = dust.reduce((sum, s) => sum + (s.calculations.cfm || 0), 0);
        const totalAirCFM = air.reduce((sum, s) => sum + (s.calculations.cfm || 0), 0);
        const totalWarnings = generatedSystems.reduce((sum, s) => sum + s.calculations.warnings.length, 0);

        return {
            dust: { count: dust.length, totalCFM: totalDustCFM },
            air: { count: air.length, totalCFM: totalAirCFM },
            electrical: { count: electrical.length },
            totalWarnings
        };
    }, [generatedSystems]);

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    🤖 Intelligent System Designer
                </h2>
                <p className="text-slate-400 text-sm">
                    Automatically generate optimized routing for all mechanical and electrical systems
                </p>
            </div>

            {/* Configuration */}
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white">Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            System Type
                        </label>
                        <select
                            value={selectedSystem}
                            onChange={(e) => setSelectedSystem(e.target.value as SystemType)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                        >
                            <option value="DUST">Dust Collection</option>
                            <option value="AIR">Compressed Air</option>
                            <option value="ELECTRICAL">Electrical</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Routing Strategy
                        </label>
                        <select
                            value={routingStrategy}
                            onChange={(e) => setRoutingStrategy(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                        >
                            <option value="direct">Direct (Straight Line)</option>
                            <option value="manhattan">Manhattan (90° Bends)</option>
                            <option value="smart">Smart (Optimized Path)</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGenerateSystems}
                        disabled={
                            (selectedSystem === 'DUST' && !dustCollector) ||
                            (selectedSystem === 'AIR' && !airCompressor) ||
                            (selectedSystem === 'ELECTRICAL' && !electricalPanel)
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded font-medium"
                    >
                        Generate {selectedSystem} System
                    </button>

                    <button
                        onClick={handleGenerateAll}
                        disabled={!dustCollector && !airCompressor && !electricalPanel}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded font-medium"
                    >
                        Generate All Systems
                    </button>
                </div>

                {/* Utility Point Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className={`p-3 rounded border ${dustCollector ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
                        <div className="text-xs font-medium mb-1">
                            {dustCollector ? '✅' : '❌'} Dust Collector
                        </div>
                        <div className="text-xs text-slate-400">
                            {dustCollector ? 'Ready' : 'Not placed'}
                        </div>
                    </div>

                    <div className={`p-3 rounded border ${airCompressor ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
                        <div className="text-xs font-medium mb-1">
                            {airCompressor ? '✅' : '❌'} Air Compressor
                        </div>
                        <div className="text-xs text-slate-400">
                            {airCompressor ? 'Ready' : 'Not placed'}
                        </div>
                    </div>

                    <div className={`p-3 rounded border ${electricalPanel ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
                        <div className="text-xs font-medium mb-1">
                            {electricalPanel ? '✅' : '❌'} Electrical Panel
                        </div>
                        <div className="text-xs text-slate-400">
                            {electricalPanel ? 'Ready' : 'Not placed'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Generated Systems Summary */}
            {generatedSystems.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Generated Systems</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <div className="text-sm text-slate-300 mb-1">Dust Collection</div>
                            <div className="text-2xl font-bold text-white">{summary.dust.count}</div>
                            <div className="text-xs text-slate-400 mt-1">
                                {summary.dust.totalCFM} CFM total
                            </div>
                        </div>

                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <div className="text-sm text-slate-300 mb-1">Compressed Air</div>
                            <div className="text-2xl font-bold text-white">{summary.air.count}</div>
                            <div className="text-xs text-slate-400 mt-1">
                                {summary.air.totalCFM} SCFM total
                            </div>
                        </div>

                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <div className="text-sm text-slate-300 mb-1">Electrical</div>
                            <div className="text-2xl font-bold text-white">{summary.electrical.count}</div>
                            <div className="text-xs text-slate-400 mt-1">
                                circuits
                            </div>
                        </div>

                        <div className={`rounded-lg p-4 ${summary.totalWarnings > 0 ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-green-900/30 border border-green-700'}`}>
                            <div className="text-sm text-slate-300 mb-1">Warnings</div>
                            <div className="text-2xl font-bold text-white">{summary.totalWarnings}</div>
                            <div className="text-xs text-slate-400 mt-1">
                                {summary.totalWarnings === 0 ? 'All good!' : 'Review needed'}
                            </div>
                        </div>
                    </div>

                    {/* System Details */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {generatedSystems.map(system => (
                            <div key={system.id} className="bg-slate-700/30 rounded p-3 border border-slate-600">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${system.type === 'DUST' ? 'bg-gray-700 text-gray-200' :
                                                    system.type === 'AIR' ? 'bg-blue-700 text-blue-200' :
                                                        'bg-yellow-700 text-yellow-200'
                                                }`}>
                                                {system.type}
                                            </span>
                                            <span className="text-sm text-white">
                                                {equipment.find(e => e.id === system.fromEquipmentId)?.name || 'Unknown'}
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-400 space-y-1">
                                            {system.type === 'DUST' && (
                                                <>
                                                    <div>Duct: {system.diameter}" @ {system.calculations.velocity} FPM</div>
                                                    <div>Friction: {system.calculations.frictionLoss}" wg</div>
                                                </>
                                            )}
                                            {system.type === 'AIR' && (
                                                <div>Pipe: {system.diameter}" for {system.calculations.cfm} SCFM</div>
                                            )}
                                            {system.type === 'ELECTRICAL' && (
                                                <div>Wire: {system.wireSize}, VD: {system.calculations.voltageDrop?.toFixed(2)}%</div>
                                            )}
                                        </div>

                                        {system.calculations.warnings.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {system.calculations.warnings.map((warning, i) => (
                                                    <div key={i} className="text-xs text-yellow-400">
                                                        {warning}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {generatedSystems.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-4">🤖</div>
                    <p>Configure utility points and equipment, then generate systems automatically</p>
                </div>
            )}
        </div>
    );
}
