// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { loadEnv, requireEnv } from "./env.js";
import { DataHubGms } from "./gms.js";
import { say } from "./narrate.js";
import { politeFetchJson } from "./polite.js";
import { normalizeRaw, similarity } from "./resolve.js";

// Editorial extraction session (M5, MOO-472): the agent reads music
// journalism about the station's most-played artists through Perplexity's
// cited API and lands typed connections as editorial graph edges — a short
// quote + citation URL as the receipt, never article text. Budget-capped,
// resumable (editorialScans), idempotent (responses disk-cached; edge
// upserts dedupe by pair + relation).

// ── Config ──────────────────────────────────────────────────────────────
const SOURCE_REGISTRY = [
  "pitchfork.com",
  "allmusic.com",
  "daily.bandcamp.com",
  "thequietus.com",
  "npr.org",
];
const MODEL = "sonar-pro";
const MAX_ARTISTS_DEFAULT = 50; // budget cap per session (Tarik's call)
const MIN_CONFIDENCE = 0.5;
const PPLX_INTERVAL_MS = 1200;
// Estimated pricing for the session summary (sonar-pro, USD).
const COST_PER_INPUT_MTOK = 3;
const COST_PER_OUTPUT_MTOK = 15;
const COST_PER_REQUEST = 0.006;

const RELATIONS = [
  "influenced-by",
  "collaborated-with",
  "compared-to",
  "mentored-by",
  "negative",
] as const;

interface ExtractedConnection {
  artistName: string;
  relation: string;
  quote: string;
  citationUrl: string;
  confidence: number;
}

interface PerplexityResponse {
  choices?: { message?: { content?: string } }[];
  citations?: string[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    connections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          artistName: { type: "string" },
          relation: { type: "string", enum: [...RELATIONS] },
          quote: { type: "string", maxLength: 300 },
          citationUrl: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["artistName", "relation", "quote", "citationUrl", "confidence"],
      },
    },
  },
  required: ["connections"],
};

function prompt(artist: { displayName: string; genres: string[] }): string {
  return (
    `Artist: ${artist.displayName}` +
    (artist.genres.length ? ` (${artist.genres.slice(0, 4).join(", ")})` : "") +
    `\n\nFrom published music journalism about this artist, extract documented ` +
    `connections to OTHER named musical artists. For each connection give: the other ` +
    `artist's name exactly as written; the relation (one of: ${RELATIONS.join(", ")}); ` +
    `a short verbatim quote (under 300 characters) from the article that documents the ` +
    `connection; the URL of the article the quote comes from; and your confidence 0-1 ` +
    `that the quote genuinely documents this relation. Only include connections a ` +
    `quote actually supports. If nothing is documented, return an empty list.`
  );
}

async function queryPerplexity(
  artist: { displayName: string; genres: string[] }
): Promise<PerplexityResponse> {
  const key = requireEnv("PERPLEXITY_API_KEY");
  return politeFetchJson<PerplexityResponse>("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    minIntervalMs: PPLX_INTERVAL_MS,
    cacheKey: `pplx:editorial:${MODEL}:${artist.displayName.toLowerCase()}`,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You extract artist-to-artist connections from music journalism. " +
            "Respond with JSON only, matching the requested schema. Quotes must be " +
            "verbatim from the cited articles.",
        },
        { role: "user", content: prompt(artist) },
      ],
      search_domain_filter: SOURCE_REGISTRY,
      response_format: {
        type: "json_schema",
        json_schema: { name: "editorial_connections", schema: RESPONSE_SCHEMA },
      },
    }),
  });
}

function parseConnections(response: PerplexityResponse): ExtractedConnection[] {
  const content = response.choices?.[0]?.message?.content ?? "";
  const jsonText = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    const parsed = JSON.parse(jsonText) as { connections?: ExtractedConnection[] };
    return (parsed.connections ?? []).filter(
      (c) => c.artistName && c.quote && c.citationUrl && RELATIONS.includes(c.relation as never)
    );
  } catch {
    return [];
  }
}

// Citation must come from the source registry (guards hallucinated URLs).
function citationAllowed(url: string): boolean {
  try {
    const host = new URL(url).host.replace(/^www\./, "");
    return SOURCE_REGISTRY.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

async function main() {
  loadEnv();
  const maxArg = process.argv.find((a) => a.startsWith("--max-artists="));
  const maxArtists = maxArg ? Number(maxArg.split("=")[1]) : MAX_ARTISTS_DEFAULT;

  const client = new ConvexHttpClient(requireEnv("CONVEX_URL"));
  const runId = (await client.mutation(anyApi.steward.startRun, {})) as string;
  say(`editorial session — model ${MODEL}, budget cap ${maxArtists} artists, run ${runId}`);
  say(`source registry: ${SOURCE_REGISTRY.join(", ")}`);

  // Catalog match table: normalized displayName + rawNames → artistId.
  const catalog = (await client.query(anyApi.graph.catalogArtists, {})) as {
    _id: string;
    displayName: string;
    rawNames: string[];
  }[];
  const byNorm = new Map<string, { id: string; name: string }>();
  for (const artist of catalog) {
    for (const name of [artist.displayName, ...artist.rawNames]) {
      byNorm.set(normalizeRaw(name), { id: artist._id, name: artist.displayName });
    }
  }
  const matchCatalog = (name: string): { id: string; name: string } | null => {
    const norm = normalizeRaw(name);
    const exact = byNorm.get(norm);
    if (exact) return exact;
    // tolerate light spelling drift, but stay strict enough to avoid collisions
    let best: { id: string; name: string } | null = null;
    let bestScore = 0.93;
    for (const [candNorm, cand] of byNorm) {
      const score = similarity(norm, candNorm);
      if (score > bestScore) {
        best = cand;
        bestScore = score;
      }
    }
    return best;
  };

  const worklist = (await client.query(anyApi.editorial.worklist, {
    limit: maxArtists,
  })) as { artistId: string; displayName: string; spinCount: number; genres: string[] }[];
  say(`worklist: ${worklist.length} most-played artists not yet scanned`);

  const totals = {
    scanned: 0,
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    connectionsSeen: 0,
    edgesInserted: 0,
    duplicates: 0,
    externalDropped: 0,
    lowConfidence: 0,
    badCitation: 0,
  };

  for (const artist of worklist) {
    if (totals.scanned >= maxArtists) break;
    say(`— ${artist.displayName} (${artist.spinCount} spins)`);
    let response: PerplexityResponse;
    try {
      response = await queryPerplexity(artist);
    } catch (err) {
      say(`  perplexity error, skipping: ${err instanceof Error ? err.message.slice(0, 140) : err}`);
      continue;
    }
    totals.scanned += 1;
    totals.requests += 1;
    totals.inputTokens += response.usage?.prompt_tokens ?? 0;
    totals.outputTokens += response.usage?.completion_tokens ?? 0;

    const connections = parseConnections(response);
    totals.connectionsSeen += connections.length;
    let found = 0;
    for (const conn of connections) {
      if (conn.confidence < MIN_CONFIDENCE) {
        totals.lowConfidence += 1;
        continue;
      }
      if (!citationAllowed(conn.citationUrl)) {
        totals.badCitation += 1;
        say(`  ✗ citation outside registry, dropped: ${conn.citationUrl.slice(0, 80)}`);
        continue;
      }
      const other = matchCatalog(conn.artistName);
      if (!other) {
        totals.externalDropped += 1;
        say(`  ✗ "${conn.artistName}" not in catalog — no edge (${conn.relation})`);
        continue;
      }
      if (other.id === artist.artistId) continue;
      const result = (await client.mutation(anyApi.editorial.upsertEdge, {
        fromArtistId: artist.artistId,
        toArtistId: other.id,
        quote: conn.quote.slice(0, 300),
        citationUrl: conn.citationUrl,
        relationType: conn.relation,
        confidence: conn.confidence,
      })) as { inserted: boolean };
      if (result.inserted) {
        totals.edgesInserted += 1;
        found += 1;
        say(`  ✓ ${artist.displayName} —${conn.relation}→ ${other.name}  “${conn.quote.slice(0, 70)}…”`);
      } else {
        totals.duplicates += 1;
      }
    }
    await client.mutation(anyApi.editorial.recordScan, {
      artistId: artist.artistId,
      connectionsFound: found,
      requests: 1,
      runId,
    });
  }

  const estCost =
    (totals.inputTokens / 1e6) * COST_PER_INPUT_MTOK +
    (totals.outputTokens / 1e6) * COST_PER_OUTPUT_MTOK +
    totals.requests * COST_PER_REQUEST;
  const report =
    `Editorial extraction session: scanned ${totals.scanned} of the station's most-played artists ` +
    `against ${SOURCE_REGISTRY.length} music journalism sources via Perplexity (${MODEL}). ` +
    `Found ${totals.connectionsSeen} candidate connections; ${totals.edgesInserted} became typed editorial ` +
    `edges (quote + citation as receipt), ${totals.duplicates} were already known, ` +
    `${totals.externalDropped} mentioned artists outside the catalog and were dropped, ` +
    `${totals.lowConfidence} fell under the ${MIN_CONFIDENCE} confidence floor, and ` +
    `${totals.badCitation} cited pages outside the source registry. ` +
    `Spend: ${totals.requests} requests, ~${totals.inputTokens + totals.outputTokens} tokens, ` +
    `estimated $${estCost.toFixed(2)} (cap: ${maxArtists} artists/session). No article text stored.`;

  say("");
  say(report);

  await client.mutation(anyApi.steward.finishRun, {
    runId,
    counts: {
      editorialScanned: totals.scanned,
      editorialEdges: totals.edgesInserted,
      externalDropped: totals.externalDropped,
      duplicates: totals.duplicates,
      requests: totals.requests,
    },
    report,
  });

  // Document the run in DataHub (degrades gracefully if GMS is down).
  try {
    const gms = new DataHubGms();
    await gms.documentDatasets([
      {
        name: "liner-notes.graphEdges",
        description:
          "Typed, weighted, receipted connections between artists: curation (co-play), " +
          "canonical (MusicBrainz), and editorial (music journalism via Perplexity — " +
          "short quote + citation URL as the receipt, no article text stored).\n\n---\n\n" +
          `**Latest editorial extraction — ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC (run \`${runId}\`)**\n\n` +
          report,
      },
    ]);
    say("DataHub: editorial run report written to liner-notes.graphEdges documentation");
  } catch (err) {
    say(`DataHub documentation skipped (${err instanceof Error ? err.message.slice(0, 100) : err})`);
  }

  say("editorial session complete.");
}

main().catch((err) => {
  console.error("editorial session failed:", err);
  process.exit(1);
});
