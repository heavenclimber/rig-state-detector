"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useCurrentMinute } from "@/hooks/useTelemetry";
import { formatNumber } from "@/lib/utils";
import { RIG_STATE_CONFIG } from "@/types";
import { Gauge, Zap, AlertTriangle, Activity, Target } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  accentColor: string;
  subtitle?: string;
  badge?: string;
}

function KpiCard({
  label,
  value,
  unit,
  icon,
  accentColor,
  subtitle,
  badge,
}: KpiCardProps) {
  return (
    <div className="pertamina-card group relative overflow-hidden rounded-2xl p-4.5 sm:p-5 transition-all duration-200">
      {/* Top Accent Gradient Bar */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] opacity-75 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />

      {/* Header Row: Label + Icon */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900/60 shadow-sm transition-transform group-hover:scale-105"
          style={{ color: accentColor }}
        >
          {icon}
        </div>
      </div>

      {/* Metric Value + Unit */}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className="font-mono text-2xl sm:text-3xl font-black tracking-tight"
          style={{ color: accentColor }}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs font-semibold text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Subtitle / Context Metadata */}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
        {subtitle && (
          <span className="truncate text-slate-400 font-medium">
            {subtitle}
          </span>
        )}
        {badge && (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export function KpiCards() {
  const kpi = useSelector((state: RootState) => state.telemetry.kpiSummary);
  const currentMinute = useCurrentMinute();
  const alerts = useSelector((state: RootState) => state.telemetry.alerts);

  if (!kpi) return null;

  const currentState = currentMinute ? RIG_STATE_CONFIG[currentMinute.state] : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      {/* Card 1: Max Depth */}
      <KpiCard
        label="Total Depth Reached"
        value={formatNumber(kpi.maxDepth, 0)}
        unit="ft"
        icon={<Target className="h-4 w-4" />}
        accentColor="#0099D8"
        subtitle="DMEA True Depth"
        badge="Bit Reached"
      />

      {/* Card 2: Avg ROP */}
      <KpiCard
        label="Avg ROP (Drilling)"
        value={formatNumber(kpi.avgRopDrilling, 1)}
        unit="ft/h"
        icon={<Zap className="h-4 w-4" />}
        accentColor="#00A651"
        subtitle={`${kpi.totalDrillingMinutes} min active rotary`}
        badge="Efficiency"
      />

      {/* Card 3: NPT Hours */}
      <KpiCard
        label="Non-Productive Time"
        value={formatNumber(kpi.totalNptHours, 1)}
        unit="hrs"
        icon={<AlertTriangle className="h-4 w-4" />}
        accentColor="#ED1C24"
        subtitle="Unscheduled downtime"
        badge="NPT Event"
      />

      {/* Card 4: Current State */}
      <KpiCard
        label="Current Rig State"
        value={currentState?.label || "IDLE"}
        unit=""
        icon={<Activity className="h-4 w-4" />}
        accentColor={currentState?.color || "#94A3B8"}
        subtitle={
          currentMinute
            ? `Bit: ${formatNumber(currentMinute.DBTM, 0)} ft`
            : "Telemetry standby"
        }
        badge="Live State"
      />

      {/* Card 5: Total Active Alerts */}
      <KpiCard
        label="Active Alerts"
        value={String(alerts.length)}
        unit="events"
        icon={<Gauge className="h-4 w-4" />}
        accentColor={kpi.criticalAlerts > 0 ? "#ED1C24" : "#F59E0B"}
        subtitle={`${kpi.criticalAlerts} Critical · ${kpi.warningAlerts} Warning`}
        badge={kpi.criticalAlerts > 0 ? "Critical" : "Nominal"}
      />
    </div>
  );
}
