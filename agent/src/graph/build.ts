// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { createRequire } from "node:module";
import { LinerNotesClient } from "../convex.js";
import { loadEnv } from "../env.js";
import { DataHubGms, datasetUrn } from "../gms.js";
import { say } from "../narrate.js";
import { detectMode, readPlays } from "../source.js";
import { computeCoPlayEdges, type ResolvedPlay } from "./coplay.js";
import { graphConfig } from "./config.js";
import {
  matchNeighborhoods,
  nameNeighborhoods,
  type NeighborhoodInput,
  type NeighborhoodName,
} from "./naming.js";

// One-command influence graph build (M3, MOO-465/466). Full rebuild per run:
// curation edges from co-play (Stell-R adapted to radio), canonical edges from
// MusicBrainz relations already on the catalog, Louvain neighborhoods with
// Claude-named districts, betweenness bridge scores. Provenance embedded in
// the tables at build time — the public app never queries DataHub.

// graphology ships CJS `export =` typings that fight NodeNext ESM — load via
// createRequire with the narrow types we actually use.
interface GraphLike {
  order: number;
  size: number;
  addNode(node: string): void;
  updateEdgeWithKey(
    key: string,
    source: string,
    target: string,
    updater: (attr: Record<string, unknown>) => Record<string, unknown>
  ): void;
}
const require = createRequire(import.meta.url);
const { UndirectedGraph } = require("graphology") as {
  UndirectedGraph: new () => GraphLike;
};
const louvain = require("graphology-communities-louvain") as (
  graph: GraphLike,
  options?: { getEdgeWeight?: string }
) => Record<string, number>;
const betweennessCentrality = require("graphology-metrics/centrality/betweenness") as (
  graph: GraphLike,
  options?: { normalized?: boolean }
) => Record<string, number>;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

const banner = (step: string) =>
  console.log(`\n━━━ ${step.toUpperCase()} ${"━".repeat(Math.max(4, 44 - step.length))}`);

interface EdgeRow {
  fromArtistId: string;
  toArtistId: string;
  type: string;
  weight: number;
  receipt: Record<string, unknown>;
}

async function main(): Promise<void> {
  loadEnv();
  const mode = detectMode(process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1]);
  const linerNotes = new LinerNotesClient();
  console.log(`Liner Notes graph build — source mode: ${mode}`);

  // ── 1. LOAD ────────────────────────────────────────────────────────────
  banner("load");
  const artists = await linerNotes.catalogArtists();
  say(`${artists.length} resolved artists in the catalog`);
  const idByRawName = new Map<string, string>();
  const idByMbid = new Map<string, string>();
  for (const artist of artists) {
    for (const raw of artist.rawNames) idByRawName.set(norm(raw), artist._id);
    if (artist.mbid) idByMbid.set(artist.mbid, artist._id);
  }

  say(`scanning plays (up to ${graphConfig.maxPages} pages)...`);
  const { plays, complete } = await readPlays(mode, linerNotes, {
    maxPages: graphConfig.maxPages,
  });
  say(`${plays.length} plays scanned${complete ? " (full history)" : " (capped)"}`);

  const resolvedPlays: ResolvedPlay[] = [];
  for (const play of plays) {
    const artistId = idByRawName.get(norm(play.artistRaw));
    if (artistId !== undefined && play.playedAt !== undefined) {
      resolvedPlays.push({ artistId, stationSlug: play.stationSlug, playedAt: play.playedAt });
    }
  }
  say(
    `${resolvedPlays.length} plays map to resolved artists ` +
      `(${((resolvedPlays.length / Math.max(plays.length, 1)) * 100).toFixed(1)}% of scanned)`
  );

  // ── 2. NODES ───────────────────────────────────────────────────────────
  banner("nodes");
  const nodeAgg = new Map<
    string,
    { spinCount: number; firstAired: number; lastAired: number; stations: Set<string> }
  >();
  for (const play of resolvedPlays) {
    const entry =
      nodeAgg.get(play.artistId) ??
      { spinCount: 0, firstAired: play.playedAt, lastAired: play.playedAt, stations: new Set() };
    entry.spinCount += 1;
    entry.firstAired = Math.min(entry.firstAired, play.playedAt);
    entry.lastAired = Math.max(entry.lastAired, play.playedAt);
    entry.stations.add(play.stationSlug);
    nodeAgg.set(play.artistId, entry);
  }
  say(`${nodeAgg.size} artists with airplay become graph nodes`);

  // ── 3. EDGES ───────────────────────────────────────────────────────────
  banner("edges");
  const coPlay = computeCoPlayEdges(resolvedPlays, graphConfig.windowMs);
  // The ≥2 noise floor is calibrated for the 168k-play real history; the
  // 220-play judge sample would produce zero edges under it.
  const minWeight = mode === "judge" ? 1 : graphConfig.minCurationWeight;
  const curationEdges: EdgeRow[] = coPlay
    .filter((e) => e.weight >= minWeight)
    .map((e) => ({
      fromArtistId: e.fromArtistId,
      toArtistId: e.toArtistId,
      type: "curation",
      weight: e.weight,
      receipt: {
        coPlayCount: e.weight,
        stations: e.stations,
        exampleShowDate: e.exampleShowDate,
      },
    }));
  say(
    `curation: ${coPlay.length} co-played pairs → ${curationEdges.length} edges ` +
      `(≥${minWeight} co-plays within ${graphConfig.windowMs / 60000}min on one station)`
  );

  const canonicalSeen = new Set<string>();
  const canonicalEdges: EdgeRow[] = [];
  for (const artist of artists) {
    if (!nodeAgg.has(artist._id)) continue;
    for (const relation of artist.mbRelations) {
      const targetId = idByMbid.get(relation.targetMbid);
      if (targetId === undefined || targetId === artist._id || !nodeAgg.has(targetId)) continue;
      const [a, b] =
        artist._id < targetId ? [artist._id, targetId] : [targetId, artist._id];
      const key = `${a}|${b}|${relation.type}`;
      if (canonicalSeen.has(key)) continue;
      canonicalSeen.add(key);
      canonicalEdges.push({
        fromArtistId: artist._id,
        toArtistId: targetId,
        type: "canonical",
        weight: 1,
        receipt: { mbRelationType: relation.type },
      });
    }
  }
  say(`canonical: ${canonicalEdges.length} MusicBrainz relationship edges between catalog artists`);

  // ── 4. COMMUNITIES & BRIDGES ───────────────────────────────────────────
  banner("neighborhoods");
  const graph = new UndirectedGraph();
  for (const artistId of nodeAgg.keys()) graph.addNode(artistId);
  for (const edge of [...curationEdges, ...canonicalEdges]) {
    graph.updateEdgeWithKey(
      `${edge.fromArtistId}|${edge.toArtistId}`,
      edge.fromArtistId,
      edge.toArtistId,
      (attr) => ({ weight: ((attr.weight as number) ?? 0) + edge.weight })
    );
  }

  const communities: Record<string, number> =
    graph.size > 0 ? louvain(graph, { getEdgeWeight: "weight" }) : {};
  const members = new Map<number, string[]>();
  for (const [node, community] of Object.entries(communities)) {
    members.set(community, [...(members.get(community) ?? []), node]);
  }
  // Singleton communities (isolated artists) don't make meaningful districts.
  const realHoods = [...members.entries()].filter(([, m]) => m.length >= 2);
  say(`Louvain found ${members.size} communities; ${realHoods.length} with ≥2 artists become neighborhoods`);

  const centrality: Record<string, number> =
    graph.size > 0 ? betweennessCentrality(graph, { normalized: true }) : {};
  const maxCentrality = Math.max(...Object.values(centrality), 0);
  const bridgeScore = (id: string) =>
    maxCentrality > 0 ? Number(((centrality[id] ?? 0) / maxCentrality).toFixed(4)) : 0;

  const displayNameById = new Map(artists.map((a) => [a._id, a.displayName]));
  const genresById = new Map(artists.map((a) => [a._id, a.genres]));
  const namingInputs: NeighborhoodInput[] = realHoods.map(([, ids], index) => {
    const byPlays = [...ids].sort(
      (a, b) => (nodeAgg.get(b)?.spinCount ?? 0) - (nodeAgg.get(a)?.spinCount ?? 0)
    );
    const genreCounts = new Map<string, number>();
    for (const id of ids)
      for (const genre of genresById.get(id) ?? [])
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    return {
      index,
      size: ids.length,
      topArtists: byPlays.slice(0, 6).map((id) => displayNameById.get(id) ?? id),
      topGenres: [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([g]) => g),
    };
  });
  // Districts keep their names across rebuilds: match new clusters to the
  // previous neighborhoods by member overlap, and only genuinely new clusters
  // get named. Listeners bookmark "Bronzeville Beat Loop" — it must survive.
  const previous = await linerNotes.neighborhoodMembers();
  const pinned = matchNeighborhoods(
    previous,
    realHoods.map(([, ids]) => ids)
  );
  const unnamedInputs = namingInputs.filter((h) => pinned[h.index] === null);
  const keptNames = pinned.filter((p): p is NeighborhoodName => p !== null).map((p) => p.name);
  say(
    `${keptNames.length}/${realHoods.length} districts matched previous neighborhoods — names kept` +
      (keptNames.length > 0 ? `: ${keptNames.join(" · ")}` : "")
  );
  let freshNames: NeighborhoodName[] = [];
  if (unnamedInputs.length > 0) {
    say(`asking Claude to name ${unnamedInputs.length} new neighborhood(s) (Milwaukee-flavored)...`);
    freshNames = await nameNeighborhoods(unnamedInputs, { avoid: keptNames });
  }
  const freshByIndex = new Map(unnamedInputs.map((h, i) => [h.index, freshNames[i]]));
  const names: NeighborhoodName[] = namingInputs.map(
    (h) => pinned[h.index] ?? freshByIndex.get(h.index)!
  );
  for (const [i, name] of names.entries()) {
    const tag = pinned[i] !== null ? "kept" : "new";
    say(`  #${i + 1} ${name.name} (${namingInputs[i].size} artists, ${tag}) — ${name.description}`);
  }

  // ── 5. WRITE ───────────────────────────────────────────────────────────
  banner("write");
  const { deleted } = await linerNotes.clearGraph();
  say(`cleared previous graph (${deleted} rows) — full rebuild model`);
  const neighborhoodIds = await linerNotes.insertNeighborhoods(names);
  const neighborhoodIdByArtist = new Map<string, string>();
  realHoods.forEach(([, ids], index) => {
    for (const id of ids) neighborhoodIdByArtist.set(id, neighborhoodIds[index]);
  });

  const nodeRows = [...nodeAgg.entries()].map(([artistId, agg]) => ({
    artistId,
    spinCount: agg.spinCount,
    firstAired: agg.firstAired,
    lastAired: agg.lastAired,
    stations: [...agg.stations].sort(),
    neighborhoodId: neighborhoodIdByArtist.get(artistId),
    bridgeScore: bridgeScore(artistId),
  }));
  const edgeRows = [...curationEdges, ...canonicalEdges];
  for (let i = 0; i < nodeRows.length; i += graphConfig.insertChunk) {
    await linerNotes.insertNodes(nodeRows.slice(i, i + graphConfig.insertChunk));
  }
  for (let i = 0; i < edgeRows.length; i += graphConfig.insertChunk) {
    await linerNotes.insertEdges(edgeRows.slice(i, i + graphConfig.insertChunk));
  }
  say(`wrote ${nodeRows.length} nodes, ${edgeRows.length} edges, ${names.length} neighborhoods`);

  // ── 6. SUMMARY & DATAHUB ───────────────────────────────────────────────
  banner("document");
  const topBridges = [...nodeRows]
    .sort((a, b) => (b.bridgeScore ?? 0) - (a.bridgeScore ?? 0))
    .slice(0, 5)
    .map((n) => `${displayNameById.get(n.artistId)} (${n.bridgeScore})`);
  const summary = [
    `Influence graph build (${mode} mode, ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC)`,
    `Plays scanned: ${plays.length}${complete ? " (full history)" : " (capped)"}; ${resolvedPlays.length} resolved to catalog artists.`,
    `Nodes: ${nodeRows.length} artists with airplay.`,
    `Edges: ${curationEdges.length} curation (co-play within ${graphConfig.windowMs / 60000}min per station, weight ≥ ${minWeight}) + ${canonicalEdges.length} canonical (MusicBrainz relations).`,
    `Neighborhoods: ${names.map((n) => n.name).join(" · ") || "none"}.`,
    `Top bridge artists: ${topBridges.join(", ") || "none"}.`,
  ].join("\n");
  console.log(`\nBuild summary:\n${summary}\n`);

  say("documenting the build in DataHub (lineage + summary)...");
  try {
    const gms = new DataHubGms();
    const graphDatasets = ["graphNodes", "graphEdges", "neighborhoods"].map(
      (t) => `liner-notes.${t}`
    );
    const graphUrns = graphDatasets.map(datasetUrn);
    await gms.upsertLineage(datasetUrn("liner-notes.artists"), graphUrns);
    await gms.upsertLineage(datasetUrn("rm-playlist-v2.plays"), graphUrns);
    const statics: Record<string, string> = {
      "liner-notes.graphNodes":
        "Influence-graph nodes — one per resolved artist with airplay: spin counts, station coverage, neighborhood assignment, and bridge score.",
      "liner-notes.graphEdges":
        "Typed, weighted influence edges with receipts: curation edges from co-play across the four stations (Stell-R method), canonical edges from MusicBrainz relationships.",
      "liner-notes.neighborhoods":
        "Musical neighborhoods detected by Louvain community detection, with agent-generated district names.",
    };
    await gms.documentDatasets(
      graphDatasets.map((name) => ({
        name,
        description: `${statics[name]}\n\n---\n\n**Latest graph build**\n\n${summary}\n\n_Written by the graph build after each run._`,
      }))
    );
    say("  lineage: artists + plays → graphNodes/graphEdges/neighborhoods; summaries attached");
  } catch (error) {
    say(`  DataHub documentation degraded: ${(error as Error).message.slice(0, 160)}`);
  }

  const stats = await linerNotes.graphStats();
  say(`independent graphStats check: ${JSON.stringify(stats)}`);
}

main().catch((error) => {
  console.error(`graph build failed: ${(error as Error).stack ?? error}`);
  process.exit(1);
});
