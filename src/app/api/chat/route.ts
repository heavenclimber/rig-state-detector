import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { DdrRow } from "@/types";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

let cachedDdr: DdrRow[] | null = null;

function loadDdrData(): DdrRow[] {
  if (cachedDdr) return cachedDdr;
  try {
    const filePath = path.join(process.cwd(), "public", "data", "ddr.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    cachedDdr = JSON.parse(raw);
    return cachedDdr || [];
  } catch (err) {
    console.error("Failed to load DDR data:", err);
    return [];
  }
}

// Compute high-level statistics for prompt context
function computeStats(ddr: DdrRow[]) {
  const byWell: Record<string, { totalRows: number; totalNpt: number; nptReasons: Record<string, number> }> = {};

  for (const row of ddr) {
    if (!byWell[row.WELLIDE]) {
      byWell[row.WELLIDE] = { totalRows: 0, totalNpt: 0, nptReasons: {} };
    }
    byWell[row.WELLIDE].totalRows++;

    if (row.UNSCHEDULE_EVENT_HRS && row.UNSCHEDULE_EVENT_HRS > 0) {
      byWell[row.WELLIDE].totalNpt += row.UNSCHEDULE_EVENT_HRS;
      const act = row.ACTIVITY || "OTHER";
      byWell[row.WELLIDE].nptReasons[act] = (byWell[row.WELLIDE].nptReasons[act] || 0) + row.UNSCHEDULE_EVENT_HRS;
    }
  }

  return byWell;
}

// Retrieve the most relevant DDR log entries for a given user query
function retrieveRelevantDdr(ddr: DdrRow[], query: string, wellFilter?: string): DdrRow[] {
  const q = query.toLowerCase();
  const queryTerms = q.split(/\s+/).filter((t) => t.length > 2);

  const isNptQuery = /npt|downtime|unscheduled|suspend|delay|trouble|repair|leak|damage|stuck/i.test(q);
  const isTorqueQuery = /torque|twist|stick|slip|drag|rotat/i.test(q);
  const isNightQuery = /night|after midnight|dark|shift|00:00|05:00|daylight/i.test(q);
  const targetSebl1 = /sebl[-_ ]*0*1\b|sebl[-_ ]*001/i.test(q);
  const targetSebl2 = /sebl[-_ ]*0*2\b|sebl[-_ ]*002/i.test(q);

  const scored = ddr.map((row) => {
    let score = 0;
    const text = `${row.WELLIDE} ${row.ACTIVITY} ${row.WELLPHASE} ${row.PHASE1} ${row.PHASE2} ${row.COM}`.toLowerCase();

    // Well match boost
    if (wellFilter && wellFilter !== "ALL") {
      if (row.WELLIDE === wellFilter) score += 20;
      else score -= 30;
    } else if (targetSebl1 && row.WELLIDE === "SEBL_001") {
      score += 25;
    } else if (targetSebl2 && row.WELLIDE === "SEBL_002") {
      score += 25;
    }

    // NPT queries
    if (isNptQuery && row.UNSCHEDULE_EVENT_HRS && row.UNSCHEDULE_EVENT_HRS > 0) {
      score += 40 + Math.min(row.UNSCHEDULE_EVENT_HRS * 2, 20);
      if (row.ACTIVITY === "OPSUS" || row.ACTIVITY === "EQRPR") score += 15;
    }

    // Torque queries
    if (isTorqueQuery && text.includes("torque")) {
      score += 35;
    }

    // Night shift queries
    if (isNightQuery && (text.includes("after midnight") || text.includes("00:00") || text.includes("night"))) {
      score += 30;
    }

    // Term matches in COM narrative
    for (const term of queryTerms) {
      if (text.includes(term)) {
        score += 8;
      }
    }

    return { row, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top 10 most relevant scored rows (keeps token count well below Groq TPM limits)
  return scored.slice(0, 10).map((s) => s.row);
}

export async function POST(req: NextRequest) {
  try {
    const { messages, wellFilter } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages parameter" }, { status: 400 });
    }

    const latestUserMessage = [...messages].reverse().find((m: ChatMessage) => m.role === "user")?.content || "";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in server environment." },
        { status: 500 }
      );
    }

    const ddr = loadDdrData();
    const stats = computeStats(ddr);
    const relevantRows = retrieveRelevantDdr(ddr, latestUserMessage, wellFilter);

    // Prepare formatted context block for LLM (concise to ensure fast response and fit token budget)
    const ddrContextText = relevantRows
      .map((r, i) => {
        const nptText = r.UNSCHEDULE_EVENT_HRS ? ` | NPT: ${r.UNSCHEDULE_EVENT_HRS} hrs` : "";
        const depthText = r.DEPTHACT > 0 ? ` | Depth: ${r.DEPTHACT} ft` : "";
        const trimmedCom = r.COM.length > 400 ? r.COM.slice(0, 400) + "..." : r.COM;
        return `[LOG #${i + 1}] Well: ${r.WELLIDE} | Rig: ${r.RIGNO} | Date: ${r.DTTMSTART} | Phase: ${r.WELLPHASE} | Activity: ${r.ACTIVITY} (${r.DURATION} hrs)${nptText}${depthText}
COM: ${trimmedCom.trim()}`;
      })
      .join("\n\n");

    const systemPrompt = `You are the Senior Drilling Operations & AI Digitalization Specialist for Pertamina Hulu Rokan (PHR).
You are analyzing official Daily Drilling Reports (DDR) and high-frequency sensor telemetry for the SEBL field (SEBL_001 with Rig PHR-05, and SEBL_002 with Rig PHR-06).

DDR OVERVIEW & NPT STATISTICS:
- SEBL_001 (Rig PHR-05): ${stats.SEBL_001?.totalRows || 0} report lines, Total NPT: ${stats.SEBL_001?.totalNpt.toFixed(1) || 0} hours.
- SEBL_002 (Rig PHR-06): ${stats.SEBL_002?.totalRows || 0} report lines, Total NPT: ${stats.SEBL_002?.totalNpt.toFixed(1) || 0} hours.

RELEVANT DDR LOG ENTRIES RETRIEVED FROM DATABASE:
${ddrContextText}

INSTRUCTIONS FOR YOUR RESPONSE:
1. Answer the user's question directly, authoritatively, and professionally as a drilling expert.
2. Ground your answer in both:
   - The coded operational fields (WELLIDE, ACTIVITY, DURATION, UNSCHEDULE_EVENT_HRS, DEPTHACT).
   - The free-text narrative comments (COM field), highlighting specific details (e.g. mud pump valve leaks, SWA due to heavy rain, night trip policy, TDS goose neck replacement, torque values, RPM, flow rates).
3. If the user asks about torque spikes on night shift, detail the specific shift time (e.g. After Midnight 00:00 - 05:00), drilling parameters (WOB, RPM, Flow Rate), and crew actions.
4. If the user asks about NPT causes on SEBL_002 (or SEBL_001), break down the primary unscheduled downtime events with their exact hours and reasons.
5. Format your response cleanly using GitHub markdown (bullet points, bold highlights, concise summary section, and actionable engineering insights).
6. Cite the specific DDR dates and log numbers where relevant.`;

    const groqPayload = {
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-6), // Keep recent conversation context
      ],
      temperature: 0.2,
      max_tokens: 1500,
    };

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groqPayload),
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errorText);

      // Fallback to secondary model if gpt-oss-120b has issues
      const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...groqPayload, model: "qwen/qwen3.8-27b" }),
      });

      if (!fallbackRes.ok) {
        return NextResponse.json(
          { error: `Groq upstream error (${groqRes.status}): ${errorText}` },
          { status: 502 }
        );
      }

      const fallbackData = await fallbackRes.json();
      return NextResponse.json({
        reply: fallbackData.choices?.[0]?.message?.content || "No response generated.",
        model: "qwen/qwen3.8-27b",
        citations: relevantRows.slice(0, 5).map((r) => ({
          well: r.WELLIDE,
          date: r.DTTMSTART,
          activity: r.ACTIVITY,
          npt: r.UNSCHEDULE_EVENT_HRS,
          snippet: r.COM.slice(0, 160).replace(/\n/g, " "),
        })),
      });
    }

    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({
      reply,
      model: "openai/gpt-oss-120b",
      citations: relevantRows.slice(0, 5).map((r) => ({
        well: r.WELLIDE,
        date: r.DTTMSTART,
        activity: r.ACTIVITY,
        npt: r.UNSCHEDULE_EVENT_HRS,
        snippet: r.COM.slice(0, 160).replace(/\n/g, " "),
      })),
    });
  } catch (err: any) {
    console.error("Chat API route failure:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error processing chat" },
      { status: 500 }
    );
  }
}
