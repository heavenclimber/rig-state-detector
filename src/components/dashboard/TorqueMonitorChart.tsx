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
import { Wrench } from "lucide-react";

export function TorqueMonitorChart() {
  const { data } = useTelemetry();
  const offsetWells = useSelector((state: RootState) => state.telemetry.offsetWells);
  const alerts = useSelector((state: RootState) => state.telemetry.alerts);
  const { currentMs } = usePlayback();

  const offsetRef = useMemo(() => {
    return offsetWells.find((o) => o.hole_section.includes("8-1/2")) || offsetWells[0];
  }, [offsetWells]);

  const stickSlipTimes = useMemo(() => {
    return new Set(
      alerts
        .filter((a) => a.type === "STICK_SLIP")
        .map((a) => a.timestampMs)
    );
  }, [alerts]);

  const chartData = useMemo(() => {
    if (!data.length) return [];
    const step = Math.max(1, Math.floor(data.length / 250));
    return data
      .filter((_, i) => i % step === 0)
      .map((d) => ({
        time: d.timestampMs,
        timeLabel: d.timestamp,
        TORQUE_mean: d.TORQUE_mean,
        TORQUE_min: d.TORQUE_min,
        TORQUE_max: d.TORQUE_max,
        TORQUE_stddev: d.TORQUE_stddev,
        isStickSlip: stickSlipTimes.has(d.timestampMs),
        stickSlipBar: stickSlipTimes.has(d.timestampMs) ? d.TORQUE_max : null,
      }));
  }, [data, stickSlipTimes]);

  return (
    <div className="pertamina-card flex h-full flex-col justify-between rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Header & Legends */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400 shadow-sm">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-100 uppercase">
              Torque & Stick-Slip Monitor
            </h3>
            <p className="text-[11px] text-slate-400">
              Rotational torque oscillations & downhole friction envelope
            </p>
          </div>
        </div>

        {/* Legend Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-950/40 px-2.5 py-1">
            <span className="h-1.5 w-3 rounded-full bg-[#A855F7]" />
            <span className="font-medium text-purple-200 text-[11px]">Mean Torque</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-purple-800/40 bg-purple-950/20 px-2.5 py-1">
            <span className="h-2 w-3 rounded-sm bg-[#A855F7]/30" />
            <span className="font-medium text-purple-300 text-[11px]">Envelope</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-950/40 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-[#ED1C24] animate-ping" />
            <span className="font-medium text-red-300 text-[11px]">Stick-Slip</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 15, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="torqueEnvelopeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="stickSlipAlertGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ED1C24" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ED1C24" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
              tick={{ fontSize: 11, fill: "#64748B" }}
              stroke="#1E3A5A"
              label={{
                value: "Torque (kft-lb)",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                style: { fontSize: 11, fill: "#A855F7", fontWeight: 600 },
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
                        <span className="text-slate-400">Mean Torque:</span>
                        <span className="font-mono font-bold text-purple-400">
                          {d?.TORQUE_mean?.toFixed(0)} kft-lb
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-400">
                        <span>Range:</span>
                        <span className="font-mono text-slate-300">
                          {d?.TORQUE_min?.toFixed(0)} – {d?.TORQUE_max?.toFixed(0)} kft-lb
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-400">
                        <span>StdDev:</span>
                        <span className="font-mono text-slate-300">
                          ±{d?.TORQUE_stddev?.toFixed(1)}
                        </span>
                      </div>
                      {d?.isStickSlip && (
                        <div className="mt-1 flex items-center gap-1 rounded bg-red-950/60 border border-red-500/40 px-2 py-0.5 text-[11px] font-bold text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          Severe Stick-Slip Detected
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            {/* Torque Envelope */}
            <Area
              dataKey="TORQUE_max"
              fill="url(#torqueEnvelopeGrad)"
              stroke="#A855F7"
              strokeOpacity={0.4}
              strokeWidth={0.5}
              isAnimationActive={false}
            />
            {/* Stick-slip highlight bars */}
            <Area
              dataKey="stickSlipBar"
              fill="url(#stickSlipAlertGrad)"
              stroke="#ED1C24"
              strokeOpacity={0.7}
              strokeWidth={0.8}
              isAnimationActive={false}
              connectNulls={false}
            />
            {/* Torque mean line */}
            <Line
              dataKey="TORQUE_mean"
              stroke="#A855F7"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {/* Offset Well Max Reference */}
            {offsetRef && (
              <ReferenceLine
                y={offsetRef.max_DRL_TORQUE}
                stroke="#ED1C24"
                strokeDasharray="5 3"
                strokeOpacity={0.5}
              />
            )}
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
