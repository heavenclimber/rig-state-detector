"use client";

import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { toggleSidebar, toggleAssistant } from "@/store/uiSlice";
import { useCurrentMinute } from "@/hooks/useTelemetry";
import { RIG_STATE_CONFIG } from "@/types";
import { Activity, Bell, Compass, Radio, ShieldAlert, Sparkles } from "lucide-react";

export function DashboardHeader() {
  const dispatch = useDispatch<AppDispatch>();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const assistantOpen = useSelector((state: RootState) => state.ui.assistantOpen);
  const currentMinute = useCurrentMinute();
  const alerts = useSelector((state: RootState) => state.telemetry.alerts);
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;

  const currentState = currentMinute
    ? RIG_STATE_CONFIG[currentMinute.state]
    : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#050B14]/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Telemetry Metadata */}
        <div className="flex items-center gap-4">
          {/* Pertamina-Themed Icon / Emblem */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#004B87] via-[#0066B3] to-[#0099D8] shadow-lg shadow-sky-950/50 border border-sky-400/20">
            <Activity className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00A651] opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#00A651] border-2 border-[#050B14]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wider text-white sm:text-lg">
                RIG STATE DETECTOR
              </h1>
              <span className="hidden rounded-md bg-blue-950/80 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-sky-400 border border-sky-500/30 sm:inline-block">
                PHR SEBL FIELD
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              Real-Time High-Frequency Drilling Telemetry (1-Min Resampled)
            </p>
          </div>
        </div>

        {/* Center: Live Rig State Indicator */}
        <div className="hidden md:flex items-center">
          {currentState ? (
            <div
              className="flex items-center gap-2.5 rounded-full px-4 py-1.5 border backdrop-blur-md shadow-lg transition-all"
              style={{
                backgroundColor: `${currentState.color}15`,
                borderColor: `${currentState.color}45`,
                boxShadow: `0 0 20px -3px ${currentState.color}30`,
              }}
            >
              <div
                className="h-2.5 w-2.5 rounded-full pulse-indicator"
                style={
                  {
                    backgroundColor: currentState.color,
                    "--pulse-color": currentState.color,
                  } as React.CSSProperties
                }
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: currentState.color }}
                  >
                    {currentState.label}
                  </span>
                  <span className="text-[10px] text-slate-400">• LIVE STATE</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3.5 py-1 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse" />
              INITIALIZING TELEMETRY...
            </div>
          )}
        </div>

        {/* Right: Well Context & Alerts Drawer Toggle */}
        <div className="flex items-center gap-3">
          {/* Well & Rig Info Pill */}
          <div className="hidden lg:flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-1.5 text-xs shadow-inner">
            <div className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-slate-400 font-medium">Well:</span>
              <span className="font-bold text-sky-300 font-mono">SEBL_001</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Rig:</span>
              <span className="font-bold text-slate-200 font-mono">PHR-05</span>
            </div>
          </div>

          {/* AI DDR Assistant Trigger */}
          <button
            id="ai-assistant-header-btn"
            onClick={() => dispatch(toggleAssistant())}
            className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all duration-200 border ${
              assistantOpen
                ? "border-sky-500/60 bg-sky-950/50 text-sky-200 shadow-lg shadow-sky-950/40"
                : "border-sky-500/30 bg-sky-950/30 text-sky-300 hover:border-sky-400 hover:bg-sky-900/40 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>AI DDR ASSISTANT</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Alerts Toggle Button */}
          <button
            id="alerts-toggle-btn"
            onClick={() => dispatch(toggleSidebar())}
            className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all duration-200 border ${
              sidebarOpen
                ? "border-red-500/60 bg-red-950/40 text-red-300 shadow-lg shadow-red-950/40"
                : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {criticalCount > 0 ? (
              <ShieldAlert className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Bell className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
            <span>ANOMALY ALERTS</span>

            {alerts.length > 0 && (
              <span
                className={`flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold font-mono ${
                  criticalCount > 0
                    ? "bg-red-500 text-white shadow-sm shadow-red-500/50"
                    : "bg-amber-500 text-slate-950"
                }`}
              >
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
