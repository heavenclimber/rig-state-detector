// ============================================================
// Core Data Types for Rig State Detector Dashboard
// ============================================================

// --- Raw Telemetry (after parsing CSV) ---
export interface RawTelemetryRow {
  dtsrv: string;       // Timestamp string "M/D/YYYY H:MM"
  DBTM: number;        // Bit Depth (ft)
  DMEA: number;        // Hole Depth (ft)
  BPOS: number;        // Block Position (ft)
  ROP: number;         // Rate of Penetration (ft/h)
  HKLA: number;        // Hookload (klb)
  WOB: number;         // Weight on Bit (klb)
  TORQUE: number;      // Rotary Torque (kft-lb)
  RPM: number;         // Surface RPM
  SPP: number;         // Standpipe Pressure (psi)
  MFOP: number;        // Mud Flow Out (%)
  MFIA: number;        // Mud Flow In (gpm)
}

// --- Minute-Bucketed Telemetry (ETL output) ---
export interface TelemetryMinute {
  timestamp: string;        // ISO string or formatted minute
  timestampMs: number;      // Unix ms for sorting/playback
  rowCount: number;         // Number of raw rows in this minute

  // Means
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

  // Torque (preserved for stick-slip detection)
  TORQUE_mean: number;
  TORQUE_min: number;
  TORQUE_max: number;
  TORQUE_stddev: number;

  // BPOS range (for state detection)
  BPOS_range: number;

  // Computed rig state
  state: RigState;
}

// --- Rig States ---
export enum RigState {
  DRILLING_ROTARY = 'DRILLING_ROTARY',
  DRILLING_SLIDING = 'DRILLING_SLIDING',
  TRIPPING = 'TRIPPING',
  CONNECTION = 'CONNECTION',
  CIRCULATING = 'CIRCULATING',
  STATIC = 'STATIC',
}

export const RIG_STATE_CONFIG: Record<RigState, { label: string; color: string; description: string }> = {
  [RigState.DRILLING_ROTARY]: {
    label: 'Drilling (Rotary)',
    color: '#00A651',
    description: 'Bit on bottom, actively cutting new hole with surface rotation',
  },
  [RigState.DRILLING_SLIDING]: {
    label: 'Drilling (Sliding)',
    color: '#0099D8',
    description: 'Directional drilling without surface rotation (mud motor)',
  },
  [RigState.TRIPPING]: {
    label: 'Tripping',
    color: '#004B87',
    description: 'Pipe being run in or pulled out of hole',
  },
  [RigState.CONNECTION]: {
    label: 'Connection',
    color: '#F5A623',
    description: 'Adding/removing a joint of pipe — brief planned pause',
  },
  [RigState.CIRCULATING]: {
    label: 'Circulating',
    color: '#9B59B6',
    description: 'Pumping mud without drilling or rotating',
  },
  [RigState.STATIC]: {
    label: 'Idle',
    color: '#8899AA',
    description: 'No rotation, no pumping, no movement',
  },
};

// --- Anomaly Alerts ---
export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export enum AlertType {
  STICK_SLIP = 'STICK_SLIP',
  HIGH_TORQUE = 'HIGH_TORQUE',
  WASHOUT = 'WASHOUT',
  FLOW_IMBALANCE = 'FLOW_IMBALANCE',
  OVER_WOB = 'OVER_WOB',
}

export interface Alert {
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

export const ALERT_TYPE_CONFIG: Record<AlertType, { label: string; icon: string }> = {
  [AlertType.STICK_SLIP]: { label: 'Stick-Slip', icon: '⚡' },
  [AlertType.HIGH_TORQUE]: { label: 'High Torque', icon: '🔧' },
  [AlertType.WASHOUT]: { label: 'Washout', icon: '💧' },
  [AlertType.FLOW_IMBALANCE]: { label: 'Flow Imbalance', icon: '🌊' },
  [AlertType.OVER_WOB]: { label: 'Over-WOB', icon: '⚠️' },
};

// --- DDR (Daily Drilling Report) ---
export interface DdrRow {
  FIELDNAME: string;
  WELLIDE: string;
  RIGNO: string;
  DTTMSTART: string;
  DTTMSPUD: string;
  DTTMSTARTCALC: string;
  WELLPHASE: string;
  PHASE1: string;
  PHASE2: string;
  ACTIVITY: string;
  DURATION: number;
  UNSCHEDULE_EVENT_HRS: number | null;
  WBORESZACT: string;
  DEPTHACT: number;
  COM: string;
}

// --- Offset Well Reference ---
export interface OffsetWell {
  well_name: string;
  hole_section: string;
  max_ROP: number;
  max_FLOW_RATE: number;
  max_WOB: number;
  max_SPP: number;
  max_PU_WEIGHT: number;
  max_DRL_TORQUE: number;
}

// --- KPI Summary ---
export interface KpiSummary {
  totalDepth: number;
  maxDepth: number;
  avgRopDrilling: number;
  totalNptHours: number;
  totalDrillingMinutes: number;
  totalTrippingMinutes: number;
  totalConnectionMinutes: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  dateRange: { start: string; end: string };
}

// --- UI State ---
export interface TimeRange {
  startMs: number;
  endMs: number;
}

export type PlaybackSpeed = 1 | 10 | 60;

export interface PlaybackState {
  isPlaying: boolean;
  speed: PlaybackSpeed;
  currentMs: number;
}
