"use client";

import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { toggleSidebar, setSelectedAlertId, setPlaybackCurrentMs, setPlaybackPlaying } from "@/store/uiSlice";
import { ALERT_TYPE_CONFIG } from "@/types";
import { formatTimestamp } from "@/lib/utils";
import { X, ShieldAlert, AlertTriangle, PlayCircle, Filter } from "lucide-react";

type FilterType = "ALL" | "CRITICAL" | "WARNING";

export function AlertsSidebar() {
  const dispatch = useDispatch<AppDispatch>();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const alerts = useSelector((state: RootState) => state.telemetry.alerts);
  const selectedAlertId = useSelector((state: RootState) => state.ui.selectedAlertId);
  const [filter, setFilter] = useState<FilterType>("ALL");

  const filteredAlerts = useMemo(() => {
    if (filter === "ALL") return alerts;
    return alerts.filter((a) => a.severity === filter);
  }, [alerts, filter]);

  // Group alerts by type for summary
  const alertSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    for (const a of alerts) {
      summary[a.type] = (summary[a.type] || 0) + 1;
    }
    return summary;
  }, [alerts]);

  const handleAlertClick = (alertId: string, timestampMs: number) => {
    dispatch(setSelectedAlertId(alertId));
    dispatch(setPlaybackCurrentMs(timestampMs));
    dispatch(setPlaybackPlaying(false));
  };

  if (!sidebarOpen) return null;

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = alerts.filter((a) => a.severity === "WARNING").length;

  return (
    <>
      {/* Dimmed backdrop for focused view */}
      <div
        onClick={() => dispatch(toggleSidebar())}
        className="fixed inset-0 z-40 h-full w-full bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <aside
        id="alerts-sidebar-drawer"
        className="fixed right-0 top-0 bottom-0 z-50 flex h-screen w-full max-w-[420px] flex-col border-l border-slate-800 bg-[#081321] shadow-2xl transition-transform duration-300 ease-out"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4 bg-[#0A182A]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950/60 border border-red-500/40 text-red-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white uppercase">
                Anomaly Alerts
              </h2>
              <p className="text-xs text-slate-400">
                {alerts.length} total anomalies detected in telemetry
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Close alerts panel"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Severity Filter Tabs */}
        <div className="border-b border-slate-800/80 bg-[#0A1626] px-5 py-3 space-y-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/70 p-1">
            <button
              onClick={() => setFilter("ALL")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                filter === "ALL"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>All</span>
              <span className="rounded-full bg-slate-700/80 px-1.5 py-0.2 text-[10px] font-mono">
                {alerts.length}
              </span>
            </button>

            <button
              onClick={() => setFilter("CRITICAL")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                filter === "CRITICAL"
                  ? "bg-red-950/80 text-red-300 border border-red-500/50 shadow-sm"
                  : "text-slate-400 hover:text-red-300"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Critical</span>
              <span className="rounded-full bg-red-900/60 px-1.5 py-0.2 text-[10px] font-mono text-red-300">
                {criticalCount}
              </span>
            </button>

            <button
              onClick={() => setFilter("WARNING")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                filter === "WARNING"
                  ? "bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm"
                  : "text-slate-400 hover:text-amber-300"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Warning</span>
              <span className="rounded-full bg-amber-900/60 px-1.5 py-0.2 text-[10px] font-mono text-amber-300">
                {warningCount}
              </span>
            </button>
          </div>

          {/* Anomaly Category Tags */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(alertSummary).map(([type, count]) => {
              const config = ALERT_TYPE_CONFIG[type as keyof typeof ALERT_TYPE_CONFIG];
              return (
                <div
                  key={type}
                  className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-300"
                >
                  <span>{config?.icon}</span>
                  <span className="font-medium">{config?.label}:</span>
                  <span className="font-mono font-bold text-sky-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Alerts Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Filter className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium">No alerts matching filter</p>
              <p className="text-xs text-slate-400 mt-1">Try selecting a different filter above</p>
            </div>
          ) : (
            filteredAlerts.slice(0, 150).map((alert) => {
              const isSelected = selectedAlertId === alert.id;
              const isCritical = alert.severity === "CRITICAL";
              return (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert.id, alert.timestampMs)}
                  className={`group relative flex flex-col gap-2 rounded-xl border p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-sky-500 bg-sky-950/30 shadow-md shadow-sky-950/40"
                      : isCritical
                        ? "border-red-900/40 bg-red-950/10 hover:border-red-500/50 hover:bg-red-950/20"
                        : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  {/* Card Header: Severity Pill + Type + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {isCritical ? (
                          <ShieldAlert className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {alert.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {alert.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      {formatTimestamp(alert.timestampMs).split(", ")[1] || ""}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {alert.description}
                  </p>

                  {/* Footer: Action Cue */}
                  <div className="flex items-center justify-between border-t border-slate-800/50 pt-2 text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatTimestamp(alert.timestampMs)}
                    </span>
                    <span className="flex items-center gap-1 text-sky-400 font-semibold group-hover:underline">
                      <PlayCircle className="h-3 w-3" />
                      Jump Timeline
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {filteredAlerts.length > 150 && (
            <div className="py-3 text-center text-xs text-slate-400">
              Showing 150 of {filteredAlerts.length} total events
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
