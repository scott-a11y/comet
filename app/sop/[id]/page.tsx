'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeft, ChevronRight, Clock, AlertTriangle,
    CheckCircle, QrCode, Download, Share2, Home
} from 'lucide-react';
import Image from 'next/image';

interface SOPStep {
    id: string;
    stepNumber: number;
    title: string;
    instructions: string;
    photoUrl?: string;
    estimatedMinutes?: number;
    safetyNotes?: string;
}

interface SOP {
    id: string;
    title: string;
    category: string;
    version: string;
    status: string;
    description?: string;
    tags: string[];
    steps: SOPStep[];
}

export default function SOPViewerPage() {
    const params = useParams();
    const [sop, setSop] = useState<SOP | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (params.id) {
            fetchSOP(params.id as string);
        }
    }, [params.id]);

    const fetchSOP = async (id: string) => {
        try {
            const response = await fetch(`/api/sops`);
            const result = await response.json();
            if (result.success) {
                const foundSop = result.data.find((s: SOP) => s.id === id);
                setSop(foundSop || null);
            }
        } catch (error) {
            console.error('Error fetching SOP:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStepComplete = (stepNumber: number) => {
        const newCompleted = new Set(completedSteps);
        if (newCompleted.has(stepNumber)) {
            newCompleted.delete(stepNumber);
        } else {
            newCompleted.add(stepNumber);
        }
        setCompletedSteps(newCompleted);
    };

    const goToNextStep = () => {
        if (sop && currentStep < sop.steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const goToPrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (!sop) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">SOP Not Found</h2>
                    <Link
                        href="/sop"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors inline-block"
                    >
                        Back to Library
                    </Link>
                </div>
            </div>
        );
    }

    const step = sop.steps[currentStep];
    const progress = ((completedSteps.size / sop.steps.length) * 100).toFixed(0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <Link
                            href="/sop"
                            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            <span className="hidden sm:inline">Library</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                <QrCode className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{sop.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{sop.category}</span>
                        <span>•</span>
                        <span>v{sop.version}</span>
                        <span>•</span>
                        <span>{sop.steps.length} steps</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="max-w-4xl mx-auto px-4 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold text-white min-w-[3rem] text-right">
                            {progress}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                    {/* Step Header */}
                    <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/10 border-b border-slate-700 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="text-blue-400 text-sm font-semibold mb-2">
                                    Step {step.stepNumber} of {sop.steps.length}
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                    {step.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => toggleStepComplete(step.stepNumber)}
                                className={`p-3 rounded-full transition-all ${completedSteps.has(step.stepNumber)
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                    }`}
                            >
                                <CheckCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {step.estimatedMinutes && (
                            <div className="flex items-center gap-2 text-slate-300">
                                <Clock className="w-5 h-5" />
                                <span className="font-semibold">{step.estimatedMinutes} minutes</span>
                            </div>
                        )}
                    </div>

                    {/* Photo */}
                    {step.photoUrl && (
                        <div className="relative w-full h-64 sm:h-96 bg-slate-900">
                            <Image
                                src={step.photoUrl}
                                alt={step.title}
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                                {step.instructions}
                            </p>
                        </div>
                    </div>

                    {/* Safety Notes */}
                    {step.safetyNotes && (
                        <div className="mx-6 mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-orange-300 font-semibold mb-2">Safety Notes</h4>
                                    <p className="text-orange-200/80 text-sm leading-relaxed">
                                        {step.safetyNotes}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="p-6 border-t border-slate-700">
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={goToPrevStep}
                                disabled={currentStep === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            <div className="text-center">
                                <div className="text-sm text-slate-400 mb-1">Step Progress</div>
                                <div className="text-lg font-bold text-white">
                                    {currentStep + 1} / {sop.steps.length}
                                </div>
                            </div>

                            <button
                                onClick={goToNextStep}
                                disabled={currentStep === sop.steps.length - 1}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step Overview */}
                <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">All Steps</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {sop.steps.map((s, idx) => (
                            <button
                                key={s.id}
                                onClick={() => setCurrentStep(idx)}
                                className={`p-3 rounded-lg font-semibold transition-all ${idx === currentStep
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                                        : completedSteps.has(s.stepNumber)
                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                {s.stepNumber}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
