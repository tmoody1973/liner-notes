// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import Anthropic from "@anthropic-ai/sdk";
import type { WorkItem } from "./convex.js";
import type { ScoredCandidate } from "./resolve.js";

// Claude adjudicates the medium-confidence bucket. The verdict's reasoning is
// persisted verbatim as the resolution evidence. Any failure — no API key,
// refusal, schema mismatch, network — safely demotes the item to human review.

export interface Verdict {
  decision: "apply" | "review" | "ignore";
  mbid?: string;
  confidence: number;
  reasoning: string;
}

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["apply", "review", "ignore"] },
    mbid: { type: "string" },
    confidence: { type: "number" },
    reasoning: { type: "string" },
  },
  required: ["decision", "confidence", "reasoning"],
  additionalProperties: false,
} as const;

export async function adjudicate(
  item: WorkItem,
  scored: ScoredCandidate[]
): Promise<Verdict | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const candidates = scored.map((s) => ({
    mbid: s.candidate.mbid,
    name: s.candidate.name,
    disambiguation: s.candidate.disambiguation,
    type: s.candidate.type,
    tags: s.candidate.tags,
    activeYears: [s.candidate.beginYear, s.candidate.endYear],
    scoreBreakdown: s.evidence,
  }));
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1000,
      system:
        "You are the Liner Notes data steward adjudicating an ambiguous artist match for a " +
        "radio station's playlist catalog (Radio Milwaukee: 88Nine eclectic/AAA, HYFIN Black " +
        "music/diaspora, Rhythm Lab electronic/jazz, 414 Music local Milwaukee artists). " +
        "Given a raw playout artist string and scored MusicBrainz candidates, decide: " +
        "'apply' with the mbid if one candidate is clearly the artist the station played; " +
        "'ignore' if the string is not a real artist (station branding, placeholder text); " +
        "'review' if a human should decide. Local Milwaukee artists often have no or wrong " +
        "MusicBrainz matches — prefer 'review' over a plausible-but-wrong apply. " +
        "State your reasoning in 1-3 plain sentences.",
      output_config: {
        format: { type: "json_schema", schema: VERDICT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            rawArtist: item.rawArtist,
            playCount: item.playCount,
            stations: item.stationSlugs,
            topTitle: item.topTitle,
            candidates,
          }),
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming);
    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const verdict = JSON.parse(text) as Verdict;
    if (!["apply", "review", "ignore"].includes(verdict.decision)) return null;
    if (verdict.decision === "apply" && !scored.some((s) => s.candidate.mbid === verdict.mbid)) {
      return null; // hallucinated mbid — send to review
    }
    return verdict;
  } catch {
    return null;
  }
}
