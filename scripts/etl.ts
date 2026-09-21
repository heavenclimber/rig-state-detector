/**
 * ETL Pipeline — Pre-processes raw CSV data into optimized JSON files
 *
 * Reads:
 *   case/realtime_rig_telemetry.csv  (249K rows, 3 header rows)
 *   case/daily_drilling_reports.csv  (568 rows, BOM-encoded)
 *   case/offset_wells_master.csv     (3 rows)
 *
 * Outputs:
 *   public/data/telemetry_1min.json
 *   public/data/alerts.json
 *   public/data/ddr.json
 *   public/data/offset_wells.json
 *   public/data/kpi_summary.json
 *
 * Run: npx tsx scripts/etl.ts
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================
// Types (inline to avoid import path issues with tsx)
// ============================================================

enum RigState {
  DRILLING_ROTARY = "DRILLING_ROTARY",
  DRILLING_SLIDING = "DRILLING_SLIDING",
  TRIPPING = "TRIPPING",
  CONNECTION = "CONNECTION",
  CIRCULATING = "CIRCULATING",
  STATIC = "STATIC",
}

enum AlertSeverity {
  CRITICAL = "CRITICAL",
  WARNING = "WARNING",
}

enum AlertType {
  STICK_SLIP = "STICK_SLIP",
  HIGH_TORQUE = "HIGH_TORQUE",
  WASHOUT = "WASHOUT",
  FLOW_IMBALANCE = "FLOW_IMBALANCE",
  OVER_WOB = "OVER_WOB",
}

interface TelemetryMinute {
  timestamp: string;
  timestampMs: number;
  rowCount: number;
  DBTM: number;
  DMEA: number;
  BPOS: number;
  ROP: number;
  HKLA: number;
  WOB: number;
  RPM: number;
  SPP: number;
  MFOP: number;
  MFIA: number;
  TORQUE_mean: number;
  TORQUE_min: number;
  TORQUE_max: number;
  TORQUE_stddev: number;
  BPOS_range: number;
  state: RigState;
}

interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  timestamp: string;
  timestampMs: number;
  title: string;
  description: string;
  value?: number;
  threshold?: number;
}

// ============================================================
// Paths
// ============================================================

const ROOT = path.resolve(__dirname, "..");
const CASE = path.join(ROOT, "case");
const OUT = path.join(ROOT, "public", "data");

// ============================================================
// Helpers
// ============================================================

function parseTelemetryTimestamp(ts: string): Date {
  const [datePart, timePart] = ts.trim().split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function safeFloat(val: string): number {
  // Handle malformed values like "5.0E" (truncated scientific notation)
  const cleaned = val.trim();
  if (cleaned.endsWith("E") || cleaned.endsWith("e")) {
    return parseFloat(cleaned.slice(0, -1));
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, val) => sum + (val - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function round(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// ============================================================
// 1. Parse Telemetry CSV
// ============================================================

function parseTelemetry(): Map<string, number[][]> {
  console.log("📊 Parsing realtime_rig_telemetry.csv...");
  const raw = fs.readFileSync(path.join(CASE, "realtime_rig_telemetry.csv"), "utf-8");
  const lines = raw.split("\n");

  // Skip 3 header rows (label, code, unit)
  const dataLines = lines.slice(3).filter((l) => l.trim().length > 0);
  console.log(`   ${dataLines.length} data rows found`);

  // Group by minute timestamp
  const buckets = new Map<string, number[][]>();

  for (const line of dataLines) {
    const parts = line.split(",");
    if (parts.length < 12) continue;

    const ts = parts[0].trim();
    const values = [
      safeFloat(parts[1]),  // DBTM
      safeFloat(parts[2]),  // DMEA
      safeFloat(parts[3]),  // BPOS
      safeFloat(parts[4]),  // ROP
      safeFloat(parts[5]),  // HKLA
      safeFloat(parts[6]),  // WOB
      safeFloat(parts[7]),  // TORQUE
      safeFloat(parts[8]),  // RPM
      safeFloat(parts[9]),  // SPP
      safeFloat(parts[10]), // MFOP
      safeFloat(parts[11]), // MFIA
    ];

    if (!buckets.has(ts)) {
      buckets.set(ts, []);
    }
    buckets.get(ts)!.push(values);
  }

  console.log(`   ${buckets.size} unique minute-timestamps`);
  return buckets;
}

// ============================================================
// 2. Classify Rig State
// ============================================================

function classifyState(
  avgROP: number,
  avgRPM: number,
  avgWOB: number,
  avgSPP: number,
  avgMFIA: number,
  bposRange: number
): RigState {
  // Drilling: actively cutting new hole
  if (avgROP > 2 && avgRPM > 5 && avgWOB > 0) {
    return RigState.DRILLING_ROTARY;
  }
  if (avgROP > 2 && avgRPM <= 5 && avgWOB > 0) {
    return RigState.DRILLING_SLIDING;
  }

  // Tripping: pipe moving, no drilling
  if (avgROP <= 2 && bposRange > 3 && avgSPP < 50) {
    return RigState.TRIPPING;
  }

  // Circulating: pumping without drilling
  if (avgROP <= 2 && avgSPP > 100 && avgMFIA > 50 && avgRPM <= 5) {
    return RigState.CIRCULATING;
  }

  // Connection: brief pause with moderate parameters
  if (avgROP <= 2 && bposRange < 3 && avgSPP > 50) {
    return RigState.CONNECTION;
  }

  // Static: nothing happening
  return RigState.STATIC;
}

// ============================================================
// 3. Bucket, Classify, Detect Anomalies
// ============================================================

function processTelemetry(buckets: Map<string, number[][]>): {
  telemetry: TelemetryMinute[];
  alerts: Alert[];
} {
  console.log("⚙️  Bucketing to minute-level and classifying states...");

  const telemetry: TelemetryMinute[] = [];
  const alerts: Alert[] = [];
  let alertId = 0;

  // Sort buckets by timestamp
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => {
    return parseTelemetryTimestamp(a).getTime() - parseTelemetryTimestamp(b).getTime();
  });

  // Load offset wells for threshold comparison
  const offsetWells = parseOffsetWells();
  // Use the 8.5" intermediate section as general reference (most data is in this range)
  const offsetRef = offsetWells.find((o) => o.hole_section.includes("8-1/2")) || offsetWells[0];

  let prevSPP = 0;
  let prevMFIA = 0;

  for (const ts of sortedKeys) {
    const rows = buckets.get(ts)!;
    const date = parseTelemetryTimestamp(ts);
    const timestampMs = date.getTime();

    // Field indices: DBTM=0, DMEA=1, BPOS=2, ROP=3, HKLA=4, WOB=5, TORQUE=6, RPM=7, SPP=8, MFOP=9, MFIA=10
    const col = (idx: number) => rows.map((r) => r[idx]);

    const avgDBTM = round(mean(col(0)));
    const avgDMEA = round(mean(col(1)));
    const avgBPOS = round(mean(col(2)));
    const avgROP = round(mean(col(3)));
    const avgHKLA = round(mean(col(4)));
    const avgWOB = round(mean(col(5)));
    const avgRPM = round(mean(col(7)));
    const avgSPP = round(mean(col(8)));
    const avgMFOP = round(mean(col(9)));
    const avgMFIA = round(mean(col(10)));

    const torques = col(6);
    const torqueMean = round(mean(torques));
    const torqueMin = round(Math.min(...torques));
    const torqueMax = round(Math.max(...torques));
    const torqueStddev = round(stddev(torques));

    const bposValues = col(2);
    const bposRange = round(Math.max(...bposValues) - Math.min(...bposValues));

    const state = classifyState(avgROP, avgRPM, avgWOB, avgSPP, avgMFIA, bposRange);

    const minute: TelemetryMinute = {
      timestamp: ts,
      timestampMs,
      rowCount: rows.length,
      DBTM: avgDBTM,
      DMEA: avgDMEA,
      BPOS: avgBPOS,
      ROP: avgROP,
      HKLA: avgHKLA,
      WOB: avgWOB,
      RPM: avgRPM,
      SPP: avgSPP,
      MFOP: avgMFOP,
      MFIA: avgMFIA,
      TORQUE_mean: torqueMean,
      TORQUE_min: torqueMin,
      TORQUE_max: torqueMax,
      TORQUE_stddev: torqueStddev,
      BPOS_range: bposRange,
      state,
    };

    telemetry.push(minute);

    // --- Anomaly Detection ---

    // Stick-Slip: High TORQUE variance while drilling
    if (
      (state === RigState.DRILLING_ROTARY || state === RigState.DRILLING_SLIDING) &&
      torqueStddev > 800
    ) {
      alerts.push({
        id: `alert-${++alertId}`,
        type: AlertType.STICK_SLIP,
        severity: AlertSeverity.CRITICAL,
        timestamp: ts,
        timestampMs,
        title: "Stick-Slip Detected",
        description: `Torque std dev ${torqueStddev} kft-lb (threshold: 800) at depth ${avgDBTM} ft`,
        value: torqueStddev,
        threshold: 800,
      });
    }

    // High Torque: Approaching offset well max
    if (offsetRef && torqueMean > offsetRef.max_DRL_TORQUE * 0.85) {
      alerts.push({
        id: `alert-${++alertId}`,
        type: AlertType.HIGH_TORQUE,
        severity: AlertSeverity.WARNING,
        timestamp: ts,
        timestampMs,
        title: "High Torque Warning",
        description: `Avg torque ${torqueMean} kft-lb (${round((torqueMean / offsetRef.max_DRL_TORQUE) * 100)}% of offset max ${offsetRef.max_DRL_TORQUE})`,
        value: torqueMean,
        threshold: offsetRef.max_DRL_TORQUE,
      });
    }

    // Washout: SPP dropping while MFIA stable
    if (prevSPP > 0 && avgSPP > 0 && prevMFIA > 0) {
      const sppDropPct = ((prevSPP - avgSPP) / prevSPP) * 100;
      const mfiaChangePct = Math.abs((prevMFIA - avgMFIA) / prevMFIA) * 100;
      if (sppDropPct > 15 && mfiaChangePct < 5) {
        alerts.push({
          id: `alert-${++alertId}`,
          type: AlertType.WASHOUT,
          severity: AlertSeverity.CRITICAL,
          timestamp: ts,
          timestampMs,
          title: "Possible Washout",
          description: `SPP dropped ${round(sppDropPct)}% while flow in stable (±${round(mfiaChangePct)}%)`,
          value: sppDropPct,
          threshold: 15,
        });
      }
    }

    // Flow Imbalance: MFOP deviation while pumping
    if (avgMFIA > 50 && (avgMFOP < 10 || avgMFOP > 50)) {
      alerts.push({
        id: `alert-${++alertId}`,
        type: AlertType.FLOW_IMBALANCE,
        severity: AlertSeverity.WARNING,
        timestamp: ts,
        timestampMs,
        title: "Flow Imbalance",
        description: `Mud flow out ${avgMFOP}% while pumping at ${avgMFIA} gpm`,
        value: avgMFOP,
      });
    }

    // Over-WOB: Exceeding offset well max
    if (offsetRef && avgWOB > offsetRef.max_WOB && avgWOB > 0) {
      alerts.push({
        id: `alert-${++alertId}`,
        type: AlertType.OVER_WOB,
        severity: AlertSeverity.WARNING,
        timestamp: ts,
        timestampMs,
        title: "Over-WOB Warning",
        description: `WOB ${avgWOB} klb exceeds offset max ${offsetRef.max_WOB} klb`,
        value: avgWOB,
        threshold: offsetRef.max_WOB,
      });
    }

    prevSPP = avgSPP;
    prevMFIA = avgMFIA;
  }

  // Post-process: Refine connections (short non-drilling gaps between drilling)
  for (let i = 1; i < telemetry.length - 1; i++) {
    if (
      telemetry[i].state === RigState.STATIC &&
      (telemetry[i - 1].state === RigState.DRILLING_ROTARY ||
        telemetry[i - 1].state === RigState.DRILLING_SLIDING) &&
      (telemetry[i + 1].state === RigState.DRILLING_ROTARY ||
        telemetry[i + 1].state === RigState.DRILLING_SLIDING)
    ) {
      telemetry[i].state = RigState.CONNECTION;
    }
  }

  console.log(`   ${telemetry.length} minute records produced`);
  console.log(`   ${alerts.length} alerts detected`);

  // Count states
  const stateCount: Record<string, number> = {};
  for (const t of telemetry) {
    stateCount[t.state] = (stateCount[t.state] || 0) + 1;
  }
  console.log("   State distribution:", stateCount);

  return { telemetry, alerts };
}

// ============================================================
// 4. Parse DDR
// ============================================================

function parseDDR(): Record<string, unknown>[] {
  console.log("📋 Parsing daily_drilling_reports.csv...");
  const raw = fs.readFileSync(path.join(CASE, "daily_drilling_reports.csv"), "utf-8");

  // Remove BOM
  const clean = raw.replace(/^\ufeff/, "");

  // Parse CSV with multi-line COM field support
  const rows: Record<string, unknown>[] = [];
  const lines = clean.split("\n");
  const headers = parseCSVLine(lines[0]);

  let i = 1;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    // Check if this line has enough fields or if COM spans multiple lines
    let fullLine = line;
    let quoteCount = (fullLine.match(/"/g) || []).length;

    while (quoteCount % 2 !== 0 && i + 1 < lines.length) {
      i++;
      fullLine += "\n" + lines[i];
      quoteCount = (fullLine.match(/"/g) || []).length;
    }

    const values = parseCSVLine(fullLine);
    if (values.length >= headers.length) {
      const row: Record<string, unknown> = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j].trim();
        let val: unknown = (values[j] || "").trim();

        if (key === "DURATION" || key === "DEPTHACT") {
          val = parseFloat(val as string) || 0;
        } else if (key === "UNSCHEDULE_EVENT_HRS") {
          val = (val as string).trim() ? parseFloat(val as string) : null;
        }
        row[key] = val;
      }
      rows.push(row);
    }

    i++;
  }

  console.log(`   ${rows.length} DDR rows parsed`);
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ============================================================
// 5. Parse Offset Wells
// ============================================================

function parseOffsetWells(): {
  well_name: string;
  hole_section: string;
  max_ROP: number;
  max_FLOW_RATE: number;
  max_WOB: number;
  max_SPP: number;
  max_PU_WEIGHT: number;
  max_DRL_TORQUE: number;
}[] {
  console.log("📏 Parsing offset_wells_master.csv...");
  const raw = fs.readFileSync(path.join(CASE, "offset_wells_master.csv"), "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length >= 8) {
      result.push({
        well_name: parts[0].trim(),
        hole_section: parts[1].trim(),
        max_ROP: parseFloat(parts[2]) || 0,
        max_FLOW_RATE: parseFloat(parts[3]) || 0,
        max_WOB: parseFloat(parts[4]) || 0,
        max_SPP: parseFloat(parts[5]) || 0,
        max_PU_WEIGHT: parseFloat(parts[6]) || 0,
        max_DRL_TORQUE: parseFloat(parts[7]) || 0,
      });
    }
  }

  console.log(`   ${result.length} offset well records`);
  return result;
}

// ============================================================
// 6. Compute KPI Summary
// ============================================================

function computeKPIs(
  telemetry: TelemetryMinute[],
  alerts: Alert[],
  ddr: Record<string, unknown>[]
): Record<string, unknown> {
  console.log("📈 Computing KPI summary...");

  const drillingMinutes = telemetry.filter(
    (t) => t.state === RigState.DRILLING_ROTARY || t.state === RigState.DRILLING_SLIDING
  );
  const trippingMinutes = telemetry.filter((t) => t.state === RigState.TRIPPING);
  const connectionMinutes = telemetry.filter((t) => t.state === RigState.CONNECTION);

  const maxDepth = Math.max(...telemetry.map((t) => t.DMEA));
  const avgRopDrilling = drillingMinutes.length > 0 ? round(mean(drillingMinutes.map((t) => t.ROP))) : 0;

  const totalNptHours = ddr.reduce((sum, row) => {
    const npt = row.UNSCHEDULE_EVENT_HRS;
    return sum + (typeof npt === "number" ? npt : 0);
  }, 0);

  const criticalAlerts = alerts.filter((a) => a.severity === AlertSeverity.CRITICAL).length;
  const warningAlerts = alerts.filter((a) => a.severity === AlertSeverity.WARNING).length;

  const kpi = {
    maxDepth: round(maxDepth),
    avgRopDrilling,
    totalNptHours: round(totalNptHours, 1),
    totalDrillingMinutes: drillingMinutes.length,
    totalTrippingMinutes: trippingMinutes.length,
    totalConnectionMinutes: connectionMinutes.length,
    totalStaticMinutes: telemetry.filter((t) => t.state === RigState.STATIC).length,
    totalCirculatingMinutes: telemetry.filter((t) => t.state === RigState.CIRCULATING).length,
    totalAlerts: alerts.length,
    criticalAlerts,
    warningAlerts,
    dateRange: {
      start: telemetry[0]?.timestamp || "",
      end: telemetry[telemetry.length - 1]?.timestamp || "",
      startMs: telemetry[0]?.timestampMs || 0,
      endMs: telemetry[telemetry.length - 1]?.timestampMs || 0,
    },
  };

  console.log(`   Max depth: ${kpi.maxDepth} ft`);
  console.log(`   Avg ROP (drilling): ${kpi.avgRopDrilling} ft/h`);
  console.log(`   NPT hours: ${kpi.totalNptHours}`);
  console.log(`   Alerts: ${kpi.criticalAlerts} critical, ${kpi.warningAlerts} warning`);

  return kpi;
}

// ============================================================
// Main
// ============================================================

function main() {
  console.log("🚀 Starting ETL Pipeline...\n");
  const startTime = Date.now();

  // Ensure output directory exists
  fs.mkdirSync(OUT, { recursive: true });

  // 1. Parse and bucket telemetry
  const buckets = parseTelemetry();
  const { telemetry, alerts } = processTelemetry(buckets);

  // 2. Parse DDR
  const ddr = parseDDR();

  // 3. Parse offset wells
  const offsetWells = parseOffsetWells();

  // 4. Compute KPIs
  const kpis = computeKPIs(telemetry, alerts, ddr);

  // 5. Write outputs
  console.log("\n💾 Writing output JSON files...");

  fs.writeFileSync(path.join(OUT, "telemetry_1min.json"), JSON.stringify(telemetry));
  console.log(
    `   telemetry_1min.json: ${telemetry.length} records (${round(fs.statSync(path.join(OUT, "telemetry_1min.json")).size / 1024)} KB)`
  );

  fs.writeFileSync(path.join(OUT, "alerts.json"), JSON.stringify(alerts));
  console.log(`   alerts.json: ${alerts.length} alerts`);

  fs.writeFileSync(path.join(OUT, "ddr.json"), JSON.stringify(ddr));
  console.log(`   ddr.json: ${ddr.length} rows`);

  fs.writeFileSync(path.join(OUT, "offset_wells.json"), JSON.stringify(offsetWells));
  console.log(`   offset_wells.json: ${offsetWells.length} records`);

  fs.writeFileSync(path.join(OUT, "kpi_summary.json"), JSON.stringify(kpis, null, 2));
  console.log(`   kpi_summary.json`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ ETL complete in ${elapsed}s`);
}

main();
