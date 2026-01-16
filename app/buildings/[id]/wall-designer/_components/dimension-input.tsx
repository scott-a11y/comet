'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Hash, AtSign, Compass } from 'lucide-react';

export type CoordinateInputMode = 'absolute' | 'relative' | 'polar' | 'length';

export interface DimensionInputProps {
    mode: CoordinateInputMode;
    onModeChange: (mode: CoordinateInputMode) => void;
    onSubmit: (value: DimensionInput) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export interface DimensionInput {
    mode: CoordinateInputMode;
    value: string;
    parsed: {
        x?: number;
        y?: number;
        length?: number;
        angle?: number;
    };
}

export function DimensionInputBox({
    mode,
    onModeChange,
    onSubmit,
    placeholder = 'Enter dimension...',
    autoFocus = false
}: DimensionInputProps) {
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const parseInput = (value: string): DimensionInput | null => {
        setError(null);
        const trimmed = value.trim();

        try {
            switch (mode) {
                case 'absolute': {
                    // Format: "x,y" or "x y"
                    const parts = trimmed.split(/[,\s]+/);
                    if (parts.length !== 2) {
                        setError('Format: x,y (e.g., 10,20)');
                        return null;
                    }
                    const x = parseFloat(parts[0]);
                    const y = parseFloat(parts[1]);
                    if (isNaN(x) || isNaN(y)) {
                        setError('Invalid numbers');
                        return null;
                    }
                    return {
                        mode: 'absolute',
                        value: trimmed,
                        parsed: { x, y }
                    };
                }

                case 'relative': {
                    // Format: "@dx,dy" or "@dx dy"
                    const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
                    const parts = withoutAt.split(/[,\s]+/);
                    if (parts.length !== 2) {
                        setError('Format: @dx,dy (e.g., @5,10)');
                        return null;
                    }
                    const x = parseFloat(parts[0]);
                    const y = parseFloat(parts[1]);
                    if (isNaN(x) || isNaN(y)) {
                        setError('Invalid numbers');
                        return null;
                    }
                    return {
                        mode: 'relative',
                        value: trimmed,
                        parsed: { x, y }
                    };
                }

                case 'polar': {
                    // Format: "length<angle" (e.g., "10<45")
                    const match = trimmed.match(/^([\d.]+)\s*<\s*([\d.]+)$/);
                    if (!match) {
                        setError('Format: length<angle (e.g., 10<45)');
                        return null;
                    }
                    const length = parseFloat(match[1]);
                    const angle = parseFloat(match[2]);
                    if (isNaN(length) || isNaN(angle)) {
                        setError('Invalid numbers');
                        return null;
                    }
                    return {
                        mode: 'polar',
                        value: trimmed,
                        parsed: { length, angle }
                    };
                }

                case 'length': {
                    // Format: just a number
                    const length = parseFloat(trimmed);
                    if (isNaN(length)) {
                        setError('Invalid number');
                        return null;
                    }
                    return {
                        mode: 'length',
                        value: trimmed,
                        parsed: { length }
                    };
                }

                default:
                    return null;
            }
        } catch (e) {
            setError('Invalid input');
            return null;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseInput(input);
        if (parsed) {
            onSubmit(parsed);
            setInput('');
            setError(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setInput('');
            setError(null);
            inputRef.current?.blur();
        }
    };

    const modes = [
        { value: 'length' as CoordinateInputMode, icon: Hash, label: 'Length', example: '10' },
        { value: 'absolute' as CoordinateInputMode, icon: Calculator, label: 'X,Y', example: '10,20' },
        { value: 'relative' as CoordinateInputMode, icon: AtSign, label: '@dx,dy', example: '@5,10' },
        { value: 'polar' as CoordinateInputMode, icon: Compass, label: 'L<A', example: '10<45' },
    ];

    return (
        <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl p-3">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-1">
                    Dimension Input
                </h3>
                <div className="flex gap-1">
                    {modes.map(({ value, icon: Icon, label }) => (
                        <button
                            key={value}
                            onClick={() => onModeChange(value)}
                            title={`${label}: ${modes.find(m => m.value === value)?.example}`}
                            className={`p-1.5 rounded transition-all ${mode === value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                                }`}
                        >
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={modes.find(m => m.value === mode)?.example || placeholder}
                        className={`w-full bg-slate-900 border rounded px-3 py-2 text-white text-sm font-mono ${error ? 'border-red-500' : 'border-slate-700'
                            }`}
                    />
                    {error && (
                        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-400 bg-red-900/20 rounded px-2 py-1">
                            {error}
                        </div>
                    )}
                </div>
            </form>

            <div className="mt-2 text-[10px] text-slate-500 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">Current:</span>
                    <span>{modes.find(m => m.value === mode)?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">Example:</span>
                    <code className="bg-slate-900 px-1 py-0.5 rounded">
                        {modes.find(m => m.value === mode)?.example}
                    </code>
                </div>
                <div className="text-slate-600 mt-2">
                    Press <kbd className="bg-slate-900 px-1 py-0.5 rounded">Enter</kbd> to apply,{' '}
                    <kbd className="bg-slate-900 px-1 py-0.5 rounded">Esc</kbd> to cancel
                </div>
            </div>
        </div>
    );
}

// Helper function to convert dimension input to world coordinates
export function dimensionToCoordinates(
    input: DimensionInput,
    lastPoint: { x: number; y: number } | null,
    currentAngle?: number
): { x: number; y: number } | null {
    const { mode, parsed } = input;

    switch (mode) {
        case 'absolute':
            if (parsed.x !== undefined && parsed.y !== undefined) {
                return { x: parsed.x, y: parsed.y };
            }
            break;

        case 'relative':
            if (lastPoint && parsed.x !== undefined && parsed.y !== undefined) {
                return {
                    x: lastPoint.x + parsed.x,
                    y: lastPoint.y + parsed.y
                };
            }
            break;

        case 'polar':
            if (lastPoint && parsed.length !== undefined && parsed.angle !== undefined) {
                const angleRad = (parsed.angle * Math.PI) / 180;
                return {
                    x: lastPoint.x + parsed.length * Math.cos(angleRad),
                    y: lastPoint.y + parsed.length * Math.sin(angleRad)
                };
            }
            break;

        case 'length':
            if (lastPoint && parsed.length !== undefined) {
                // Use current angle if available, otherwise default to 0 (right)
                const angleRad = currentAngle !== undefined ? currentAngle : 0;
                return {
                    x: lastPoint.x + parsed.length * Math.cos(angleRad),
                    y: lastPoint.y + parsed.length * Math.sin(angleRad)
                };
            }
            break;
    }

    return null;
}

// Quick dimension presets component
export function QuickDimensionPresets({
    onSelect
}: {
    onSelect: (length: number) => void;
}) {
    const presets = [
        { value: 1, label: '1\'' },
        { value: 2, label: '2\'' },
        { value: 3, label: '3\'' },
        { value: 4, label: '4\'' },
        { value: 5, label: '5\'' },
        { value: 6, label: '6\'' },
        { value: 8, label: '8\'' },
        { value: 10, label: '10\'' },
        { value: 12, label: '12\'' },
        { value: 16, label: '16\'' },
        { value: 20, label: '20\'' },
        { value: 24, label: '24\'' },
    ];

    return (
        <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl p-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Lengths
            </h3>
            <div className="grid grid-cols-6 gap-1">
                {presets.map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => onSelect(value)}
                        className="px-2 py-1 bg-slate-700 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
