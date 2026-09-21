
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PlaybackSpeed, TimeRange } from "@/types";

interface UiState {
  timeRange: TimeRange | null;
  playback: {
    isPlaying: boolean;
    speed: PlaybackSpeed;
    currentMs: number;
  };
  selectedAlertId: string | null;
  sidebarOpen: boolean;
  assistantOpen: boolean;
}

const initialState: UiState = {
  timeRange: null,
  playback: {
    isPlaying: false,
    speed: 10,
    currentMs: 0,
  },
  selectedAlertId: null,
  sidebarOpen: false,
  assistantOpen: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTimeRange(state, action: PayloadAction<TimeRange | null>) {
      state.timeRange = action.payload;
    },
    setPlaybackPlaying(state, action: PayloadAction<boolean>) {
      state.playback.isPlaying = action.payload;
    },
    setPlaybackSpeed(state, action: PayloadAction<PlaybackSpeed>) {
      state.playback.speed = action.payload;
    },
    setPlaybackCurrentMs(state, action: PayloadAction<number>) {
      state.playback.currentMs = action.payload;
    },
    setSelectedAlertId(state, action: PayloadAction<string | null>) {
      state.selectedAlertId = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleAssistant(state) {
      state.assistantOpen = !state.assistantOpen;
    },
    setAssistantOpen(state, action: PayloadAction<boolean>) {
      state.assistantOpen = action.payload;
    },
  },
});

export const {
  setTimeRange,
  setPlaybackPlaying,
  setPlaybackSpeed,
  setPlaybackCurrentMs,
  setSelectedAlertId,
  toggleSidebar,
  setSidebarOpen,
  toggleAssistant,
  setAssistantOpen,
} = uiSlice.actions;
