// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { adjudicate } from "./adjudicate.js";
import { LinerNotesClient } from "./convex.js";
import { DataHubMcp, summarizeAssertions } from "./datahub.js";
import { enrichOne } from "./enrich.js";
import { phaseBanner, say } from "./narrate.js";
import { writeReport } from "./report.js";
import { resolveItem, type ScoredCandidate } from "./resolve.js";
import { detectMode, readPlays, type SourceMode } from "./source.js";
import { buildWorklist } from "./worklist.js";

const SOURCE_PLAYS_DATASET = "rm-playlist-v2.plays";

const toReviewCandidates = (scored: ScoredCandidate[]) =>
  scored.map((s) => ({
    mbid: s.candidate.mbid,
    name: s.candidate.name,
    evidence: s.evidence,
    score: Number(s.total.toFixed(3)),
  }));

export async function runSession(
  explicitMode?: string,
  { maxItems }: { maxItems?: number } = {}
): Promise<void> {
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

  // ── 3. RESOLVE ─────────────────────────────────────────────────────────
  phaseBanner("resolve");
  const counts: Record<string, number> = {};
  const bump = (key: string) => (counts[key] = (counts[key] ?? 0) + 1);
  const { requeued } = await linerNotes.requeueDeferred();
  if (requeued > 0) say(`${requeued} previously deferred items requeued for retry`);
  const topTitleByRaw = new Map(worklist.map((w) => [w.rawArtist, w.topTitle]));
  const stationsByRaw = new Map(worklist.map((w) => [w.rawArtist, w.stationSlugs]));

  let processed = 0;
  let capped = false;
  resolveLoop: while (!interrupted && !capped) {
    const pending = await linerNotes.pendingItems(500);
    if (pending.length === 0) break;
    say(`${pending.length} pending work items in this batch`);
    for (const item of pending) {
      if (interrupted) break resolveLoop;
      if (maxItems !== undefined && processed >= maxItems) {
        say(`--max-items=${maxItems} reached — remaining items stay pending`);
        capped = true;
        break;
      }
      processed += 1;
      const label = `"${item.rawArtist}" (${item.playCount} plays)`;
      try {
        const decision = await resolveItem(item);
        if (decision.kind === "ignore") {
          await linerNotes.markItem(item._id, "ignored", runId);
          bump("ignored");
          say(`${label} → ignored: ${decision.reason}`);
        } else if (decision.kind === "auto") {
          const { best, method } = decision;
          await linerNotes.applyResolution({
            workItemId: item._id,
            rawArtist: item.rawArtist,
            mbid: best.candidate.mbid,
            displayName: best.candidate.name,
            method,
            confidence: Number(best.total.toFixed(3)),
            evidence: `auto-applied (${method}): ${best.evidence}`,
            runId,
          });
          bump("autoApplied");
          say(`${label} → ✔ ${best.candidate.name} [${best.candidate.mbid}] auto (${best.evidence})`);
        } else if (decision.kind === "adjudicate") {
          say(`${label} → ambiguous (top ${decision.scored[0].total.toFixed(2)}), asking Claude...`);
          const verdict = await adjudicate(item, decision.scored);
          if (verdict?.decision === "apply" && verdict.mbid) {
            const chosen = decision.scored.find((s) => s.candidate.mbid === verdict.mbid)!;
            await linerNotes.applyResolution({
              workItemId: item._id,
              rawArtist: item.rawArtist,
              mbid: verdict.mbid,
              displayName: chosen.candidate.name,
              method: "llm",
              confidence: verdict.confidence,
              evidence: `Claude adjudication: ${verdict.reasoning} (scores: ${chosen.evidence})`,
              runId,
            });
            bump("llmApplied");
            say(`  Claude → apply ${chosen.candidate.name}: ${verdict.reasoning}`);
          } else if (verdict?.decision === "ignore") {
            await linerNotes.markItem(item._id, "ignored", runId);
            bump("ignored");
            say(`  Claude → ignore: ${verdict.reasoning}`);
          } else {
            await linerNotes.queueReview({
              workItemId: item._id,
              rawArtist: item.rawArtist,
              candidates: toReviewCandidates(decision.scored),
              adjudicatorNote: verdict?.reasoning,
              runId,
            });
            bump("review");
            say(`  Claude → review${verdict ? `: ${verdict.reasoning}` : " (adjudication unavailable)"}`);
          }
        } else {
          await linerNotes.queueReview({
            workItemId: item._id,
            rawArtist: item.rawArtist,
            candidates: toReviewCandidates(decision.scored),
            runId,
          });
          bump("review");
          say(
            `${label} → review queue (${decision.scored.length === 0 ? "no MusicBrainz candidates" : `top score ${decision.scored[0].total.toFixed(2)}`})`
          );
        }
      } catch (error) {
        await linerNotes.markItem(item._id, "deferred", runId);
        bump("deferred");
        say(`${label} → deferred (${(error as Error).message.slice(0, 120)})`);
      }
    }
  }
  if (interrupted) say("stopping early — remaining items stay pending for the next session");

  // ── 4. ENRICH ──────────────────────────────────────────────────────────
  phaseBanner("enrich");
  const enrichFailed = new Set<string>();
  while (!interrupted) {
    const batch = (await linerNotes.artistsNeedingEnrichment(100)).filter(
      (a) => !enrichFailed.has(a._id)
    );
    if (batch.length === 0) break;
    say(`${batch.length} resolved artists awaiting enrichment`);
    for (const artist of batch) {
      if (interrupted) break;
      // 414music-only artists are direct local uploads — not on MusicBrainz or
      // streaming platforms; external enrichment is wasted calls (per Tarik).
      const stations = artist.rawNames.flatMap((raw) => stationsByRaw.get(raw) ?? []);
      if (stations.length > 0 && stations.every((s) => s === "414music")) {
        await linerNotes.enrichArtist({ artistId: artist._id, genres: [] });
        bump("skippedLocal");
        say(`${artist.displayName} → enrichment skipped (414music-only local artist)`);
        continue;
      }
      const topTitle = artist.rawNames
        .map((raw) => topTitleByRaw.get(raw))
        .find((t) => t !== undefined);
      try {
        const result = await enrichOne(artist, topTitle, linerNotes);
        if (result) {
          bump("enriched");
          say(
            `${artist.displayName} → ${result.genres} genres, ${result.relations} relations` +
              `${result.image ? ", image" : ""}${result.isrc ? `, ISRC` : ""}` +
              `${result.releaseYear ? `, ${result.releaseYear}` : ""}`
          );
        } else {
          enrichFailed.add(artist._id);
        }
      } catch (error) {
        enrichFailed.add(artist._id);
        say(`${artist.displayName} → enrichment failed (${(error as Error).message.slice(0, 120)})`);
      }
    }
  }
  if (counts.enriched === undefined) say("no artists awaiting enrichment");

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
