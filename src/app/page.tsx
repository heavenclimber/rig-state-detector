"use client";

import { useEffect } from "react";
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
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
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
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>Telemetry Feed: <strong>SEBL_001</strong> (249,395 raw rows resampled to 1-min intervals)</span>
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
    </div>
  );
}
