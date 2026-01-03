"use client";

import { useState, useEffect } from "react";
import { extractMachinerySpecs } from "@/actions/extract-specs";
import { saveMachinerySpecs } from "@/actions/save-specs";
import { useServerAction } from "zsa-react";
import type { MachinerySpecs } from "@/lib/validations/machinery";
import toast from "react-hot-toast";

// ... fileToBase64 function remains same ...
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data URL prefix (e.g. "data:application/pdf;base64,")
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

interface SimpleBuilding {
    id: number;
    name: string;
}

export default function SpecsExtractionPage() {
    const [file, setFile] = useState<File | null>(null);
    const [specs, setSpecs] = useState<MachinerySpecs | null>(null);
    const [buildings, setBuildings] = useState<SimpleBuilding[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");

    const { isPending, execute, error } = useServerAction(extractMachinerySpecs);
    const { isPending: isSaving, execute: executeSave } = useServerAction(saveMachinerySpecs);

    useEffect(() => {
        fetch('/api/buildings')
            .then(res => res.json())
            .then(data => setBuildings(data))
            .catch(err => console.error("Failed to fetch buildings", err));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSpecs(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            const base64 = await fileToBase64(file);
            const [data, err] = await execute({ fileBase64: base64 });

            if (err) {
                console.error("Extraction error:", err);
                return;
            }

            if (data && data.success && data.data) {
                setSpecs(data.data as MachinerySpecs);
                toast.success("Specs extracted!");
            }
        } catch (e) {
            console.error("Upload failed", e);
            toast.error("Upload failed");
        }
    };

    const handleSave = async () => {
        if (!specs || !selectedBuildingId) return;

        const [data, err] = await executeSave({
            buildingId: parseInt(selectedBuildingId),
            specs: specs
        });

        if (err) {
            console.error("Save error:", err);
            toast.error("Failed to save specs");
            return;
        }

        if (data && data.success) {
            toast.success("Specs saved to building!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-blue-400">Machinery Spec Agent (Alpha)</h1>
                    <p className="text-slate-400">Upload a PDF manual to extract technical specifications.</p>
                </div>

                <div className="p-6 bg-slate-900 rounded-lg border border-slate-800">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
            "
                    />

                    {file && (
                        <div className="mt-4">
                            <button
                                onClick={handleUpload}
                                disabled={isPending}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isPending ? 'Analyzing...' : 'Extract Specs'}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded text-red-200">
                            Error: {JSON.stringify(error)}
                        </div>
                    )}
                </div>

                {specs && (
                    <div className="space-y-4">
                        <div className="p-6 bg-slate-900 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-amber-400">Extracted Specifications</h2>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedBuildingId}
                                        onChange={(e) => setSelectedBuildingId(e.target.value)}
                                        className="bg-slate-800 border-slate-700 rounded text-sm p-2"
                                    >
                                        <option value="">Select Building</option>
                                        {buildings.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || !selectedBuildingId}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save to Building'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-slate-500">Manufacturer</span>
                                        <span className="font-mono text-lg">{specs.manufacturer || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-500">Model</span>
                                        <span className="font-mono text-lg">{specs.model || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-800 pt-4">
                                    <h3 className="font-medium text-slate-300 mb-2">Dimensions</h3>
                                    <div className="grid grid-cols-3 gap-4 font-mono">
                                        <div>W: {specs.dimensions?.width ?? '-'} <span className="text-slate-600">{specs.dimensions?.unit}</span></div>
                                        <div>D: {specs.dimensions?.depth ?? '-'} <span className="text-slate-600">{specs.dimensions?.unit}</span></div>
                                        <div>H: {specs.dimensions?.height ?? '-'} <span className="text-slate-600">{specs.dimensions?.unit}</span></div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-800 pt-4">
                                    <h3 className="font-medium text-slate-300 mb-2">Electrical</h3>
                                    {specs.electrical ? (
                                        <div className="grid grid-cols-2 gap-2 font-mono">
                                            <div>{specs.electrical.voltage ? `${specs.electrical.voltage}V` : ''}</div>
                                            <div>{specs.electrical.phase ? `${specs.electrical.phase}-Phase` : ''}</div>
                                            <div>{specs.electrical.amps ? `${specs.electrical.amps}A` : ''}</div>
                                            <div>{specs.electrical.power ? `${specs.electrical.power} ${specs.electrical.unit || ''}` : ''}</div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">No electrical data found.</div>
                                    )}
                                </div>

                                <div className="bg-slate-950 p-4 rounded overflow-auto border border-slate-800 font-mono text-xs">
                                    <pre>{JSON.stringify(specs, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
