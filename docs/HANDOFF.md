# Handoff — Liner Notes (DataHub Agent Hackathon) → next: M4 (discovery app)

**Updated 2026-08-05 ~14:45 CDT.** **M1, M2, AND M3 are COMPLETE** — MOO-459…466 all Done with evidence comments; milestone logs written for all three. **The full 1,055-item backlog is DRAINED** (0 pending; 672 resolved / 304 review / 79 ignored) and **all three DataHub assertions are GREEN** (resolution 63.7%, duplicates 0, enrichment 100% — `docs/evidence/moo464-assertions-all-green.png`, follow-up comment on MOO-464). No steward session needs to run again except for the demo itself. Deadline **Aug 10, 2026 5pm EDT** (Devpost, Track 1) — Tarik manages deadline pressure; do the job properly, don't cut corners to save time.

## Next actions (in order)

1. **M4 (discovery app):** MOO-467 (app shell + search + graph explorer), MOO-468 (pathfinder + playlists), MOO-469 (receipts + trust chips), MOO-470 (neighborhood map + bridges), MOO-471 (streaming links — SonoVault backfill/Deezer/UI buttons). Read `_build_plan/milestones/4-discovery-app/prompt.md` first (plan mode + Tarik's confirmation, per pattern). Stell-R traversal algorithms (K-BFS, Dijkstra with `1/(w+1)`, max-flow, intersections) are in the research doc's Appendix A.
2. Workflow stays `linear-build:linear-build` (align → In Progress → build → verify vs real data → Done + evidence comment). Load `claude-api` before touching agent LLM code.

## M3 graph (done — what M4 consumes)

- **Current graph (built 09:11 CDT on the fully drained catalog):** 604 nodes, **39,609 receipted edges** (39,594 curation + **15 canonical**), 4 neighborhoods, bridge scores on every node. `npm run graph -- --mode=real` rebuilds in ~4 min; deterministic (weight = co-play count in 60-min windows per station; ≥2 floor real / ≥1 judge).
- **Neighborhoods (Claude-named; regenerate same-spirit not verbatim — DON'T rebuild between demo rehearsal and recording):** Bronzeville Beat Loop (175, hip-hop/R&B), Riverwest Synth Blocks (282, DIY/local), Walker's Point Neo-Soul (66), Bay View Indie Row (63, indie rock). Top bridges: Twan Mack (1.0), Immortal Girlfriend, B Free, NILEXNILE, Shonn Hinton & Shotgun — all Milwaukee connectors.
- Ready-made Convex queries for M4: `graph:edgeBetween(a,b)` (receipts panel), `graph:neighborhoodAnchors` (hood cards), `graph:graphStats` (paginated server-side; `LinerNotesClient.graphStats()` aggregates). Graph is dense — filter explorer rendering by weight (≥5) or top-N per node.
- `npm run graph:verify` = independent edge recount + MusicBrainz checks. `npm run check` runs resolver + coplay self-checks.
- **Convex scale limits bit twice — pattern to remember:** mutations cap at 4096 reads (clearGraph chunks + client loops) and queries cap at 32k docs (graphStats paginates). Any new M4 query touching graphEdges (~40k rows) must paginate or use `by_from`/`by_to` index ranges.

## DataHub on Linode (LIVE — this is the workspace instance)

- VM: Linode g6-standard-4 8GB, id `102316033`, IP `172.236.98.82`, us-ord, ~$0.072/hr — **delete after submission** (`linode-cli linodes delete 102316033`). Credentials in root `.env.local` (`DATAHUB_VM_*`); SSH key `~/.ssh/id_ed25519` (created 2026-08-05).
- Firewall `106954480`: inbound SSH only. DataHub is reached via **SSH tunnel**, so everything still says localhost:
  `ssh -fN -L 9002:localhost:9002 -L 8080:localhost:8080 root@172.236.98.82`
  UI `http://localhost:9002` (datahub/datahub), GMS `http://localhost:8080` (unauthenticated as system actor — fine, port never exposed). **If DataHub "disappears", the tunnel died — rerun that ssh line.** Tarik asked about public access; explained tunnel vs open-port vs Tailscale — no decision made, tunnel remains.
- Ingest re-ran against the VM 2026-08-05: 31 datasets, 229 events, 0 failures. Recipe unchanged (`sink: http://localhost:8080` via tunnel). Judges/README unaffected — they run local quickstart.

## MOO-464 write-back (done — how it works)

- `agent/src/gms.ts`: GMS GraphQL client. Three custom assertions on `rm-playlist-v2.plays` with **stable URNs** (`urn:li:assertion:liner-notes-{resolution-coverage,duplicate-reviews,enrichment-coverage}`) via `upsertCustomAssertion` + `reportAssertionResult` (OSS-compatible; MCP server has no write tools). Lineage `updateLineage` plays → artists/tracks/workItems. Docs: stable per-dataset description + latest run report composed into one Documentation tab (`updateDescription`), on plays/artists/tracks/workItems. Ownership: registers corpuser `liner-notes-steward` via OpenAPI v3, then `batchAddOwners` technical owner on all 31 datasets.
- Closed loop: Orient calls `gms.readAssertionState(playsUrn)` (GraphQL `dataset.assertions` + latest runEvents) and narrates it; falls back to the old MCP regex if GMS is down. Session end (DOCUMENT phase) refreshes everything; safe on failure (degrades with a `say`, session still exits 0).
- Thresholds: resolution ≥50% (red until backlog drains — intentional), duplicates =0, enrichment ≥80% (**flipped red→green 25%→100% during session N** — the money screenshot).
- `steward:datahubStats` (Convex) is both the assertion source and the independent verification count — verified exact match (166/1055, 0, 131/131).
- Evidence: `docs/evidence/moo464-*` + 6 attachments and full comment on MOO-464.
- GraphQL gotcha: custom type label lives at `info { customAssertion { type } }`, NOT `info { customType }` (FieldUndefined on 1.7.0 quickstart). Introspect, don't guess: `__type(name: "...")`.

## Current data/system state

- **Drain COMPLETE (09:07 CDT, exit 0, all assertions green).** No steward session running; none needed except as demo footage. Run `npm run session -- --mode=real` anytime for fresh terminal footage — it's idempotent (worklist upserts; resolve loop finds 0 pending; write-back refreshes assertions with current numbers). Session logs from today: `/tmp/steward-session-N.log`, `-N1.log`, `/tmp/steward-drain-run3.log` (the one that finished).
- **Queue end-state: 0 pending / 672 resolved / 304 review / 79 ignored of 1,055.** Review page `/review` has **~304 pending** — optional Tarik phone-triage (top-down by airplay); ~50 human decisions already recorded (incl. bulk 414music local-artist resolution of 70 via `steward:resolveLocalArtists`).
- **Catalog: 613 artists, all enriched.** Local artists (no MBID) are first-class.
- Resolution pipeline (MOO-462) unchanged: corroboration gate, `npm run check` runs the regression self-checks (resolver + coplay).
- SonoVault (MOO-471 plan A): remaining work is backfill pre-key tracks, Deezer ISRC lookup, UI buttons (M4).
- Convex: liner-notes `dev:dusty-crocodile-663`; source `precise-fish-444` read-only.
- Standing rule: 414music-only artists skip external enrichment; station branding strings get ignored.

## Env & tooling gotchas (hard-won)

- Python 3.14 system default too new for acryl-datahub → use `connector/.venv` (py3.11). VM runs py3.12 + pipx datahub CLI 1.7.0 fine.
- Plain `npx convex dev --once` silently targets an anonymous LOCAL deployment — confirm `convex/.env.local` says `dev:dusty-crocodile-663`.
- MusicBrainz 1.1s/req + UA `LinerNotes/0.1 (tarik@radiomilwaukee.org)`; all external HTTP through `agent/src/polite.ts` (cache in `agent/.cache/`). `--max-items=N` bounds the resolve phase only — **enrich phase is unbounded** (fine now; whole enrichment backlog cleared).
- Don't run two sessions concurrently (MusicBrainz politeness + review-row races; dedupe mutation exists as cleanup).
- Screenshots/evidence in `docs/evidence/`; Linear attachments via prepare_attachment_upload (exact byte size, `stat -f%z`, one file at a time). Playwright MCP (headless) worked well for DataHub UI screenshots — quickstart auto-authenticates; dismiss onboarding popups before shooting.
- `.agents/`, `.claude/`, `skills-lock.json` untracked — decide at M5 whether to gitignore.
- Tarik's disk ~16GB free; ~92GB reclaimable in `~/Documents/Projects` (Tarik runs the cleanup himself).

## Standing decisions (do not reopen)

Source read-only; steward writes only to liner-notes. No audio features. Scope settled — new ideas → Linear comments, not scope changes. `_build_plan/` never imported by code. SonoVault > song.link hack. 414music-only = no external enrichment. DataHub on Linode VM (tunnel, not public) for Tarik's workflow; local quickstart remains the judge story. Assertions live on rm-playlist-v2.plays (the steward's inbox); stable assertion URNs so sessions update in place.
