# 3-Minute Video Walkthrough Script (Loom / Vimeo)
### Real-Time Drilling Digitalization & AI Assistant — Pertamina Hulu Rokan (PHR)

> **Time Limit:** Exactly 3 minutes (180 seconds).  
> **Preparation:** Have the dashboard open at `http://localhost:3000` with the AI Assistant ready.

---

### MINUTE 1 (0:00 – 1:00): The App Running Live
**Screen:** Main Dashboard view (`http://localhost:3000`)

- **[0:00 – 0:15] Hook & Overview:**
  > *"Hello everyone! Today I’m demonstrating the Real-Time Rig State Detector and AI DDR Assistant built for Pertamina Hulu Rokan’s SEBL field operations. Drilling rigs cost tens of thousands of dollars a day, and this digital cockpit gives drilling engineers instant, 60-FPS operational visibility."*

- **[0:15 – 0:35] Live Telemetry & Playback:**
  *(Action: Click the **Play** button on the playback bar, switch speed to **10x**, then scrub the timeline slider.)*
  > *"Across the top, we track live KPIs—total depth, active rotary ROP, and the current Rig State, which is computed automatically from sensor telemetry without human logging. In the main analytical grid, we monitor Depth vs. Time on an inverted scale, ROP vs. WOB against historical offset well ceilings, high-frequency Torque dynamics, and hydraulics."*

- **[0:35 – 0:50] Anomaly Jump:**
  *(Action: Click **ANOMALY ALERTS** in the header. Click the first Critical **Stick-Slip Detected** card.)*
  > *"Our anomaly engine continuously flags risks. For instance, clicking this critical Stick-Slip alert instantly teleports the timeline to that exact minute, highlighting the dangerous torque spike on the chart so engineers can investigate what happened."*

- **[0:50 – 1:00] AI Assistant Teaser:**
  *(Action: Click the **AI DDR ASSISTANT** button to open the chat window.)*
  > *"Down here, we also have our AI DDR Assistant powered by Groq, allowing engineers to ask questions in plain English across hundreds of operational shift reports."*

---

### MINUTE 2 (1:00 – 2:00): Architecture & Data-Flow Decisions
**Screen:** Briefly show the AI Assistant answering a question, then highlight the data footer.

- **[1:00 – 1:30] Irregular Timestamps & Anti-Averaging:**
  *(Action: Hover over or point to the footer: `Telemetry Feed: SEBL_001`)*
  > *"Let’s talk about data handling. The raw telemetry feed was messy: 249,000 readings sampled every ~1.8 seconds, but the timestamp column only had minute precision, meaning ~35 rows shared the exact same minute.*
  >
  > *Rather than naively averaging everything—which would wash away the physical vibration signal—our ETL grouped records by minute while preserving within-minute arrival order. Crucially, for Torque, we calculated the within-minute standard deviation (`stddev`). When torque standard deviation exceeds 800 kft-lb, that’s our physical trigger for downhole stick-slip."*

- **[1:30 – 2:00] AI Assistant Reasoning:**
  *(Action: Click the preset button: **"What caused NPT on SEBL_002?"** in the AI Assistant.)*
  > *"On the backend, our Next.js API route interfaces with Groq's high-speed Llama/GPT inference engine. It performs semantic retrieval over all 568 Daily Drilling Reports, correlating structured codes with free-text crew comments. As you can see, it correctly identifies the 25 hours of unscheduled downtime on SEBL_002 caused by the Night Trip safety policy during heavy rain."*

---

### MINUTE 3 (2:00 – 3:00): Scaling for 50 Rigs in Production
**Screen:** Return to the full dashboard view.

- **[2:00 – 2:30] Streaming Architecture:**
  > *"To scale this solution for 50 rigs streaming simultaneously in production, I would make three architectural shifts:*
  >
  > *First, replace batch file ingestion with an event-driven streaming pipeline. We’d ingest live WITS0 and WITSML feeds into an Apache Kafka or MQTT broker, using Apache Flink or Redis TimeSeries to compute rolling 1-minute windowed aggregations and torque variance in-flight, pushing updates to clients via WebSockets."*

- **[2:30 – 2:50] Machine Learning & Proactive Warnings:**
  > *"Second, upgrade the rule-based classifier to a lightweight supervised ML model (like XGBoost) trained on historical rig states to identify nuanced transitions like reaming and washing down, while adding automated delta-flow algorithms for early kick and lost-circulation warnings."*

- **[2:50 – 3:00] Conclusion:**
  > *"Third, expand our AI Assistant into an enterprise vector RAG database containing offset well dossiers and PHR drilling standards. Thank you, and I look forward to walking through our technical choices in the interview!"*
