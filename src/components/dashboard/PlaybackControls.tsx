"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePlayback } from "@/hooks/usePlayback";
import { formatTimestamp } from "@/lib/utils";
import type { PlaybackSpeed } from "@/types";
import { Play, Pause, RotateCcw, FastForward, Clock } from "lucide-react";

const SPEEDS: PlaybackSpeed[] = [1, 10, 60];

export function PlaybackControls() {
  const {
    isPlaying,
    speed,
    currentMs,
    startMs,
    endMs,
    progress,
    toggle,
    setSpeed,
    seek,
  } = usePlayback();

  const [localMs, setLocalMs] = useState<number>(currentMs);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);

  // Synchronize local slider with playback position when user is not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalMs(currentMs);
    }
  }, [currentMs, isDragging]);

  const handleSliderChange = useCallback(
    (val: number) => {
      setLocalMs(val);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        seek(val);
      });
    },
    [seek]
  );

  const displayMs = isDragging ? localMs : currentMs;
  const sliderProgress =
    startMs && endMs ? ((displayMs - startMs) / (endMs - startMs)) * 100 : progress;

  if (!startMs || !endMs) return null;

  return (
    <div className="sticky top-16 z-30 w-full border-b border-slate-800/80 bg-[#07111E]/95 backdrop-blur-md shadow-md">
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Play / Pause & Current Time Pill */}
        <div className="flex items-center gap-3">
          <button
            id="playback-toggle-btn"
            onClick={toggle}
            aria-label={isPlaying ? "Pause telemetry replay" : "Play telemetry replay"}
            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white transition-all duration-150 active:scale-95 shadow-md ${
              isPlaying
                ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-950/60 hover:from-red-500 hover:to-rose-400 ring-2 ring-red-500/40"
                : "bg-gradient-to-r from-[#004B87] to-[#0099D8] shadow-sky-950/60 hover:from-[#005da8] hover:to-[#17a9e6] ring-1 ring-sky-400/30"
            }`}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-white" />
            ) : (
              <Play className="h-4 w-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => seek(startMs)}
            title="Reset playback to beginning"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Current Time Display */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3.5 py-1.5 shadow-inner">
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Playback Cursor
              </span>
              <span className="font-mono text-xs font-bold text-slate-100">
                {displayMs ? formatTimestamp(displayMs) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Slider with Start/End Bounds */}
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <span className="hidden font-mono text-[11px] text-slate-400 sm:inline-block">
            {formatTimestamp(startMs)}
          </span>

          <div className="relative flex-1 flex items-center">
            {/* Active filled track */}
            <div
              className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-[#004B87] to-[#0099D8] shadow-sm"
              style={{ width: `${sliderProgress}%` }}
            />
            <input
              type="range"
              min={startMs}
              max={endMs}
              value={displayMs || startMs}
              onPointerDown={() => setIsDragging(true)}
              onPointerUp={() => {
                setIsDragging(false);
                seek(localMs);
              }}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="playback-slider"
              aria-label="Playback timeline scrubber"
            />
          </div>

          <span className="hidden font-mono text-[11px] text-slate-400 sm:inline-block">
            {formatTimestamp(endMs)}
          </span>
        </div>

        {/* Speed Multiplier Segmented Control */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <FastForward className="h-3 w-3 text-slate-400" />
            Speed
          </span>

          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/70 p-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                  speed === s
                    ? "bg-[#0099D8] text-white shadow-sm shadow-sky-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
