import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * High-performance timestamp formatting for 60fps render loop
 */
export function formatTimestamp(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const month = MONTH_NAMES[d.getMonth()] || "";
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hour}:${minute}`;
}

/**
 * Format a short time string (HH:MM)
 */
export function formatTime(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

/**
 * Format a date string (MMM DD)
 */
export function formatDate(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const month = MONTH_NAMES[d.getMonth()] || "";
  const day = d.getDate();
  return `${month} ${day}`;
}

/**
 * O(log N) binary search for the closest minute record in sorted telemetry data.
 * Replaces O(N) linear scans on every tick.
 */
export function findClosestMinute<T extends { timestampMs: number }>(
  data: T[],
  targetMs: number
): T | null {
  if (!data || data.length === 0) return null;
  if (!targetMs || targetMs <= data[0].timestampMs) return data[0];
  if (targetMs >= data[data.length - 1].timestampMs) return data[data.length - 1];

  let low = 0;
  let high = data.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const midVal = data[mid].timestampMs;

    if (midVal === targetMs) return data[mid];
    if (midVal < targetMs) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // After binary search, targetMs lies between data[high] and data[low]
  if (low >= data.length) return data[data.length - 1];
  if (high < 0) return data[0];

  const diffLow = Math.abs(data[low].timestampMs - targetMs);
  const diffHigh = Math.abs(data[high].timestampMs - targetMs);
  return diffLow < diffHigh ? data[low] : data[high];
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Parse the telemetry timestamp format "M/D/YYYY H:MM" to Date
 */
export function parseTelemetryTimestamp(ts: string): Date {
  // Format: "9/9/2026 3:00"
  const [datePart, timePart] = ts.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

/**
 * Lerp between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
