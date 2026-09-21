"use client";

import { useSelector } from "react-redux";
import { useMemo } from "react";
import type { RootState } from "@/store/store";
import type { TelemetryMinute } from "@/types";
import { findClosestMinute } from "@/lib/utils";

/**
 * Access telemetry data filtered only by time range.
 * Decoupled from playback ticks so heavy charts do NOT re-evaluate on every tick.
 */
export function useTelemetry() {
  const { data, loading, error } = useSelector((state: RootState) => state.telemetry);
  const timeRange = useSelector((state: RootState) => state.ui.timeRange);

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    if (!timeRange) return data;

    return data.filter(
      (d) => d.timestampMs >= timeRange.startMs && d.timestampMs <= timeRange.endMs
    );
  }, [data, timeRange]);

  return { data: filteredData, allData: data, loading, error };
}

/**
 * Dedicated hook for live indicator components (KpiCards, DashboardHeader).
 * Uses O(log N) binary search instead of O(N) linear scans.
 */
export function useCurrentMinute(): TelemetryMinute | null {
  const data = useSelector((state: RootState) => state.telemetry.data);
  const currentMs = useSelector((state: RootState) => state.ui.playback.currentMs);

  return useMemo(() => {
    if (!data.length) return null;
    if (!currentMs) return data[data.length - 1];
    return findClosestMinute(data, currentMs);
  }, [data, currentMs]);
}
