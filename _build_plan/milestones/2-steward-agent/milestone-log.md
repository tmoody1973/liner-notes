# Milestone 2 — Steward Agent — log

## What's new in the app

- **The agent now does real work on the real backlog.** One command (`npm run steward -- --mode=real`) runs a narrated stewardship session: you watch it read the catalog, scan 20k+ plays, and decide artist by artist — "auto-applied," "asking Claude…," "review queue," or "ignored" — with its reasoning printed as it goes.
- **1,055 messy artist names are being worked down.** As of this log: ~262 resolved to canonical identities, every applied change carrying method, confidence, evidence, and run ID. Misspellings, "A / B" collabs, and station branding strings are all handled by explicit rules.
- **A human review page** (`/review`, phone-friendly): the judgment calls the agent refused to guess on appear as cards with candidates, evidence scores, and Claude's note; approve or reject in one tap. Real decisions already recorded — including a bulk human policy call that resolved 70 local 414 Music artists (who correctly have no MusicBrainz entry) as first-class local artists.
- **The agent documents itself in DataHub like a responsible employee.** Open the DataHub UI and see: three quality health checks it maintains (resolution coverage, duplicate reviews, enrichment coverage — red/green with history), the lineage map from raw plays to resolved artists/tracks, a plain-English run report on each dataset's Documentation tab, and "Liner Notes Steward (agent)" listed as owner on all 31 datasets.
- **It reads its own paper trail.** Every session starts by quoting the health checks the previous session wrote ("Resolution coverage: FAILURE, 15.6%…") before planning work — the catalog is the agent's working memory, not a display case.
- **Enriched artists:** genres, artist-artist relationships (saved for the M3 graph), release years, ISRCs, images, and streaming links (SonoVault) — enrichment coverage went 25% → 100% in one session, on camera.

## What was built

- **Agent** (`agent/src/`, TypeScript, ~15 modules): `session.ts` (5-phase session: Orient → Detect → Resolve → Enrich → Document, SIGINT-graceful, `--max-items` bound), `resolve.ts` (MusicBrainz scoring + corroboration gate + branding ignore rules), `adjudicate.ts` (Claude adjudication, reasoning persisted), `enrich.ts` (MusicBrainz relations/Discogs/Deezer/SonoVault), `datahub.ts` (official DataHub MCP Server client — Orient reads the graph through the same interface any MCP agent would), `gms.ts` (GMS GraphQL write-back client), `worklist.ts`, `source.ts` (real vs judge mode), `polite.ts` (rate-limited, disk-cached HTTP), `report.ts` (Claude-written run reports), `narrate.ts`, `convex.ts`.
- **Convex steward backend** (`convex/convex/steward.ts`): idempotent worklist seeding, per-item resolution mutations with field-level provenance, review queue (approve → `method:"human"` resolution; reject → retract + ignore), `datahubStats` (assertion source + independent verification count), `resolveLocalArtists` (bulk 414music disposition), dedupe maintenance.
- **Review page** (`web/app/review/`): pending cards with candidates/evidence/adjudicator notes, one-tap approve/reject against live Convex.
- **DataHub write-back** (`agent/src/gms.ts`): 3 custom assertions with stable URNs via `upsertCustomAssertion` + `reportAssertionResult` (OSS-compatible), `updateLineage` (plays → artists/tracks/workItems), composed Documentation (stable description + latest run report) via `updateDescription`, corpuser registration + `batchAddOwners` on all datasets.
- **Infra:** DataHub quickstart moved to a Linode 8GB VM (Tarik's Mac couldn't run quickstart + browser + recorder); SSH-tunnel access keeps every config on `localhost`. Judges still run local quickstart — nothing in the repo references the VM.

## Decisions not pre-specified in the PRD

1. **Corroboration gate (the Dialogues lesson):** name similarity alone NEVER auto-applies, no matter how high the score — auto requires total ≥0.85 AND name ≥0.85 AND positive genre-or-era corroboration. Born from a real false positive (raw "Dialogues" → wrong band "Dialogue"); a regression self-check (`npm run check`) locks it in.
2. **414 Music-only artists skip external enrichment and resolve as local artists without MBIDs** (Tarik's calls): they're direct station uploads that don't exist in MusicBrainz by design. 70 were bulk-resolved with `method:"human"` provenance rather than left to clog the review queue.
3. **Assertions live on `rm-playlist-v2.plays`** (the steward's inbox — all three checks describe how well that backlog is being worked), with stable assertion URNs so sessions update in place instead of piling up.
4. **Write-back goes through GMS GraphQL directly from Node** (the MCP server exposes no write tools); Orient still reads via MCP with GraphQL for assertion state. Thresholds: resolution ≥50%, duplicates =0, enrichment ≥80% — resolution starts red on purpose so improvement is visible.
5. **Streaming links via SonoVault** (Starter plan key) after the Odesli public API died Aug 1; client verified against the live API. Deezer-via-ISRC and UI buttons deferred to M4.
6. **Run report and static description share one Documentation tab** (composed, not overwritten) so "datasets carry descriptions" and "run report attached as documentation" don't fight over the same field.

## Things the next milestone (M3 — graph build) needs to know

- **`artists.mbRelations` is already populated** by enrichment — canonical edges are a read, not a fetch. Curation edges come from co-play per the Stell-R method (`docs/research/stell-r-artist-influence-hdsr.md` Appendix A).
- **Local artists (no MBID) exist and are first-class** — the graph build must not assume every artist has an MBID.
- Backlog drain may still be running (`/tmp/steward-drain-run2.log`); sessions are resumable/idempotent — `npm run steward -- --mode=real` continues. Don't run two sessions concurrently (MusicBrainz politeness).
- DataHub is on the Linode VM via SSH tunnel — see `docs/HANDOFF.md` for the tunnel one-liner and credentials; **delete the VM after submission**.
- `steward:datahubStats` is the one source of truth for coverage numbers (assertions + verification both use it).
- M3's build should add its own lineage (resolved → graph tables) and could reuse `gms.ts` as-is.

## Deviations from the PRD

- **None in scope.** All "What gets built" items shipped; all "Not in this milestone" boundaries held (no graph, no listener UI, no Perplexity, no scheduled runs, no hand-editing in review).
- Environmental: DataHub runs on a VM for the builder's workflow (demo-recording RAM); the judge path is unchanged local quickstart.

## Verification evidence

Tracked in Linear (MOO-459…464, each Done with evidence comments + attachments) and `docs/evidence/`:

- **Resolution against real backlog (MOO-462):** 200-item run — 47 auto with evidence strings, 13 review, 1 LLM-adjudicated with persisted reasoning, 34 enriched; corroboration-gate regression in `npm run check`; 10/10 spot-checked MBIDs correct.
- **Review page (MOO-463):** live approves/rejects with human provenance (Ellie Jackson approved, Dialogues rejected); ~36 rejections + ~13 approvals from phone triage on 2026-08-05.
- **Write-back + closed loop (MOO-464):** before/after DataHub screenshots (no assertions → 2 red + 1 green → enrichment flipped green at 100%), lineage graph rendered, run report on Documentation tab; session N+1's Orient quoting session N's assertion state verbatim; assertion values exactly matching independent Convex counts (166/1055, 0 dups, 131/131 at verification time).
- **PRD "Done when" check:** session against real backlog resolves into Liner Notes ✓ · ambiguous items appear on the review page and can be approved ✓ · DataHub UI shows refreshed assertions, lineage, and the session's run report ✓.
