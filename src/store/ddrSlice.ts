
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { DdrRow } from "@/types";

interface DdrState {
  data: DdrRow[];
  loading: boolean;
  error: string | null;
}

const initialState: DdrState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchDdr = createAsyncThunk("ddr/fetchAll", async () => {
  const res = await axios.get<DdrRow[]>("/data/ddr.json");
  return res.data;
});

export const ddrSlice = createSlice({
  name: "ddr",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDdr.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDdr.fulfilled, (state, action: PayloadAction<DdrRow[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDdr.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load DDR data";
      });
  },
});
