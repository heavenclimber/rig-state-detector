# Real-Time Rig State Detector & AI DDR Assistant
### Pertamina Hulu Rokan (PHR) — Drilling Engineering Digitalization Take-Home

An enterprise-grade, high-performance web application visualizing real-time drilling telemetry, detecting operational rig states, flagging downhole anomalies (stick-slip, torque spikes, washouts), and providing an AI-powered conversational assistant over Daily Drilling Reports (DDR).

---

## 1. How Irregularly Sampled Timestamps Were Cleaned & Handled

### The Problem in the Raw Feed:
- `realtime_rig_telemetry.csv` contains **249,395 raw sensor readings** sampled irregularly (~1.5–2 seconds apart, averaging ~34–37 readings per minute).
- **The timestamp column (`dtsrv`) only carries minute-level precision** (`M/D/YYYY H:MM`, e.g., `9/9/2026 3:00`), with no seconds column.
- There are 3 metadata header rows (label, code, unit) that must be skipped before parsing.

### Our Stated Handling Assumptions & Resampling Pipeline:
1. **Minute Bucketing & Ordering Assumption:**
   - Raw records are grouped by their discrete minute timestamp into 7,330 minute buckets.
   - We assume the within-minute row sequence in the raw feed reflects true chronological arrival order.
2. **Preserving Critical High-Frequency Signals (Anti-Averaging):**
   - Naive averaging of drilling telemetry washes away key physical dynamics.
   - **Torque (Stick-Slip Signal):** Rather than only calculating `TORQUE_mean`, our ETL extracts `TORQUE_min`, `TORQUE_max`, and crucially **`TORQUE_stddev`** across the within-minute readings. Severe stick-slip is characterized by rapid torque oscillations; preserving standard deviation allows our anomaly detector to flag critical stick-slip events (`TORQUE_stddev > 800 kft-lb`) that simple smoothing would hide.
   - **Block Position (`BPOS_range`):** Calculating $\max(\text{BPOS}) - \min(\text{BPOS})$ within the minute allows clear differentiation between active pipe movement (`TRIPPING`), brief pauses (`CONNECTION`), and stationary periods (`STATIC`).
   - Slow-changing hydraulics (`SPP`, `MFIA`, `MFOP`) and progress metrics (`DBTM`, `DMEA`, `ROP`, `WOB`, `RPM`) are resampled using arithmetic means.
3. **Monotonic Temporal Sorting:**
   - Minute timestamps are converted into Unix epoch milliseconds (`timestampMs`) and sorted chronologically, guaranteeing a continuous, non-backtracking time axis for playback and charting.
4. **Adaptive Frontend Downsampling:**
   - For the 4 interactive Recharts telemetry plots, the 7,330 minutes are dynamically downsampled to ~250 points, rendering at a smooth 60 FPS without layout lag.

---

## 2. Core Features Built

1. **Operational Rig State Classifier:**
   - Rules-based classification engine computing 6 operational states:
     - `DRILLING_ROTARY`: Bit on bottom, active ROP > 2 ft/h, surface RPM > 5, positive WOB.
     - `DRILLING_SLIDING`: Active ROP > 2 ft/h, RPM ≤ 5, positive WOB (mud motor directional drilling).
     - `TRIPPING`: ROP ≤ 2 ft/h, BPOS range > 3 ft, pumps off (SPP < 50 psi).
     - `CONNECTION`: Brief pause adding pipe joints (ROP ≤ 2 ft/h, low BPOS travel, pumps active).
     - `CIRCULATING`: Pumping mud without drilling (SPP > 100 psi, flow in > 50 gpm, RPM ≤ 5).
     - `STATIC`: Rig idle / standby.
2. **Interactive Telemetry Dashboard:**
   - **Depth vs. Time:** Progress curve with inverted depth axis (DBTM vs DMEA).
   - **ROP vs. WOB Dynamics:** Dual-axis chart with offset well baseline envelopes.
   - **Torque & Stick-Slip Monitor:** Real-time torque mean, envelope, and stick-slip highlight markers.
   - **Multi-Parameter Hydraulics & Rotary:** Standpipe pressure (SPP), rotary RPM, mud flow in (MFIA), and mud flow out (MFOP).
   - **Interactive Playback Controller:** Real-time scrubbing, speed controls (1x, 10x, 60x), and live KPI tracking.
   - **Sliding Anomaly Drawer:** 1,077 categorized anomalies (Critical & Warning) with 1-click timeline jump.
3. **AI DDR Assistant (Track A Stretch — Powered by Groq):**
   - Natural language conversational agent powered by `openai/gpt-oss-120b` via Groq.
   - Ingests and reasons over **568 Daily Drilling Reports**, correlating coded operations (`ACTIVITY`, `DURATION`, `UNSCHEDULE_EVENT_HRS`) with free-text comments (`COM`).
   - Capable of answering questions like:
     - *"What caused NPT on SEBL_002?"*
     - *"Summarize torque spikes on night shift"*
     - *"Compare SEBL_001 vs SEBL_002 drilling performance"*

---

## 3. "If I Had Another Week, I'd..." (3 Bullets)

1. **Real-Time Event Streaming for 50+ Concurrent Rigs:**
   - Replace file-based ETL with an Apache Kafka / MQTT ingestion backbone processing live WITS0/WITSML streams from 50 rigs simultaneously.
   - Implement streaming windowed aggregations in Apache Flink or Redis Timeseries with WebSocket / SSE push to the dashboard.
2. **Supervised ML for Complex Rig States & Kick / Loss Early Detection:**
   - Train an XGBoost / 1D-CNN model on labeled rig states to classify nuanced operations (reaming, back-reaming, washing down).
   - Build early kick and lost-circulation detectors comparing mud flow in ($Q_{\text{in}}$) vs flow out ($Q_{\text{out}}$) with automated delta alarms.
3. **Enterprise RAG Knowledge Base with Well History & PHR Standards:**
   - Embed historic offset well dossiers, BHA schematics, and PHR standard operating procedures (SOPs) into a vector database (e.g. pgvector / Qdrant).
   - Automatically generate end-of-well performance summaries and predictive bit wear alerts when approaching known high-vibration formations.

---

## 4. Local Setup Instructions

### Prerequisites
- Node.js 18+ or 20+
- npm

### Installation & Running
```bash
# 1. Clone repository and install dependencies
npm install

# 2. Configure environment (Groq API Key for AI Assistant)
# Add your key to .env.local:
echo "GROQ_API_KEY=your_groq_key_here" > .env.local

# 3. Run ETL (pre-processes CSV data into optimized public/data JSON files)
npm run etl

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
