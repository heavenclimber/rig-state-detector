"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchTelemetry } from "@/store/telemetrySlice";
import { fetchDdr } from "@/store/ddrSlice";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { DepthVsTimeChart } from "@/components/dashboard/DepthVsTimeChart";
import { RopVsWobChart } from "@/components/dashboard/RopVsWobChart";
import { TorqueMonitorChart } from "@/components/dashboard/TorqueMonitorChart";
import { ParameterOverview } from "@/components/dashboard/ParameterOverview";
import { AlertsSidebar } from "@/components/layout/AlertsSidebar";
import { PlaybackControls } from "@/components/dashboard/PlaybackControls";
import { AiDdrAssistant } from "@/components/assistant/AiDdrAssistant";
import { AlertCircle, RefreshCw, Info, X, Database, ShieldCheck, Activity } from "lucide-react";

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [showMethodology, setShowMethodology] = useState(false);
  const { loading, error } = useSelector((state: RootState) => state.telemetry);

  useEffect(() => {
    dispatch(fetchTelemetry());
    dispatch(fetchDdr());
  }, [dispatch]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050B14] p-4">
        <div className="pertamina-card max-w-md rounded-2xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Data Stream Connection Error
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => {
              dispatch(fetchTelemetry());
              dispatch(fetchDdr());
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004B87] to-[#0099D8] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* 1. Global Navigation Bar */}
      <DashboardHeader />

      {/* 2. Interactive Telemetry Playback Controller */}
      <PlaybackControls />

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {loading ? (
            /* Smooth Loading Skeletons */
            <div className="space-y-6 animate-pulse">
              {/* KPI Cards Skeleton */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl border border-slate-800/80 bg-slate-900/40"
                  />
                ))}
              </div>

              {/* Charts Grid Skeleton */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[380px] rounded-2xl border border-slate-800/80 bg-slate-900/40"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Section A: Key Performance Indicators */}
              <section aria-label="Key Performance Indicators" className="animate-fade-in">
                <KpiCards />
              </section>

              {/* Section B: 2x2 Analytical Telemetry Grid */}
              <section
                aria-label="Telemetry Charts Grid"
                className="grid grid-cols-1 xl:grid-cols-2 gap-6"
              >
                {/* Chart 1: Depth vs. Time */}
                <div className="animate-fade-in animation-delay-100 min-h-[380px]">
                  <DepthVsTimeChart />
                </div>

                {/* Chart 2: ROP vs. WOB */}
                <div className="animate-fade-in animation-delay-200 min-h-[380px]">
                  <RopVsWobChart />
                </div>

                {/* Chart 3: Torque Monitor & Stick-Slip */}
                <div className="animate-fade-in animation-delay-200 min-h-[380px]">
                  <TorqueMonitorChart />
                </div>

                {/* Chart 4: Multi-Parameter Hydraulics & Rotary */}
                <div className="animate-fade-in animation-delay-300 min-h-[380px]">
                  <ParameterOverview />
                </div>
              </section>
            </>
          )}

          {/* Footer Information */}
          <footer className="mt-8 border-t border-slate-800/60 pt-4 pb-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>Telemetry Feed: <strong>SEBL_001</strong> (249,395 raw rows resampled to 1-min intervals)</span>
              <button
                onClick={() => setShowMethodology(true)}
                className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300 hover:border-sky-400 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <Info className="h-3 w-3 text-sky-400" />
                <span>View Data Methodology & Assumptions</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Pertamina Hulu Rokan (PHR) Standards</span>
              <span>•</span>
              <span>Offset Well Baseline: 8-1/2&quot; Section</span>
            </div>
          </footer>
        </div>
      </main>

      {/* 4. Sliding Anomaly Alerts Drawer */}
      <AlertsSidebar />

      {/* 5. AI DDR Assistant Floating Chat Widget (Groq LLM) */}
      <AiDdrAssistant />

      {/* 6. Data Engineering Methodology & Timestamp Assumptions Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="pertamina-card max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-sky-500/40 bg-[#071322] text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-950 border border-sky-500/40 text-sky-400">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Data Engineering Methodology & Timestamp Assumptions</h3>
                  <p className="text-xs text-slate-400">Cleaning & signal preservation for irregularly sampled telemetry</p>
                </div>
              </div>
              <button
                onClick={() => setShowMethodology(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <h4 className="font-bold text-sky-300 flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-sky-400" />
                  1. Raw Feed Characteristics
                </h4>
                <p className="text-slate-400">
                  The raw telemetry feed (<code className="text-sky-300">realtime_rig_telemetry.csv</code>) contains <strong>249,395 sensor rows</strong> sampled irregularly (~every 1.5–2 seconds). The timestamp column (<code className="text-sky-300">dtsrv</code>) carries <strong>only minute-level precision</strong> with no seconds column (~35 readings share each minute).
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  2. Stated Resampling Assumptions
                </h4>
                <p className="text-slate-400">
                  Raw rows are grouped into <strong>7,330 discrete minute buckets</strong>. We assume the raw within-minute row sequence represents the true chronological sensor arrival order.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <h4 className="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-purple-400" />
                  3. Anti-Averaging (Critical Signal Preservation)
                </h4>
                <p className="text-slate-400">
                  Blindly averaging all columns washes away high-frequency physical vibrations required to detect downhole stick-slip. Our ETL computes:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                  <li><strong className="text-purple-300">Torque StdDev:</strong> Standard deviation across within-minute readings. Triggers critical Stick-Slip alert when <code className="text-purple-300">&gt; 800 kft-lb</code>.</li>
                  <li><strong className="text-sky-300">BPOS Range:</strong> Max - Min block travel within the minute, distinguishing Tripping vs. Connection vs. Static.</li>
                  <li><strong className="text-slate-300">Hydraulics & ROP:</strong> Arithmetic means across the minute for steady trend analysis.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  4. 60 FPS Performance Resampling
                </h4>
                <p className="text-slate-400">
                  For browser rendering, the 7,330 minutes are dynamically downsampled to ~250 points, preventing main-thread SVG layout thrashing while preserving trajectory fidelity.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowMethodology(false)}
                className="rounded-xl bg-gradient-to-r from-[#004B87] to-[#0099D8] px-5 py-2 text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
