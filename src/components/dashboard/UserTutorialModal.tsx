"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HelpCircle,
  X,
  Play,
  Activity,
  ShieldAlert,
  Sparkles,
  Database,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sliders,
  Compass,
} from "lucide-react";

interface Step {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  summary: string;
  points: { label: string; text: string }[];
  actionHint: string;
}

const TUTORIAL_STEPS: Step[] = [
  {
    id: "overview",
    title: "Welcome to Rig State Detector",
    badge: "Step 1 of 5",
    icon: <Compass className="h-5 w-5 text-sky-400" />,
    summary:
      "This application is a real-time digital cockpit for drilling engineers at Pertamina Hulu Rokan (PHR). It translates 249,000+ raw sensor readings into live operational insights.",
    points: [
      {
        label: "Live KPI Strip",
        text: "The top bar displays Total Depth Reached (ft), Drilling ROP (ft/h), Non-Productive Time (NPT), and the live computed Rig State.",
      },
      {
        label: "Automated Rig State",
        text: "The algorithm continuously determines if the rig is actively Drilling (Rotary or Sliding), Tripping pipe, Making a Connection, Circulating mud, or Idle.",
      },
      {
        label: "Offset Well Baseline",
        text: "Charts compare current drilling data against historical safe operating limits for the 8-1/2\" hole section.",
      },
    ],
    actionHint: "Notice the Live Rig State pill in the top navigation bar updating as data plays.",
  },
  {
    id: "playback",
    title: "Interactive Telemetry Playback",
    badge: "Step 2 of 5",
    icon: <Play className="h-5 w-5 text-emerald-400" />,
    summary:
      "Drilling operations unfold over hours and days. The playback controller lets you replay, speed up, or scrub through time seamlessly at 60 FPS.",
    points: [
      {
        label: "Play / Pause",
        text: "Click the Play button on the bar below the header to start telemetry replay.",
      },
      {
        label: "Speed Multiplier",
        text: "Toggle between 1x, 10x, and 60x speed to simulate an entire 24-hour shift in seconds.",
      },
      {
        label: "60 FPS Scrubbing",
        text: "Drag the timeline slider back and forth to inspect past events with zero lag or stutter.",
      },
    ],
    actionHint: "Try clicking the Play button and toggling to 10x speed on the bar.",
  },
  {
    id: "charts",
    title: "4-Quadrant Telemetry & Anomaly Alerts",
    badge: "Step 3 of 5",
    icon: <Activity className="h-5 w-5 text-purple-400" />,
    summary:
      "Four synchronized engineering charts track the drilling physical envelope while an anomaly engine flags high-risk events.",
    points: [
      {
        label: "Depth vs. Time",
        text: "Trajectory tracker with an inverted depth scale comparing Bit Depth (DBTM) to Hole Depth (DMEA).",
      },
      {
        label: "ROP vs. WOB",
        text: "Evaluates rock-cutting speed against weight load on the drill bit compared to historical limits.",
      },
      {
        label: "Torque & Stick-Slip",
        text: "Monitors twisting torque and flashes red when downhole pipe torsional vibration (stick-slip) exceeds safe thresholds.",
      },
      {
        label: "Instant Anomaly Jump",
        text: "Click 'ANOMALY ALERTS' in the header, pick any of the 1,077 events, and the dashboard teleports directly to that minute!",
      },
    ],
    actionHint: "Click ANOMALY ALERTS in the header and select a Stick-Slip event to teleport.",
  },
  {
    id: "assistant",
    title: "AI DDR Assistant (Powered by Groq)",
    badge: "Step 4 of 5",
    icon: <Sparkles className="h-5 w-5 text-amber-400" />,
    summary:
      "Instead of manually reading through 568 official Daily Drilling Reports, our Groq-powered AI Assistant reasons across both coded data and handwritten crew notes.",
    points: [
      {
        label: "Natural Language Queries",
        text: "Ask questions like 'What caused NPT on SEBL_002?' or 'Summarize torque spikes on night shift'.",
      },
      {
        label: "Evidence Citations",
        text: "The AI quotes exact shift times, dates, activity codes, and verbatim quotes from the field comments (COM).",
      },
      {
        label: "Preset One-Click Inquiries",
        text: "Use the prompt chips at the bottom of the chat window for instant operational analysis.",
      },
    ],
    actionHint: "Click AI DDR ASSISTANT in the header or the floating bot icon at the bottom-right.",
  },
  {
    id: "methodology",
    title: "Data Handling & Assumptions",
    badge: "Step 5 of 5",
    icon: <Database className="h-5 w-5 text-sky-400" />,
    summary:
      "The raw sensor feed contained 249K rows with irregular 1.8s sampling and minute-only timestamps. Here is how it was engineered cleanly:",
    points: [
      {
        label: "Minute Bucketing",
        text: "Collapsed into 7,330 discrete minute records, assuming arrival sequence is chronological.",
      },
      {
        label: "Anti-Averaging (Torque StdDev)",
        text: "Preserved torque standard deviation (> 800 kft-lb) to detect stick-slip that simple averaging would destroy.",
      },
      {
        label: "60 FPS Resampling",
        text: "Downsampled to ~250 points on the UI layer for smooth SVG rendering and zero frame drops.",
      },
    ],
    actionHint: "Click 'View Data Methodology & Assumptions' in the footer anytime for technical details.",
  },
];

export function UserTutorialModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const step = TUTORIAL_STEPS[currentStep];

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pertamina-card max-w-2xl w-full my-auto rounded-2xl p-6 sm:p-7 shadow-2xl border border-sky-500/40 bg-[#071424] text-slate-100 flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#004B87] to-[#0099D8] text-white shadow-md">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Dashboard Tour & User Guide</h3>
                <span className="rounded bg-sky-950 border border-sky-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  {step.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive walkthrough for Pertamina Hulu Rokan evaluators
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-between gap-1.5 mb-5 px-1">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep
                  ? "bg-[#0099D8] shadow-sm shadow-sky-500/50"
                  : idx < currentStep
                  ? "bg-emerald-500/60"
                  : "bg-slate-800"
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/80">
              {step.icon}
            </div>
            <h4 className="text-base font-bold text-slate-100">{step.title}</h4>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 border border-slate-800/80 rounded-xl p-3">
            {step.summary}
          </p>

          <div className="space-y-2 text-xs">
            {step.points.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">{pt.label}:</strong>{" "}
                  <span className="text-slate-400">{pt.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Hint Card */}
          <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-3 flex items-center gap-2.5 text-xs text-sky-200">
            <Sliders className="h-4 w-4 text-sky-400 shrink-0" />
            <span>
              <strong>Try it in the app:</strong> {step.actionHint}
            </span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </span>

          {currentStep < TUTORIAL_STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#004B87] to-[#0099D8] px-4 py-2 text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Finish Tour & Explore</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
