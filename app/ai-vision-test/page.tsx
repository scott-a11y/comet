"use client";

import { useState } from "react";
import type { AnalysisData } from "@/lib/validations/analysis";
import toast from "react-hot-toast";

export default function AIVisionTestPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setAnalysisResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            toast.error("Please select an image file");
            return;
        }

        setIsAnalyzing(true);
        toast.loading("Uploading and analyzing floor plan...");

        try {
            // Upload to Vercel Blob
            const uploadResponse = await fetch(`/api/upload?filename=${file.name}`, {
                method: 'POST',
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const { url } = await uploadResponse.json();

            // Analyze the uploaded image
            const analysisResponse = await fetch("/api/analyze-floorplan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: url }),
            });

            const data = await analysisResponse.json();
            toast.dismiss();

            if (!analysisResponse.ok) {
                toast.error(data.error || "Analysis failed");
                return;
            }

            setAnalysisResult(data);
            toast.success("Analysis complete!");
        } catch (e) {
            console.error("Analysis failed", e);
            toast.dismiss();
            toast.error("Analysis failed: " + (e as Error).message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        🤖 AI Vision Test - Floor Plan Analysis
                    </h1>
                    <p className="text-slate-400">Upload a shop floor plan image or PDF to automatically detect equipment, dimensions, and utility ports.</p>
                </div>

                <div className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 shadow-2xl">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Select Floor Plan (Image or PDF)
                    </label>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-400
                            file:mr-4 file:py-3 file:px-6
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-gradient-to-r file:from-blue-600 file:to-cyan-600 file:text-white
                            hover:file:from-blue-700 hover:file:to-cyan-700
                            file:transition-all file:duration-200 file:cursor-pointer
                        "
                    />

                    {file && (
                        <div className="mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-green-500/50"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Analyzing with GPT-4o Vision...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Analyze Floor Plan
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {previewUrl && (
                    <div className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Input Image Preview
                        </h3>
                        <img src={previewUrl} alt="Floor plan preview" className="w-full rounded-lg border border-slate-700 shadow-xl" />
                    </div>
                )}

                {analysisResult && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="p-6 bg-gradient-to-br from-slate-900/80 to-blue-900/30 backdrop-blur rounded-xl border border-blue-700/50 shadow-2xl">
                            <h2 className="text-2xl font-semibold text-amber-400 mb-6 flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Analysis Results
                            </h2>

                            <div className="space-y-6">
                                {/* Dimensions */}
                                <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                                    <h3 className="font-medium text-slate-300 mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                        Building Dimensions
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 font-mono text-lg">
                                        <div className="p-3 bg-blue-950/30 rounded border border-blue-800/30">
                                            <span className="block text-xs text-slate-500 mb-1">Width</span>
                                            <span className="text-blue-300 text-2xl font-bold">{analysisResult.width} ft</span>
                                        </div>
                                        <div className="p-3 bg-blue-950/30 rounded border border-blue-800/30">
                                            <span className="block text-xs text-slate-500 mb-1">Length</span>
                                            <span className="text-blue-300 text-2xl font-bold">{analysisResult.length} ft</span>
                                        </div>
                                        <div className="p-3 bg-blue-950/30 rounded border border-blue-800/30">
                                            <span className="block text-xs text-slate-500 mb-1">Height</span>
                                            <span className="text-blue-300 text-2xl font-bold">{analysisResult.height || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                                    <h3 className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        AI Summary
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed">{analysisResult.summary}</p>
                                </div>

                                {/* Detected Equipment */}
                                {analysisResult.detectedEquipment && analysisResult.detectedEquipment.length > 0 ? (
                                    <div className="p-4 bg-slate-950/50 rounded-lg border border-green-700/50">
                                        <h3 className="font-medium text-green-400 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            Detected Equipment ({analysisResult.detectedEquipment.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {analysisResult.detectedEquipment.map((eq, idx) => (
                                                <div key={idx} className="p-4 bg-green-950/20 rounded-lg border border-green-800/30 hover:border-green-700/50 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-semibold text-green-300 text-lg">{eq.type}</span>
                                                        <span className="text-xs px-2 py-1 bg-green-900/50 rounded text-green-400 font-mono">
                                                            {(eq.confidence * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-400 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            Position: ({eq.position.x.toFixed(2)}, {eq.position.y.toFixed(2)})
                                                        </div>
                                                        {eq.estimatedDimensions && (
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                                </svg>
                                                                Size: {eq.estimatedDimensions.width}' × {eq.estimatedDimensions.depth}'
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                                        <p className="text-slate-400 text-center">No equipment detected in this image.</p>
                                    </div>
                                )}

                                {/* Detected Ports */}
                                {analysisResult.detectedPorts && analysisResult.detectedPorts.length > 0 && (
                                    <div className="p-4 bg-slate-950/50 rounded-lg border border-purple-700/50">
                                        <h3 className="font-medium text-purple-400 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Detected Utility Ports ({analysisResult.detectedPorts.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {analysisResult.detectedPorts.map((port, idx) => (
                                                <div key={idx} className="p-3 bg-purple-950/20 rounded border border-purple-800/30">
                                                    <div className="font-semibold text-purple-300 mb-1 capitalize flex items-center gap-2">
                                                        {port.type === 'electrical' && '⚡'}
                                                        {port.type === 'dust' && '💨'}
                                                        {port.type === 'pneumatic' && '🔧'}
                                                        {port.type}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-mono">
                                                        ({port.position.x.toFixed(2)}, {port.position.y.toFixed(2)})
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Raw JSON */}
                                <details className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                                    <summary className="cursor-pointer font-medium text-slate-400 hover:text-slate-300 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                        View Raw JSON Response
                                    </summary>
                                    <pre className="mt-4 text-xs overflow-auto p-4 bg-black/50 rounded border border-slate-700 max-h-96">
                                        {JSON.stringify(analysisResult, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
