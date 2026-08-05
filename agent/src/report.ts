// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import Anthropic from "@anthropic-ai/sdk";

export interface RunStats {
  mode: string;
  playsScanned: number;
  scanComplete: boolean;
  distinctArtists: number;
  newWorkItems: number;
  counts: Record<string, number>;
  datahubDatasets: number;
  assertionSummary: string;
  interrupted: boolean;
}

// Claude writes the plain-English run report (per PRD: report writing is the
// agent brain's job). Falls back to a deterministic report if the API is
// unavailable or declines.
export async function writeReport(stats: RunStats): Promise<string> {
  const fallback = deterministicReport(stats);
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 600,
      system:
        "You are the Liner Notes steward agent writing a run report for a data catalog. " +
        "Write 3-6 plain-English sentences a radio librarian would understand: what this session " +
        "looked at, what it queued or applied, and what remains. No markdown headers, no bullet lists.",
      messages: [
        {
          role: "user",
          content: `Write the run report for this stewardship session:\n${JSON.stringify(stats, null, 2)}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return fallback;
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

function deterministicReport(stats: RunStats): string {
  const outcomes = Object.entries(stats.counts)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return (
    `Stewardship session (${stats.mode} mode) scanned ${stats.playsScanned} plays` +
    `${stats.scanComplete ? "" : " (capped scan)"}, found ${stats.distinctArtists} distinct raw artist names, ` +
    `queued ${stats.newWorkItems} new work items. Outcomes — ${outcomes || "none"}. ` +
    `DataHub orientation saw ${stats.datahubDatasets} Convex datasets; ${stats.assertionSummary}.` +
    (stats.interrupted ? " Session was interrupted and can be resumed." : "")
  );
}
