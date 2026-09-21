"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import {
  setPlaybackPlaying,
  setPlaybackSpeed,
  setPlaybackCurrentMs,
} from "@/store/uiSlice";
import type { PlaybackSpeed } from "@/types";

/**
 * Manages the real-time playback timer
 * Speed 1 = 1 minute of real data per second
 * Speed 10 = 10 minutes per second
 * Speed 60 = 60 minutes per second (1 hour per second)
 */
export function usePlayback() {
  const dispatch = useDispatch<AppDispatch>();
  const { playback } = useSelector((state: RootState) => state.ui);
  const { data } = useSelector((state: RootState) => state.telemetry);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMs = data.length > 0 ? data[0].timestampMs : 0;
  const endMs = data.length > 0 ? data[data.length - 1].timestampMs : 0;

  const play = useCallback(() => {
    dispatch(setPlaybackPlaying(true));
  }, [dispatch]);

  const pause = useCallback(() => {
    dispatch(setPlaybackPlaying(false));
  }, [dispatch]);

  const toggle = useCallback(() => {
    if (playback.isPlaying) {
      pause();
    } else {
      // If at end, restart
      if (playback.currentMs >= endMs) {
        dispatch(setPlaybackCurrentMs(startMs));
      }
      play();
    }
  }, [playback.isPlaying, playback.currentMs, endMs, startMs, play, pause, dispatch]);

  const setSpeed = useCallback(
    (speed: PlaybackSpeed) => {
      dispatch(setPlaybackSpeed(speed));
    },
    [dispatch]
  );

  const seek = useCallback(
    (ms: number) => {
      dispatch(setPlaybackCurrentMs(ms));
    },
    [dispatch]
  );

  const currentMsRef = useRef(playback.currentMs);
  useEffect(() => {
    currentMsRef.current = playback.currentMs;
  }, [playback.currentMs]);

  // Initialize playback position
  useEffect(() => {
    if (startMs && !playback.currentMs) {
      dispatch(setPlaybackCurrentMs(startMs));
    }
  }, [startMs, playback.currentMs, dispatch]);

  // Stable Playback timer (runs at 5 FPS / 200ms to eliminate CPU lockup and SVG thrashing)
  useEffect(() => {
    if (!playback.isPlaying || !startMs || !endMs) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const intervalMs = 200; // 5 ticks per second is optimal for heavy telemetry charts
    const msPerTick = (playback.speed * 60000 * intervalMs) / 1000;

    intervalRef.current = setInterval(() => {
      const nextMs = Math.min(currentMsRef.current + msPerTick, endMs);
      currentMsRef.current = nextMs;
      dispatch(setPlaybackCurrentMs(nextMs));

      if (nextMs >= endMs) {
        dispatch(setPlaybackPlaying(false));
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playback.isPlaying, playback.speed, startMs, endMs, dispatch]);

  const progress =
    startMs && endMs ? ((playback.currentMs - startMs) / (endMs - startMs)) * 100 : 0;

  return {
    isPlaying: playback.isPlaying,
    speed: playback.speed,
    currentMs: playback.currentMs,
    startMs,
    endMs,
    progress,
    play,
    pause,
    toggle,
    setSpeed,
    seek,
  };
}
