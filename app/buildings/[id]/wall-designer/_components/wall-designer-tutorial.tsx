'use client';

import { useState } from 'react';

interface TutorialStep {
    title: string;
    description: string;
    highlight?: string;
    action?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: 'Welcome to Wall Designer!',
        description: 'This interactive tutorial will guide you through creating professional floor plans for your shop buildings.',
        action: 'Click Next to begin',
    },
    {
        title: 'Quick Rectangle Tool',
        description: 'The fastest way to start is with the "📐 Quick Rectangle" button. Enter your building dimensions (e.g., 40\' × 60\') and click Create.',
        highlight: 'quick-rectangle',
        action: 'Try creating a rectangle now, or click Next',
    },
    {
        title: 'Set Your Scale',
        description: 'After creating walls, set the scale using the "Set Scale" button in the top-right. This tells the system how many feet each grid square represents (typically 1, 5, or 10 feet).',
        highlight: 'scale-button',
        action: 'Set your scale, then click Next',
    },
    {
        title: 'Drawing Mode',
        description: 'Click the "✏️ Draw" button to manually add walls. Click on the canvas to place vertices. The system will automatically connect them and snap to the grid.',
        highlight: 'draw-button',
        action: 'Try drawing some walls',
    },
    {
        title: 'Edit Mode',
        description: 'Use "🔧 Edit" mode to drag vertices and reshape your walls. This is perfect for fine-tuning your floor plan.',
        highlight: 'edit-button',
    },
    {
        title: 'Pan & Zoom',
        description: 'Use "👆 Pan" mode to move around the canvas, or scroll your mouse wheel to zoom in and out. This helps when working on large buildings.',
        highlight: 'pan-button',
    },
    {
        title: 'Close Loops',
        description: 'When you have 3 or more vertices, use "🔗 Close Loop" to automatically connect the last vertex to the first, creating a complete room.',
        highlight: 'close-loop',
    },
    {
        title: 'Wall Properties',
        description: 'Click on any wall segment to select it, then use the properties panel to set thickness and material (brick, concrete, or drywall).',
        highlight: 'wall-properties',
    },
    {
        title: 'Save Your Work',
        description: 'When you\'re done, click "Save Floor Plan" in the top-right to save your design to the building. You can then view it in 3D!',
        highlight: 'save-button',
        action: 'You\'re ready to design!',
    },
];

interface Props {
    onClose: () => void;
    currentStep: number;
    onStepChange: (step: number) => void;
}

export function WallDesignerTutorial({ onClose, currentStep, onStepChange }: Props) {
    const step = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                            <p className="text-blue-100 text-sm mt-1">
                                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 transition-colors"
                            aria-label="Close tutorial"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-300 text-lg leading-relaxed mb-6">
                        {step.description}
                    </p>

                    {step.action && (
                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
                            <p className="text-blue-200 text-sm">
                                <strong>Action:</strong> {step.action}
                            </p>
                        </div>
                    )}

                    {/* Progress bar */}
                    <div className="mb-6">
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
                            disabled={isFirstStep}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>

                        <div className="flex gap-2">
                            {TUTORIAL_STEPS.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onStepChange(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentStep
                                            ? 'bg-blue-500 w-8'
                                            : idx < currentStep
                                                ? 'bg-blue-700'
                                                : 'bg-slate-600'
                                        }`}
                                    aria-label={`Go to step ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {isLastStep ? (
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-lg flex items-center gap-2"
                            >
                                Get Started!
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={() => onStepChange(Math.min(TUTORIAL_STEPS.length - 1, currentStep + 1))}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Skip tutorial */}
                    {!isLastStep && (
                        <div className="text-center mt-4">
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
                            >
                                Skip tutorial
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
