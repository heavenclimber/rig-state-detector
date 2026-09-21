"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTelemetry } from "@/hooks/useTelemetry";
import { usePlayback } from "@/hooks/usePlayback";
import { SlidersHorizontal } from "lucide-react";

type ParamKey = "SPP" | "RPM" | "MFIA" | "MFOP";

interface ParamDef {
  key: ParamKey;
  label: string;
  fullName: string;
  color: string;
  unit: string;
  yAxis: "left" | "right";
}

const PARAMS: ParamDef[] = [
  { key: "SPP", label: "SPP", fullName: "Standpipe Pressure", color: "#0099D8", unit: "psi", yAxis: "left" },
  { key: "RPM", label: "RPM", fullName: "Rotary Speed", color: "#F59E0B", unit: "rpm", yAxis: "left" },
  { key: "MFIA", label: "Flow In", fullName: "Mud Flow In", color: "#00A651", unit: "gpm", yAxis: "left" },
  { key: "MFOP", label: "Flow Out %", fullName: "Mud Flow Out", color: "#ED1C24", unit: "%", yAxis: "right" },
];

export function ParameterOverview() {
  const { data } = useTelemetry();
  const { currentMs } = usePlayback();
  const [visibleParams, setVisibleParams] = useState<Set<ParamKey>>(
    new Set(["SPP", "RPM", "MFIA", "MFOP"])
  );

  const chartData = useMemo(() => {
    if (!data.length) return [];
    const step = Math.max(1, Math.floor(data.length / 250));
    return data
      .filter((_, i) => i % step === 0)
      .map((d) => ({
        time: d.timestampMs,
        timeLabel: d.timestamp,
        SPP: d.SPP,
        RPM: d.RPM,
        MFIA: d.MFIA,
        MFOP: d.MFOP,
      }));
  }, [data]);

  const toggleParam = (key: ParamKey) => {
    setVisibleParams((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="pertamina-card flex h-full flex-col justify-between rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Header & Interactive Toggles */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-400 shadow-sm">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-100 uppercase">
              Multi-Parameter Hydraulics & Rotary
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive channel overlay (Click tags to toggle)
            </p>
          </div>
        </div>

        {/* Channel Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PARAMS.map((p) => {
            const isVisible = visibleParams.has(p.key);
            return (
              <button
                key={p.key}
                onClick={() => toggleParam(p.key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border ${
                  isVisible
                    ? "bg-slate-900 shadow-sm"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 opacity-50 hover:opacity-80"
                }`}
                style={{
                  borderColor: isVisible ? `${p.color}50` : undefined,
                  color: isVisible ? p.color : undefined,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full transition-all"
                  style={{
                    backgroundColor: isVisible ? p.color : "#64748B",
                    boxShadow: isVisible ? `0 0 6px ${p.color}` : "none",
                  }}
                />
                <span>{p.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">({p.unit})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 25, left: 10, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E3A5A"
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
              }}
              tick={{ fontSize: 11, fill: "#64748B" }}
              stroke="#1E3A5A"
              tickCount={6}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#64748B" }}
              stroke="#1E3A5A"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#64748B" }}
              stroke="#1E3A5A"
              label={{
                value: "Flow Out (%)",
                angle: 90,
                position: "insideRight",
                offset: 5,
                style: { fontSize: 11, fill: "#ED1C24", fontWeight: 600 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="custom-chart-tooltip">
                    <div className="text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
                      {d?.timeLabel}
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      {PARAMS.filter((p) => visibleParams.has(p.key)).map((p) => (
                        <div
                          key={p.key}
                          className="flex items-center justify-between gap-4"
                        >
                          <span className="text-slate-400">{p.fullName}:</span>
                          <span className="font-mono font-bold" style={{ color: p.color }}>
                            {d?.[p.key]?.toFixed(1)} {p.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            {PARAMS.map((p) =>
              visibleParams.has(p.key) ? (
                <Line
                  key={p.key}
                  yAxisId={p.yAxis}
                  dataKey={p.key}
                  stroke={p.color}
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null
            )}
            {/* Playback Cursor Reference Line */}
            {currentMs > 0 && (
              <ReferenceLine
                x={currentMs}
                yAxisId="left"
                stroke="#ED1C24"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
