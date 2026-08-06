// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { loadEnv, requireEnv } from "./env.js";
import { DataHubGms, datasetUrn, type AssertionOutcome } from "./gms.js";
import { say } from "./narrate.js";

// DataHub governance surface, agent-written (M5, MOO-475): domains, business
// glossary, tags, structured properties with live stats, and incidents wired
// to the steward's quality assertions. Everything idempotent — creates catch
// "already exists", attaches are set-based upserts, property values overwrite
// in place — so `npm run governance` is safe to run every session.

// ── What the agent writes ───────────────────────────────────────────────

const DOMAINS = [
  {
    id: "liner-notes",
    name: "Liner Notes",
    description:
      "Steward-managed catalog: resolved artists, tracks, the influence graph, and the " +
      "agent's own work records. Every dataset here is written by the Liner Notes steward agent.",
    match: (name: string) => name.startsWith("liner-notes."),
  },
  {
    id: "radio-milwaukee-source",
    name: "Radio Milwaukee Source",
    description:
      "Read-only production source: Radio Milwaukee's playlist platform (rm-playlist-v2). " +
      "The steward reads its backlog here and never writes back.",
    match: (name: string) => name.startsWith("rm-playlist-v2."),
  },
];

const TAGS = [
  {
    id: "steward-managed",
    name: "steward-managed",
    description: "Written and maintained by the Liner Notes steward agent.",
    datasets: ["liner-notes.artists", "liner-notes.tracks", "liner-notes.workItems", "liner-notes.reviewItems", "liner-notes.stewardRuns", "liner-notes.editorialScans"],
  },
  {
    id: "source-read-only",
    name: "source-read-only",
    description: "Production source data. The steward reads it; nothing writes back.",
    datasets: ["rm-playlist-v2.plays", "rm-playlist-v2.artists", "rm-playlist-v2.tracks", "rm-playlist-v2.events", "rm-playlist-v2.eventArtists", "rm-playlist-v2.stations"],
  },
  {
    id: "derived",
    name: "derived",
    description: "Fully rebuilt from resolved data by the deterministic graph pipeline.",
    datasets: ["liner-notes.graphNodes", "liner-notes.graphEdges", "liner-notes.neighborhoods"],
  },
  {
    id: "llm-assisted",
    name: "llm-assisted",
    description:
      "Contains judgments made with LLM assistance (Claude adjudication, neighborhood naming, " +
      "Perplexity editorial extraction) — always with reasoning or citations stored alongside.",
    datasets: ["liner-notes.artists", "liner-notes.graphEdges", "liner-notes.neighborhoods", "liner-notes.reviewItems"],
  },
  {
    id: "no-listener-data",
    name: "no-listener-data",
    description: "Contains zero listener/user behavioral data — curation-only by design.",
    datasets: ["liner-notes.graphNodes", "liner-notes.graphEdges", "liner-notes.neighborhoods", "liner-notes.playlists"],
  },
];

const GLOSSARY = [
  { id: "co-play", name: "Co-play", description: "Two artists aired within 60 minutes on the same station — a DJ's implicit judgment that the sounds belong together. The unit of evidence behind curation edges.", datasets: ["liner-notes.graphEdges", "rm-playlist-v2.plays"] },
  { id: "curation-edge", name: "Curation edge", description: "A graph connection weighted by co-play count across four stations, carrying a receipt: count, stations, and an example on-air moment.", datasets: ["liner-notes.graphEdges"] },
  { id: "canonical-edge", name: "Canonical edge", description: "A graph connection documented in MusicBrainz (band membership, collaboration) between two catalog artists — real-world facts independent of airplay.", datasets: ["liner-notes.graphEdges"] },
  { id: "editorial-edge", name: "Editorial edge", description: "A typed connection (influenced-by, collaborated-with, compared-to…) extracted from music journalism via Perplexity's cited API — a short verbatim quote plus citation URL as the receipt. No article text stored.", datasets: ["liner-notes.graphEdges"] },
  { id: "resolution", name: "Resolution", description: "Matching a raw playout artist string to a canonical MusicBrainz identity, with method (exact / fuzzy / LLM-adjudicated / human-approved), confidence, and evidence stored as provenance.", datasets: ["liner-notes.artists", "liner-notes.workItems", "rm-playlist-v2.plays"] },
  { id: "enrichment", name: "Enrichment", description: "Filling a resolved artist's genres, relations, images, ISRCs, and streaming links from MusicBrainz, Discogs, Deezer, and SonoVault.", datasets: ["liner-notes.artists", "liner-notes.tracks"] },
  { id: "neighborhood", name: "Neighborhood", description: "A musical community found by Louvain detection over the co-play graph with zero genre labels as input, then given an evocative Milwaukee district name by the agent.", datasets: ["liner-notes.neighborhoods", "liner-notes.graphNodes"] },
  { id: "bridge-artist", name: "Bridge artist", description: "An artist whose connections concentrate across two neighborhoods (high betweenness centrality) — the doorway sounds travel through between districts.", datasets: ["liner-notes.graphNodes"] },
  { id: "receipt", name: "Receipt", description: "The evidence behind any connection or resolution, embedded in the data at build time: co-play counts, MusicBrainz relations, journalism quotes with citations, or resolution records. Trust as a visible feature.", datasets: ["liner-notes.graphEdges", "liner-notes.artists", "liner-notes.playlists"] },
];

const NUMBER_TYPE = "urn:li:dataType:datahub.number";
const STRING_TYPE = "urn:li:dataType:datahub.string";
const DATASET_ENTITY = "urn:li:entityType:datahub.dataset";

const STRUCTURED_PROPS = [
  { id: "io.linernotes.graphNodes", displayName: "Graph nodes", valueType: NUMBER_TYPE },
  { id: "io.linernotes.graphEdges", displayName: "Graph edges (total)", valueType: NUMBER_TYPE },
  { id: "io.linernotes.curationEdges", displayName: "Curation edges", valueType: NUMBER_TYPE },
  { id: "io.linernotes.canonicalEdges", displayName: "Canonical edges", valueType: NUMBER_TYPE },
  { id: "io.linernotes.editorialEdges", displayName: "Editorial edges", valueType: NUMBER_TYPE },
  { id: "io.linernotes.resolutionCoveragePct", displayName: "Resolution coverage %", valueType: NUMBER_TYPE },
  { id: "io.linernotes.enrichmentCoveragePct", displayName: "Enrichment coverage %", valueType: NUMBER_TYPE },
  { id: "io.linernotes.lastStewardSync", displayName: "Last steward governance sync", valueType: STRING_TYPE },
];

const propUrn = (id: string) => `urn:li:structuredProperty:${id}`;

// ── Sync helpers (idempotent) ───────────────────────────────────────────

async function createIgnoringExists(
  gms: DataHubGms,
  label: string,
  mutation: string,
  variables: Record<string, unknown>
): Promise<void> {
  try {
    await gms.graphql(mutation, variables);
    say(`  + created ${label}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/already exists|Conflict|duplicate/i.test(msg)) return; // idempotent re-run
    throw new Error(`${label}: ${msg}`);
  }
}

export async function syncGovernance(gms: DataHubGms, convex: ConvexHttpClient): Promise<void> {
  // Datasets present in DataHub (both deployments' containers).
  const search = await gms.graphql<{
    search: { searchResults: { entity: { urn: string } }[] };
  }>(
    `query search($input: SearchInput!) {
      search(input: $input) { searchResults { entity { urn } } }
    }`,
    { input: { type: "DATASET", query: "convex", start: 0, count: 200 } }
  );
  const urns = search.search.searchResults.map((r) => r.entity.urn).filter((u) => u.includes("dataPlatform:convex"));
  const nameOf = (urn: string) => urn.split(",")[1] ?? "";
  say(`governance sync over ${urns.length} convex datasets`);

  // Domains
  for (const domain of DOMAINS) {
    await createIgnoringExists(
      gms,
      `domain ${domain.name}`,
      `mutation createDomain($input: CreateDomainInput!) { createDomain(input: $input) }`,
      { input: { id: domain.id, name: domain.name, description: domain.description } }
    );
    const resources = urns.filter((u) => domain.match(nameOf(u))).map((resourceUrn) => ({ resourceUrn }));
    if (resources.length > 0) {
      await gms.graphql(
        `mutation batchSetDomain($input: BatchSetDomainInput!) { batchSetDomain(input: $input) }`,
        { input: { domainUrn: `urn:li:domain:${domain.id}`, resources } }
      );
      say(`  domain ${domain.name}: ${resources.length} datasets assigned`);
    }
  }

  // Tags
  for (const tag of TAGS) {
    await createIgnoringExists(
      gms,
      `tag ${tag.name}`,
      `mutation createTag($input: CreateTagInput!) { createTag(input: $input) }`,
      { input: { id: tag.id, name: tag.name, description: tag.description } }
    );
    const resources = tag.datasets
      .map(datasetUrn)
      .filter((u) => urns.includes(u))
      .map((resourceUrn) => ({ resourceUrn }));
    if (resources.length > 0) {
      await gms.graphql(
        `mutation batchAddTags($input: BatchAddTagsInput!) { batchAddTags(input: $input) }`,
        { input: { tagUrns: [`urn:li:tag:${tag.id}`], resources } }
      );
      say(`  tag ${tag.name}: ${resources.length} datasets`);
    }
  }

  // Glossary
  for (const term of GLOSSARY) {
    await createIgnoringExists(
      gms,
      `glossary term ${term.name}`,
      `mutation createGlossaryTerm($input: CreateGlossaryEntityInput!) { createGlossaryTerm(input: $input) }`,
      { input: { id: term.id, name: term.name, description: term.description } }
    );
    const resources = term.datasets
      .map(datasetUrn)
      .filter((u) => urns.includes(u))
      .map((resourceUrn) => ({ resourceUrn }));
    if (resources.length > 0) {
      await gms.graphql(
        `mutation batchAddTerms($input: BatchAddTermsInput!) { batchAddTerms(input: $input) }`,
        { input: { termUrns: [`urn:li:glossaryTerm:${term.id}`], resources } }
      );
      say(`  term ${term.name}: ${resources.length} datasets`);
    }
  }

  // Structured properties: definitions once, live values every sync.
  for (const prop of STRUCTURED_PROPS) {
    await createIgnoringExists(
      gms,
      `structured property ${prop.displayName}`,
      `mutation createStructuredProperty($input: CreateStructuredPropertyInput!) {
        createStructuredProperty(input: $input) { urn }
      }`,
      {
        input: {
          id: prop.id,
          qualifiedName: prop.id,
          displayName: prop.displayName,
          valueType: prop.valueType,
          entityTypes: [DATASET_ENTITY],
        },
      }
    );
  }

  const [graphStats, stewardStats, editorialStats] = await Promise.all([
    aggregateGraphStats(convex),
    convex.query(anyApi.steward.datahubStats, {}) as Promise<{
      workItems: { total: number; resolved?: number };
      artists: { resolved: number; enriched: number };
    }>,
    convex.query(anyApi.editorial.stats, {}) as Promise<{ editorialEdges: number }>,
  ]);
  const coverage =
    stewardStats.workItems.total > 0
      ? ((stewardStats.workItems.resolved ?? 0) / stewardStats.workItems.total) * 100
      : 0;
  const enrichment =
    stewardStats.artists.resolved > 0
      ? (stewardStats.artists.enriched / stewardStats.artists.resolved) * 100
      : 0;
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

  const assign = async (dataset: string, values: [string, number | string][]) => {
    const urn = datasetUrn(dataset);
    if (!urns.includes(urn)) return;
    await gms.graphql(
      `mutation upsert($input: UpsertStructuredPropertiesInput!) {
        upsertStructuredProperties(input: $input) { properties { structuredProperty { urn } } }
      }`,
      {
        input: {
          assetUrn: urn,
          structuredPropertyInputParams: values.map(([id, value]) => ({
            structuredPropertyUrn: propUrn(id),
            values: [typeof value === "number" ? { numberValue: value } : { stringValue: value }],
          })),
        },
      }
    );
    say(`  properties → ${dataset}: ${values.map(([i, v]) => `${i.split(".").pop()}=${v}`).join(", ")}`);
  };

  await assign("liner-notes.graphEdges", [
    ["io.linernotes.graphEdges", graphStats.edges],
    ["io.linernotes.curationEdges", graphStats.curation],
    ["io.linernotes.canonicalEdges", graphStats.canonical],
    ["io.linernotes.editorialEdges", editorialStats.editorialEdges],
    ["io.linernotes.lastStewardSync", stamp],
  ]);
  await assign("liner-notes.graphNodes", [
    ["io.linernotes.graphNodes", graphStats.nodes],
    ["io.linernotes.lastStewardSync", stamp],
  ]);
  await assign("rm-playlist-v2.plays", [
    ["io.linernotes.resolutionCoveragePct", Number(coverage.toFixed(1))],
    ["io.linernotes.lastStewardSync", stamp],
  ]);
  await assign("liner-notes.artists", [
    ["io.linernotes.enrichmentCoveragePct", Number(enrichment.toFixed(1))],
    ["io.linernotes.lastStewardSync", stamp],
  ]);
}

async function aggregateGraphStats(convex: ConvexHttpClient): Promise<{
  nodes: number;
  edges: number;
  curation: number;
  canonical: number;
}> {
  const byType: Record<string, number> = {};
  let nodes = 0;
  let cursor: string | null = null;
  for (;;) {
    const page = (await convex.query(anyApi.graph.graphStats, { cursor })) as {
      edgesByType: Record<string, number>;
      continueCursor: string | null;
      done: boolean;
      nodes?: number;
    };
    for (const [k, v] of Object.entries(page.edgesByType)) byType[k] = (byType[k] ?? 0) + v;
    if (page.done) {
      nodes = page.nodes ?? 0;
      break;
    }
    cursor = page.continueCursor;
  }
  const edges = Object.values(byType).reduce((s, x) => s + x, 0);
  return { nodes, edges, curation: byType.curation ?? 0, canonical: byType.canonical ?? 0 };
}

// ── Incidents: assertion outcomes → raise / resolve ─────────────────────

export async function syncIncidents(
  gms: DataHubGms,
  entityUrn: string,
  outcomes: AssertionOutcome[]
): Promise<void> {
  const active = await gms.graphql<{
    dataset: { incidents: { incidents: { urn: string; title: string }[] } | null };
  }>(
    `query incidents($urn: String!) {
      dataset(urn: $urn) {
        incidents(state: ACTIVE, start: 0, count: 20) { incidents { urn title } }
      }
    }`,
    { urn: entityUrn }
  );
  const activeIncidents = active.dataset.incidents?.incidents ?? [];
  const titleFor = (label: string) => `Steward: ${label} failing`;

  for (const outcome of outcomes) {
    const title = titleFor(outcome.label);
    const existing = activeIncidents.find((i) => i.title === title);
    if (!outcome.pass && !existing) {
      await gms.graphql(
        `mutation raiseIncident($input: RaiseIncidentInput!) { raiseIncident(input: $input) }`,
        {
          input: {
            type: "OPERATIONAL",
            customType: "STEWARD_QUALITY",
            title,
            description:
              `${outcome.detail} Raised automatically by the Liner Notes steward agent; ` +
              `it will resolve this incident when the assertion passes.`,
            resourceUrn: entityUrn,
            priority: "MEDIUM",
          },
        }
      );
      say(`  incident raised: ${title}`);
    } else if (outcome.pass && existing) {
      await gms.graphql(
        `mutation updateIncidentStatus($urn: String!, $input: UpdateIncidentStatusInput!) {
          updateIncidentStatus(urn: $urn, input: $input)
        }`,
        {
          urn: existing.urn,
          input: {
            state: "RESOLVED",
            message: `${outcome.detail} Resolved automatically by the steward agent.`,
          },
        }
      );
      say(`  incident resolved: ${title}`);
    }
  }
}

// ── Standalone run: full governance sync + incident pass ────────────────

async function main() {
  loadEnv();
  const gms = new DataHubGms();
  const convex = new ConvexHttpClient(requireEnv("CONVEX_URL"));
  say("DataHub governance sync (domains, tags, glossary, properties, incidents)");
  await syncGovernance(gms, convex);

  const stats = (await convex.query(anyApi.steward.datahubStats, {})) as Parameters<
    DataHubGms["upsertSessionAssertions"]
  >[1];
  const playsUrn = datasetUrn("rm-playlist-v2.plays");
  const outcomes = await gms.upsertSessionAssertions(playsUrn, stats);
  for (const o of outcomes) say(`  assertion ${o.pass ? "PASS" : "FAIL"} — ${o.label}: ${o.detail}`);
  await syncIncidents(gms, playsUrn, outcomes);
  say("governance sync complete.");
}

const isMain = process.argv[1]?.endsWith("governance.ts");
if (isMain) {
  main().catch((err) => {
    console.error("governance sync failed:", err);
    process.exit(1);
  });
}
