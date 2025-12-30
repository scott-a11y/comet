"use client";

import { useMemo } from "react";
import { useLayoutStore } from "@/lib/store/layout-store";
import type { SystemType } from "@/lib/validations/layout";

function pxLen(seg: { x1: number; y1: number; x2: number; y2: number }) {
  return Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
}

export function TakeoffPanel() {
  const { runs, ftPerPx } = useLayoutStore();

  const totals = useMemo(() => {
    const bySystem = new Map<SystemType, number>();
    for (const r of runs) {
      const totalPx = r.segments.reduce((acc, s) => acc + pxLen(s), 0);
      bySystem.set(r.system, (bySystem.get(r.system) ?? 0) + totalPx);
    }
    return bySystem;
  }, [runs]);

  const systems: SystemType[] = ["ELECTRICAL", "AIR", "DUCT", "DUST", "PIPING"];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Takeoff</h3>
        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
          {runs.length} runs
        </span>
      </div>

      <div className="text-xs text-slate-400">
        {ftPerPx ? (
          <div>Scale: {(ftPerPx * 1000).toFixed(3)} ft/1000px</div>
        ) : (
          <div className="text-amber-300">Scale not set — showing pixel totals</div>
        )}
      </div>

      <div className="space-y-2">
        {systems.map((sys) => {
          const totalPx = totals.get(sys) ?? 0;
          const label = ftPerPx ? `${(totalPx * ftPerPx).toFixed(1)} ft` : `${Math.round(totalPx)} px`;
          return (
            <div key={sys} className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
              <div className="text-sm text-slate-200">{sys}</div>
              <div className="text-sm text-white font-medium">{label}</div>
            </div>
          );
        })}
      </div>

      {runs.length > 0 && (
        <div className="pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-2">Runs</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {runs.map((r) => {
              const totalPx = r.segments.reduce((acc, s) => acc + pxLen(s), 0);
              const len = ftPerPx ? `${(totalPx * ftPerPx).toFixed(1)} ft` : `${Math.round(totalPx)} px`;
              return (
                <div key={r.id} className="bg-slate-800 rounded px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-300">{r.system}</div>
                    <div className="text-xs text-white">{len}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {r.from.itemId}:{r.from.portId} → {r.to.itemId}:{r.to.portId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
