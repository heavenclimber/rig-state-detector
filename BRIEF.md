# Real-Time Drilling Digitalization & AI Assistant
## Evaluation Brief — Digitalization Team Take-Home

**Candidate Track:** Track A (Product / Full-Stack) with Track A Stretch (AI DDR Assistant)  
**Target Field:** Pertamina Hulu Rokan (PHR) SEBL Field (Wells: SEBL_001, SEBL_002)

---

### 1. What Was Built
I developed a production-ready, 60 FPS real-time drilling monitoring dashboard and conversational operations assistant designed to solve everyday operational visibility challenges for drilling engineers:

1. **Automated Operational Rig State Engine:** Formulates 6 physical operational states (`DRILLING_ROTARY`, `DRILLING_SLIDING`, `TRIPPING`, `CONNECTION`, `CIRCULATING`, `STATIC`) calculated automatically from rate of penetration (ROP), surface RPM, weight-on-bit (WOB), pump pressure (SPP), flow rate (MFIA), and block position travel (BPOS).
2. **Interactive 4-Quadrant Telemetry Suite:**
   - *Depth vs. Time:* True trajectory monitoring with an inverted depth scale comparing bit depth (DBTM) to hole depth (DMEA).
   - *ROP vs. WOB Dynamics:* Real-time penetration rate overlaid on drill bit weight with historical offset well operating ceilings.
   - *Torque & Stick-Slip Monitor:* High-frequency torque envelope tracking that flags dangerous downhole torsional oscillations in real time.
   - *Hydraulics & Rotary Overview:* Interactive Standpipe Pressure (SPP), surface RPM, and mud flow balance (MFIA vs. MFOP).
3. **Time-Series Replay & Instant Anomaly Teleportation:** Playback scrubber (1x, 10x, 60x speed) coupled with an Anomaly Drawer containing 1,077 auto-detected events. Clicking any anomaly instantly jumps the playback cursor to that exact moment.
4. **AI DDR Assistant (Powered by Groq LLM):** A natural language co-pilot ingesting all 568 Daily Drilling Reports. It correlates structured operational codes (`ACTIVITY`, `DURATION`, `UNSCHEDULE_EVENT_HRS`) with verbatim narrative field logs (`COM`) to answer operational inquiries (e.g., NPT root causes, night shift torque spikes, equipment breakdowns) with exact citations.

---

### 2. Data Handling & Timestamp Cleaning Assumptions
- **The Raw Challenge:** `realtime_rig_telemetry.csv` contained 249,395 sensor rows sampled irregularly (~every 1.8 seconds), but the timestamp column (`dtsrv`) only provided minute-level precision with no seconds field (~34 to 37 readings shared the same minute).
- **Stated Assumption:** I grouped rows by minute and preserved raw row arrival sequence as chronological.
- **Anti-Averaging (Signal Preservation):** Rather than blindly averaging readings—which would wash away high-frequency vibrations—I computed within-minute standard deviation for torque (`TORQUE_stddev`). This preserved the critical physical vibration signature required to detect downhole stick-slip (`stddev > 800 kft-lb`).
- **Performance Resampling:** The 7,330 sorted minute buckets were resampled to ~250 points on the UI canvas, eliminating SVG rendering bottlenecks and locking in smooth 60 FPS playback.

---

### 3. What Was Deliberately Cut or Left for Stretch & Why
- **Cut — Heavy Streaming Infrastructure (Kafka/Flink):** For a single-well historical evaluation within a 3–4 hour scoping budget, setting up a distributed streaming cluster would have added deployment overhead without improving the user experience. I focused on an optimized, zero-latency in-memory Redux architecture.
- **Cut — Black-Box Machine Learning for Rig States:** Rather than training an opaque deep neural network, I implemented explicit, physics-grounded threshold logic (`ROP > 2`, `RPM > 5`, `WOB > 0`). Drilling engineers require transparent, auditable decision boundaries rather than uninterpretable probability outputs.
- **Completed Stretch — Groq AI DDR Assistant:** I completed the Track A stretch goal by building a semantic retrieval and LLM inference engine using Groq's high-speed inference. Drilling engineers spend hours skimming text field logs; empowering them to query 568 reports conversationally delivers immediate business value.

---

### 4. "If I Had Another Week, I'd..." (3 Bullets)
1. **Real-Time Streaming Pipeline for 50+ Concurrent Rigs:** Replace batch ingestion with an Apache Kafka/MQTT broker ingesting live WITS0/WITSML sensor streams from 50 rigs simultaneously, computing rolling 1-minute aggregations and torque variance in-flight via Redis TimeSeries with WebSocket updates.
2. **Supervised ML for Complex Rig States & Kick/Loss Detection:** Train an XGBoost model on labeled rig states to classify nuanced transitional operations (reaming, back-reaming, washing down) and build early kick/loss circulation warnings comparing delta-flow ($Q_{\text{out}} - Q_{\text{in}}$).
3. **Autonomous RAG Agent with Well History & PHR Standards:** Expand the AI DDR Assistant into a vector database (pgvector) indexing historical offset well dossiers, BHA schematics, and PHR Drilling Standards to automatically generate shift handovers and alert crews when approaching historical stuck-pipe zones.
