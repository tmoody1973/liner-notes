// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { LinerNotesClient } from "./convex.js";
import { DataHubMcp, summarizeAssertions } from "./datahub.js";
import { phaseBanner, say } from "./narrate.js";
import { writeReport } from "./report.js";
import { detectMode, readPlays, type SourceMode } from "./source.js";
import { buildWorklist } from "./worklist.js";

const SOURCE_PLAYS_DATASET = "rm-playlist-v2.plays";

export async function runSession(explicitMode?: string): Promise<void> {
  const mode: SourceMode = detectMode(explicitMode);
  const linerNotes = new LinerNotesClient();
  const datahub = new DataHubMcp();

  let interrupted = false;
  process.on("SIGINT", () => {
    if (interrupted) process.exit(130); // second ^C: hard exit
    interrupted = true;
    say("interrupt received — finishing current item, then documenting the session");
  });

  console.log(`Liner Notes steward session — source mode: ${mode}`);
  const runId = await linerNotes.startRun();
  say(`run record ${runId} opened in Convex`);

  // ── 1. ORIENT ──────────────────────────────────────────────────────────
  phaseBanner("orient");
  let datasets: { name: string; urn: string }[] = [];
  let assertionSummary = "DataHub MCP not reachable";
  try {
    say("connecting to DataHub via MCP Server (uvx mcp-server-datahub)...");
    await datahub.connect();
    const tools = await datahub.listToolNames();
    say(`MCP session up — server exposes: ${tools.join(", ")}`);
    datasets = await datahub.searchConvexDatasets();
    say(`search("platform:convex") → ${datasets.length} datasets in the context graph`);
    for (const d of datasets.slice(0, 6)) say(`  · ${d.name}`);
    if (datasets.length > 6) say(`  · … and ${datasets.length - 6} more`);

    const playsUrn = datasets.find((d) => d.urn.includes(SOURCE_PLAYS_DATASET))?.urn;
    if (playsUrn) {
      const entity = await datahub.getEntity(playsUrn);
      assertionSummary = summarizeAssertions(entity);
      say(`source backlog dataset: ${SOURCE_PLAYS_DATASET}`);
      say(`assertion state: ${assertionSummary}`);
    } else {
      assertionSummary = "plays dataset not found in DataHub — run the connector ingest first";
      say(assertionSummary);
    }
  } catch (error) {
    say(`DataHub orientation degraded: ${(error as Error).message}`);
  }

  // ── 2. DETECT ──────────────────────────────────────────────────────────
  phaseBanner("detect");
  say(`reading plays from ${mode === "real" ? "rm-playlist-v2 streaming export" : "judge-mode sample data"}...`);
  const { plays, complete } = await readPlays(mode, linerNotes);
  say(`${plays.length} plays scanned${complete ? "" : " (capped scan — more exist)"}`);
  const worklist = buildWorklist(plays);
  say(`${worklist.length} distinct raw artist strings need stewardship`);
  const { created } = await linerNotes.seedWorklist(worklist);
  say(`worklist seeded: ${created} new work items (${worklist.length - created} already queued — idempotent upsert)`);
  say("prioritized worklist (top 10 by airplay):");
  for (const entry of worklist.slice(0, 10)) {
    say(`  ${String(entry.playCount).padStart(4)} plays · "${entry.rawArtist}" · ${entry.stationSlugs.join(", ")}`);
  }

  // ── 3/4. RESOLVE + ENRICH ──────────────────────────────────────────────
  const counts: Record<string, number> = {};
  for (const phase of ["resolve", "enrich"] as const) {
    phaseBanner(phase);
    if (phase === "enrich") {
      say("enrichment operates on resolved artists — nothing resolved yet (resolver lands in MOO-462)");
      continue;
    }
    while (!interrupted) {
      const pending = await linerNotes.pendingItems(500);
      if (pending.length === 0) break;
      say(`${pending.length} pending work items in this batch`);
      for (const item of pending) {
        if (interrupted) break;
        // ponytail: chassis handler defers every item; MOO-462 replaces this
        // with MusicBrainz/Discogs/Deezer resolution + confidence buckets.
        await linerNotes.markItem(item._id, "deferred", runId);
        counts.deferred = (counts.deferred ?? 0) + 1;
        say(`"${item.rawArtist}" (${item.playCount} plays) → deferred (resolver not implemented yet)`);
      }
    }
    if (interrupted) say("stopping early — remaining items stay pending for the next session");
  }

  // ── 5. DOCUMENT ────────────────────────────────────────────────────────
  phaseBanner("document");
  const stats = {
    mode,
    playsScanned: plays.length,
    scanComplete: complete,
    distinctArtists: worklist.length,
    newWorkItems: created,
    counts,
    datahubDatasets: datasets.length,
    assertionSummary,
    interrupted,
  };
  say("asking Claude to write the run report...");
  const report = await writeReport(stats);
  await linerNotes.finishRun(runId, counts, report);
  say(`run record ${runId} closed`);
  console.log(`\nRun report:\n${report}\n`);

  const queue = await linerNotes.workItemCounts();
  say(`work queue now: ${JSON.stringify(queue)}`);

  await datahub.close();
  if (interrupted) process.exitCode = 130;
}
