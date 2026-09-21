
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { TelemetryMinute, Alert, OffsetWell, KpiSummary } from "@/types";

interface TelemetryState {
  data: TelemetryMinute[];
  alerts: Alert[];
  offsetWells: OffsetWell[];
  kpiSummary: KpiSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: TelemetryState = {
  data: [],
  alerts: [],
  offsetWells: [],
  kpiSummary: null,
  loading: false,
  error: null,
};

export const fetchTelemetry = createAsyncThunk(
  "telemetry/fetchAll",
  async () => {
    const [telemetryRes, alertsRes, offsetRes, kpiRes] = await Promise.all([
      axios.get<TelemetryMinute[]>("/data/telemetry_1min.json"),
      axios.get<Alert[]>("/data/alerts.json"),
      axios.get<OffsetWell[]>("/data/offset_wells.json"),
      axios.get<KpiSummary>("/data/kpi_summary.json"),
    ]);

    return {
      data: telemetryRes.data,
      alerts: alertsRes.data,
      offsetWells: offsetRes.data,
      kpiSummary: kpiRes.data,
    };
  }
);

export const telemetrySlice = createSlice({
  name: "telemetry",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTelemetry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTelemetry.fulfilled, (state, action: PayloadAction<{
        data: TelemetryMinute[];
        alerts: Alert[];
        offsetWells: OffsetWell[];
        kpiSummary: KpiSummary;
      }>) => {
        state.loading = false;
        state.data = action.payload.data;
        state.alerts = action.payload.alerts;
        state.offsetWells = action.payload.offsetWells;
        state.kpiSummary = action.payload.kpiSummary;
      })
      .addCase(fetchTelemetry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load telemetry data";
      });
  },
});
