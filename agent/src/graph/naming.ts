// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import Anthropic from "@anthropic-ai/sdk";

// Claude names the graph neighborhoods (MOO-466). Milwaukee-flavored evocative
// names — Tarik's call — like city districts for the station's musical map.
// Deterministic genre-based fallback keeps the build usable without the API;
// the edge pipeline itself (MOO-465) never touches an LLM.

export interface NeighborhoodInput {
  index: number;
  size: number;
  topArtists: string[];
  topGenres: string[];
}

export interface NeighborhoodName {
  name: string;
  description: string;
}

export async function nameNeighborhoods(
  hoods: NeighborhoodInput[]
): Promise<NeighborhoodName[]> {
  const fallback = hoods.map(deterministicName);
  if (hoods.length === 0 || !process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      system:
        "You name the musical neighborhoods of Radio Milwaukee's influence graph — " +
        "communities of artists the stations play together. Give each an evocative name " +
        "that reads like a Milwaukee city district (lean on Milwaukee geography and " +
        "culture where it genuinely fits the music; never force it), plus a one-sentence " +
        "description a listener would enjoy. Names must be distinct and under 5 words. " +
        'Respond with ONLY a JSON object: {"neighborhoods": [{"index": number, "name": string, "description": string}, ...]} — no prose, no code fences.',
      messages: [
        {
          role: "user",
          content:
            "Name each neighborhood (respond for every index):\n" +
            hoods
              .map(
                (h) =>
                  `#${h.index} — ${h.size} artists; top artists: ${h.topArtists.join(", ")}; ` +
                  `genres: ${h.topGenres.join(", ") || "unknown"}`
              )
              .join("\n"),
        },
      ],
    });
    if (response.stop_reason === "refusal") return fallback;
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as {
      neighborhoods: { index: number; name: string; description: string }[];
    };
    return hoods.map((h) => {
      const match = parsed.neighborhoods.find((n) => n.index === h.index);
      return match
        ? { name: match.name, description: match.description }
        : deterministicName(h);
    });
  } catch {
    return fallback;
  }
}

function deterministicName(hood: NeighborhoodInput): NeighborhoodName {
  const genre = hood.topGenres[0] ?? "Mixed";
  const title = genre.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return {
    name: `${title} District ${hood.index + 1}`,
    description: `${hood.size} artists clustered around ${genre} on Radio Milwaukee's airwaves.`,
  };
}
