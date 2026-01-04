"use client";

import { useState } from 'react';
import {
    calculateOptimalDiameter,
    calculateVelocity,
    calculateFrictionLossPre100Ft,
    VELOCITY_STANDARDS
} from '@/lib/systems/ducting';

interface Machine {
    id: string;
    name: string;
    cfm: number;
    distance: number;
}

const COMMON_MACHINES = [
    { name: 'Table Saw', cfm: 350 },
    { name: 'Jointer (6-8")', cfm: 400 },
    { name: 'Planer (12-13")', cfm: 450 },
    { name: 'Band Saw (14")', cfm: 350 },
    { name: 'Router Table', cfm: 250 },
    { name: 'Miter Saw', cfm: 300 },
    { name: 'Drum Sander', cfm: 400 },
    { name: 'Lathe', cfm: 300 },
    { name: 'Disc Sander', cfm: 350 },
    { name: 'CNC Router', cfm: 500 },
];

export function DustCollectionCalculator() {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [selectedMachine, setSelectedMachine] = useState('');
    const [customCFM, setCustomCFM] = useState('');
    const [customDistance, setCustomDistance] = useState('');
    const [simultaneousMachines, setSimultaneousMachines] = useState(2);

    const addMachine = () => {
        if (!selectedMachine) return;

        const preset = COMMON_MACHINES.find(m => m.name === selectedMachine);
        const cfm = preset ? preset.cfm : parseInt(customCFM) || 0;
        const distance = parseInt(customDistance) || 20;

        if (cfm <= 0) return;

        const newMachine: Machine = {
            id: `machine-${Date.now()}`,
            name: selectedMachine || 'Custom Machine',
            cfm,
            distance
        };

        setMachines([...machines, newMachine]);
        setSelectedMachine('');
        setCustomCFM('');
        setCustomDistance('');
    };

    const removeMachine = (id: string) => {
        setMachines(machines.filter(m => m.id !== id));
    };

    // Calculate individual branch requirements
    const branchCalculations = machines.map(machine => {
        const diameter = calculateOptimalDiameter(machine.cfm, VELOCITY_STANDARDS.BRANCH_LINE);
        const roundedDiameter = Math.ceil(diameter);
        const velocity = calculateVelocity(machine.cfm, roundedDiameter);
        const frictionPer100 = calculateFrictionLossPre100Ft(machine.cfm, roundedDiameter);
        const totalFriction = (frictionPer100 / 100) * machine.distance;

        return {
            ...machine,
            diameter: roundedDiameter,
            velocity: Math.round(velocity),
            frictionPer100: frictionPer100.toFixed(2),
            totalFriction: totalFriction.toFixed(2),
            velocityOK: velocity >= 3500 && velocity <= 5000,
            frictionOK: frictionPer100 < 2
        };
    });

    // Calculate main trunk requirements
    const sortedByC FM = [...machines].sort((a, b) => b.cfm - a.cfm);
    const topMachines = sortedByC FM.slice(0, simultaneousMachines);
    const totalSimultaneousCFM = topMachines.reduce((sum, m) => sum + m.cfm, 0);

    const mainDiameter = totalSimultaneousCFM > 0
        ? calculateOptimalDiameter(totalSimultaneousCFM, VELOCITY_STANDARDS.MAIN_LINE)
        : 0;
    const mainDiameterRounded = Math.ceil(mainDiameter);
    const mainVelocity = totalSimultaneousCFM > 0
        ? calculateVelocity(totalSimultaneousCFM, mainDiameterRounded)
        : 0;

    // Calculate collector requirements
    const collectorCFM = Math.ceil(totalSimultaneousCFM * 1.5);

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    🌪️ Dust Collection System Calculator
                </h2>
                <p className="text-slate-400 text-sm">
                    Design your dust collection system with proper duct sizing and CFM calculations
                </p>
            </div>

            {/* Add Machine Section */}
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white">Add Equipment</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Machine Type
                        </label>
                        <select
                            value={selectedMachine}
                            onChange={(e) => setSelectedMachine(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                        >
                            <option value="">Select machine...</option>
                            {COMMON_MACHINES.map(m => (
                                <option key={m.name} value={m.name}>
                                    {m.name} ({m.cfm} CFM)
                                </option>
                            ))}
                            <option value="custom">Custom Machine</option>
                        </select>
                    </div>

                    {selectedMachine === 'custom' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                CFM Required
                            </label>
                            <input
                                type="number"
                                value={customCFM}
                                onChange={(e) => setCustomCFM(e.target.value)}
                                placeholder="e.g., 400"
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Distance from Collector (ft)
                        </label>
                        <input
                            type="number"
                            value={customDistance}
                            onChange={(e) => setCustomDistance(e.target.value)}
                            placeholder="e.g., 20"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={addMachine}
                            disabled={!selectedMachine || (selectedMachine === 'custom' && !customCFM)}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded font-medium"
                        >
                            Add Machine
                        </button>
                    </div>
                </div>
            </div>

            {/* Machine List */}
            {machines.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Equipment List</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-2 px-3 text-slate-300">Machine</th>
                                    <th className="text-right py-2 px-3 text-slate-300">CFM</th>
                                    <th className="text-right py-2 px-3 text-slate-300">Distance</th>
                                    <th className="text-right py-2 px-3 text-slate-300">Duct Size</th>
                                    <th className="text-right py-2 px-3 text-slate-300">Velocity</th>
                                    <th className="text-right py-2 px-3 text-slate-300">Friction</th>
                                    <th className="text-right py-2 px-3 text-slate-300"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchCalculations.map(calc => (
                                    <tr key={calc.id} className="border-b border-slate-700/50">
                                        <td className="py-2 px-3 text-white">{calc.name}</td>
                                        <td className="text-right py-2 px-3 text-slate-300">{calc.cfm}</td>
                                        <td className="text-right py-2 px-3 text-slate-300">{calc.distance} ft</td>
                                        <td className="text-right py-2 px-3 text-white font-semibold">{calc.diameter}"</td>
                                        <td className={`text-right py-2 px-3 ${calc.velocityOK ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {calc.velocity} FPM
                                        </td>
                                        <td className={`text-right py-2 px-3 ${calc.frictionOK ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {calc.totalFriction}" wg
                                        </td>
                                        <td className="text-right py-2 px-3">
                                            <button
                                                onClick={() => removeMachine(calc.id)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* System Summary */}
            {machines.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-white">System Summary</h3>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Max Simultaneous Machines
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={machines.length}
                                value={simultaneousMachines}
                                onChange={(e) => setSimultaneousMachines(parseInt(e.target.value) || 1)}
                                className="w-32 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                How many machines will run at the same time?
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                                <div className="text-sm text-blue-300 mb-1">Main Trunk Size</div>
                                <div className="text-3xl font-bold text-white">{mainDiameterRounded}"</div>
                                <div className="text-xs text-blue-300 mt-1">
                                    {totalSimultaneousCFM} CFM @ {Math.round(mainVelocity)} FPM
                                </div>
                            </div>

                            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                                <div className="text-sm text-green-300 mb-1">Collector Required</div>
                                <div className="text-3xl font-bold text-white">{collectorCFM}</div>
                                <div className="text-xs text-green-300 mt-1">
                                    CFM minimum (1.5x safety factor)
                                </div>
                            </div>

                            <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                                <div className="text-sm text-purple-300 mb-1">Total Machines</div>
                                <div className="text-3xl font-bold text-white">{machines.length}</div>
                                <div className="text-xs text-purple-300 mt-1">
                                    {machines.reduce((sum, m) => sum + m.cfm, 0)} CFM total
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mt-4">
                            <h4 className="text-sm font-semibold text-amber-300 mb-2">💡 Recommendations</h4>
                            <ul className="text-sm text-amber-200 space-y-1">
                                <li>• Use {mainDiameterRounded}" duct for main trunk line</li>
                                <li>• Install blast gates at each machine</li>
                                <li>• Keep duct runs as short as possible</li>
                                <li>• Use 45° elbows instead of 90° when possible</li>
                                <li>• Ground all metal ducts to prevent static buildup</li>
                                {mainVelocity < 3500 && (
                                    <li className="text-yellow-300">⚠️ Main trunk velocity is low - consider smaller duct or more simultaneous machines</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {machines.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-4">🔧</div>
                    <p>Add your first machine to start designing your dust collection system</p>
                </div>
            )}
        </div>
    );
}
