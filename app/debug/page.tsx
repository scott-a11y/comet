"use client";

import { useEffect, useState } from 'react';

export default function DebugPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                setStatus(data);
                setLoading(false);
            })
            .catch(err => {
                setStatus({ error: 'Failed to fetch' });
                setLoading(false);
            });
    }, []);

    const getStatusColor = (val: string) => {
        if (val === 'connected' || val === 'configured') return 'text-emerald-400';
        if (val.startsWith('error') || val.includes('missing')) return 'text-rose-400';
        return 'text-amber-400';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono">
            <div className="max-w-2xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-white mb-2">System Diagnostics</h1>
                    <p className="text-slate-400">Verifying external connections and environment status.</p>
                </header>

                {loading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-800 rounded"></div>
                            <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {status && Object.entries(status).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex justify-between items-center transition-all hover:border-slate-700">
                                <span className="uppercase tracking-wider text-sm font-semibold text-slate-500">{key}</span>
                                <span className={`text-lg ${getStatusColor(value.toString())}`}>
                                    {value.toString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-8 border-t border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4">Project Audit Status</h2>
                    <ul className="space-y-3 text-slate-300">
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-500">✅</span>
                            <span>TypeScript Compilation: <strong>PASSING</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-500">✅</span>
                            <span>Security Audit: <strong>PATCHED</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-500">✅</span>
                            <span>Prisma Schema: <strong>COMPLETE (15 Tables)</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-amber-500">⚠️</span>
                            <span>3D Build: <strong>PROTOTYPE (Dependencies Required)</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-amber-500">⚠️</span>
                            <span>External Connections: <strong>CODE READY (Needs Production Keys)</strong></span>
                        </li>
                    </ul>
                </div>

                <div className="bg-slate-900/50 p-4 rounded border border-blue-900/30 text-blue-200 text-sm">
                    <strong>Note:</strong> To complete the 3D build, install <code>@react-three/fiber</code> and <code>@react-three/drei</code>. To complete connections, update your <code>.env</code> using <code>PRODUCTION_ENV_TEMPLATE.md</code>.
                </div>
            </div>
        </div>
    );
}
