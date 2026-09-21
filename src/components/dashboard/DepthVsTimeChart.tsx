"use client";

import { useMemo } from "react";
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
import { RIG_STATE_CONFIG, RigState } from "@/types";
import { ArrowDownCircle } from "lucide-react";

export function DepthVsTimeChart() {
  const { data } = useTelemetry();
  const { currentMs } = usePlayback();

  // Downsample for optimal charting performance (250 points provides crisp display with half the SVG complexity)
  const chartData = useMemo(() => {
    if (!data.length) return [];
    const step = Math.max(1, Math.floor(data.length / 250));
    return data
      .filter((_, i) => i % step === 0)
      .map((d) => ({
        time: d.timestampMs,
        timeLabel: d.timestamp,
        DBTM: d.DBTM,
        DMEA: d.DMEA,
        state: d.state,
        stateColor: RIG_STATE_CONFIG[d.state as RigState]?.color || "#8899AA",
      }));
  }, [data]);

  return (
    <div className="pertamina-card flex h-full flex-col justify-between rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Header & Legends */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-400 shadow-sm">
            <ArrowDownCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-100 uppercase">
              Depth vs. Time
            </h3>
            <p className="text-[11px] text-slate-400">
              Drilling progress trajectory • Inverted depth scale (ft)
            </p>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-950/40 px-2.5 py-1">
            <span className="h-1.5 w-3 rounded-full bg-[#0099D8]" />
            <span className="font-medium text-sky-200 text-[11px]">Bit Depth (DBTM)</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/60 px-2.5 py-1">
            <span className="h-1.5 w-3 rounded-full border-t border-dashed border-slate-400" />
            <span className="font-medium text-slate-300 text-[11px]">Hole Depth (DMEA)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 15, left: 10, bottom: 5 }}>
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
              reversed
              tick={{ fontSize: 11, fill: "#64748B" }}
              stroke="#1E3A5A"
              label={{
                value: "Depth (ft)",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                style: { fontSize: 11, fill: "#94A3B8", fontWeight: 500 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                const stateConfig = RIG_STATE_CONFIG[d?.state as RigState];
                return (
                  <div className="custom-chart-tooltip">
                    <div className="text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
                      {d?.timeLabel}
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Bit Depth:</span>
                        <span className="font-mono font-bold text-sky-400">
                          {d?.DBTM?.toFixed(1)} ft
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Hole Depth:</span>
                        <span className="font-mono font-bold text-slate-300">
                          {d?.DMEA?.toFixed(1)} ft
                        </span>
                      </div>
                      {stateConfig && (
                        <div
                          className="mt-1 flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${stateConfig.color}20`,
                            color: stateConfig.color,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: stateConfig.color }}
                          />
                          {stateConfig.label}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            {/* Hole depth line */}
            <Line
              dataKey="DMEA"
              stroke="#64748B"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            {/* Bit depth line */}
            <Line
              dataKey="DBTM"
              stroke="#0099D8"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            {/* Playback Cursor Reference Line */}
            {currentMs > 0 && (
              <ReferenceLine
                x={currentMs}
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
