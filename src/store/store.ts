import { configureStore } from "@reduxjs/toolkit";
import { telemetrySlice } from "./telemetrySlice";
import { ddrSlice } from "./ddrSlice";
import { uiSlice } from "./uiSlice";

export const store = configureStore({
  reducer: {
    telemetry: telemetrySlice.reducer,
    ddr: ddrSlice.reducer,
    ui: uiSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
