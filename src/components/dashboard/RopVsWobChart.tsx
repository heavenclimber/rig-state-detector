"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { usePlayback } from "@/hooks/usePlayback";
import { GaugeCircle } from "lucide-react";

export function RopVsWobChart() {
  const { data } = useTelemetry();
  const offsetWells = useSelector((state: RootState) => state.telemetry.offsetWells);
  const { currentMs } = usePlayback();

  // Get offset reference for 8.5" section
  const offsetRef = useMemo(() => {
    return offsetWells.find((o) => o.hole_section.includes("8-1/2")) || offsetWells[0];
  }, [offsetWells]);

  const chartData = useMemo(() => {
    if (!data.length) return [];
    const step = Math.max(1, Math.floor(data.length / 250));
    return data
      .filter((_, i) => i % step === 0)
      .map((d) => ({
        time: d.timestampMs,
        timeLabel: d.timestamp,
        ROP: d.ROP,
        WOB: Math.max(0, d.WOB),
      }));
  }, [data]);

  return (
    <div className="pertamina-card flex h-full flex-col justify-between rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Header & Legends */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shadow-sm">
            <GaugeCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-100 uppercase">
              ROP vs. WOB Dynamics
            </h3>
            <p className="text-[11px] text-slate-400">
              Penetration rate (ft/h) vs. drill bit force load (klb)
            </p>
          </div>
        </div>

        {/* Legend Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1">
            <span className="h-1.5 w-3 rounded-full bg-[#00A651]" />
            <span className="font-medium text-emerald-200 text-[11px]">ROP (ft/h)</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-950/40 px-2.5 py-1">
            <span className="h-1.5 w-3 rounded-full bg-[#F59E0B]" />
            <span className="font-medium text-amber-200 text-[11px]">WOB (klb)</span>
          </div>
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
              label={{
                value: "ROP (ft/h)",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                style: { fontSize: 11, fill: "#00A651", fontWeight: 600 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#64748B" }}
              stroke="#1E3A5A"
              label={{
                value: "WOB (klb)",
                angle: 90,
                position: "insideRight",
                offset: 5,
                style: { fontSize: 11, fill: "#F59E0B", fontWeight: 600 },
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
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">ROP:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {d?.ROP?.toFixed(1)} ft/h
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">WOB:</span>
                        <span className="font-mono font-bold text-amber-400">
                          {d?.WOB?.toFixed(1)} klb
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {/* Offset Well Reference Lines */}
            {offsetRef && (
              <>
                <ReferenceLine
                  yAxisId="left"
                  y={offsetRef.max_ROP}
                  stroke="#00A651"
                  strokeDasharray="5 3"
                  strokeOpacity={0.4}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={offsetRef.max_WOB}
                  stroke="#F59E0B"
                  strokeDasharray="5 3"
                  strokeOpacity={0.4}
                />
              </>
            )}
            <Area
              yAxisId="right"
              dataKey="WOB"
              fill="#F59E0B"
              fillOpacity={0.12}
              stroke="#F59E0B"
              strokeWidth={1.2}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              dataKey="ROP"
              stroke="#00A651"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
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
