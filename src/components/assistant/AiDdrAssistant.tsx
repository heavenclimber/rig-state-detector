"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { toggleAssistant, setAssistantOpen } from "@/store/uiSlice";
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface Citation {
  well: string;
  date: string;
  activity: string;
  npt: number | null;
  snippet: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    title: "NPT on SEBL_002",
    prompt: "What caused the primary Non-Productive Time (NPT) on well SEBL_002?",
    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
  },
  {
    title: "Torque Spikes on Night Shift",
    prompt: "Summarize torque spikes and stick-slip oscillations during the night shifts (00:00 - 05:00).",
    icon: <Zap className="h-3.5 w-3.5 text-purple-400" />,
  },
  {
    title: "Equipment Failures & Leaks",
    prompt: "List all equipment breakdown events (e.g. mud pump gate valve leaks, TDS goose neck) that led to unscheduled downtime.",
    icon: <BookOpen className="h-3.5 w-3.5 text-sky-400" />,
  },
  {
    title: "SEBL_001 vs SEBL_002 Comparison",
    prompt: "Compare drilling performance, total NPT, and hole phase progress between SEBL_001 and SEBL_002.",
    icon: <Sparkles className="h-3.5 w-3.5 text-emerald-400" />,
  },
];

export function AiDdrAssistant() {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector((state: RootState) => state.ui.assistantOpen);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "**Hello! I am your AI DDR Assistant powered by Groq.**\n\nI can analyze all 568 official Daily Drilling Reports across **SEBL_001** and **SEBL_002**, correlating coded fields (`ACTIVITY`, `DURATION`, `UNSCHEDULE_EVENT_HRS`) with verbatim operational comments (`COM`).\n\nAsk me anything or choose a question below:",
      timestamp: "Ready",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedWell, setSelectedWell] = useState<"ALL" | "SEBL_001" | "SEBL_002">("ALL");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const queryText = (textToSend ?? input).trim();
    if (!queryText || loading) return;

    const userMessage: Message = {
      id: String(Date.now()),
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          wellFilter: selectedWell,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to query AI Assistant");
      }

      const assistantMessage: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: data.reply,
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          content: `⚠️ **Error querying DDR Assistant:** ${err.message || "Network error. Check Groq API key."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Chat history cleared. How can I assist with SEBL drilling operations today?",
        timestamp: "Ready",
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button at bottom-right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="ai-assistant-fab"
          onClick={() => dispatch(toggleAssistant())}
          aria-label="Toggle AI DDR Assistant"
          className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#004B87] via-[#0066B3] to-[#0099D8] text-white shadow-2xl shadow-sky-900/60 ring-2 ring-sky-400/40 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <Bot className="h-6 w-6 group-hover:rotate-6 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#050B14]"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[620px] w-[95vw] max-w-[500px] flex-col overflow-hidden rounded-2xl border border-sky-500/30 bg-[#071322]/98 shadow-2xl shadow-sky-950/80 backdrop-blur-xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#091A2F] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#004B87] to-[#0099D8] text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-wide text-white">
                    AI DDR ASSISTANT
                  </h3>
                  <span className="rounded bg-sky-950 border border-sky-500/40 px-1.5 py-0.2 text-[10px] font-mono text-sky-300">
                    Groq 120B
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Natural language reasoning over 568 DDR logs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={clearChat}
                title="Reset conversation"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => dispatch(setAssistantOpen(false))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scope Filter Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/60 bg-[#06101D] px-4 py-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-400">Well Scope:</span>
            <div className="flex items-center gap-1">
              {(["ALL", "SEBL_001", "SEBL_002"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWell(w)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                    selectedWell === w
                      ? "bg-[#0099D8] text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col gap-1.5 ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                  <span>{m.role === "user" ? "Drilling Engineer" : "PHR AI Specialist"}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-md ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-[#004B87] to-[#0077B6] text-white"
                      : "border border-slate-800 bg-slate-900/90 text-slate-200"
                  }`}
                >
                  {/* Message body with formatted markdown lines */}
                  <div className="space-y-1.5 leading-relaxed whitespace-pre-line">
                    {m.content}
                  </div>

                  {/* Citations Box if present */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 border-t border-slate-800 pt-2.5 space-y-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                        <BookOpen className="h-3 w-3" />
                        Retrieved DDR Evidence ({m.citations.length} sources)
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {m.citations.map((c, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-2 text-[11px]"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                              <span className="font-bold text-sky-300">
                                {c.well} • {c.activity}
                              </span>
                              <span>{c.date}</span>
                            </div>
                            <p className="text-slate-400 italic line-clamp-2">
                              &ldquo;{c.snippet}&rdquo;
                            </p>
                            {c.npt && c.npt > 0 ? (
                              <span className="mt-1 inline-block rounded bg-red-950/80 border border-red-500/30 px-1.5 py-0.2 text-[9px] font-bold text-red-400">
                                NPT: {c.npt} hrs
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs px-2 py-1">
                <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                <span className="italic">Reasoning over DDR logs with Groq 120B...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Buttons */}
          {messages.length <= 2 && (
            <div className="border-t border-slate-800/60 bg-[#061120] p-2.5">
              <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 px-1">
                Suggested Operational Inquiries:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(p.prompt)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800/90 bg-slate-900/60 p-2 text-left text-[11px] text-slate-300 hover:border-sky-500/40 hover:bg-sky-950/30 hover:text-white transition-all"
                  >
                    {p.icon}
                    <span className="truncate">{p.title}</span>
                    <ChevronRight className="h-3 w-3 ml-auto text-slate-400 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="border-t border-slate-800/80 bg-[#081525] p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-1.5 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about NPT, torque spikes, mud pump leaks, shifts..."
                disabled={loading}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0099D8] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-400 active:scale-95 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
