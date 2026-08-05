# Handoff — Liner Notes (DataHub Agent Hackathon) → next: M2 milestone log, then M3

**Updated 2026-08-05 ~07:00 CDT.** **M2 is COMPLETE** — MOO-459/460/461/462/463/464 all Done with evidence comments. Deadline **Aug 10, 2026 5pm EDT** (Devpost, Track 1) — Tarik manages deadline pressure; do the job properly, don't cut corners to save time.

## Next actions (in order)

1. **M2 milestone log:** write `_build_plan/milestones/2-steward-agent/milestone-log.md` per that folder's `prompt.md` (starts with "## What's new in the app" for non-technical readers).
2. **M3 (graph build):** `artists.mbRelations` is already populated for canonical edges; curation edges from co-play per the Stell-R method in `docs/research/stell-r-artist-influence-hdsr.md` Appendix A.
3. Workflow stays `linear-build:linear-build` (align → In Progress → build → verify vs real data → Done + evidence comment). Load `claude-api` before touching agent LLM code.

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

- **Full-backlog drain running** with write-back code since ~06:53 CDT (`/tmp/steward-drain-run2.log`, started from 733 pending of 1,055; ~1 item/min on low-play ambiguous strings → many hours; kill/restart safe, `npm run session -- --mode=real` resumes). It refreshes assertions at its end. The earlier 05:45 drain was SIGINT'd cleanly at 06:33 (old code, no write-back — that's why its report says "could not reach DataHub").
- **Queue at 06:57:** pending 733 / resolved 166 / review 154 / ignored 2. **Review page `/review` has ~154 pending** — Tarik phone-triage anytime; human-approved rows make better demo material.
- Resolution pipeline (MOO-462) unchanged: corroboration gate, `npm run check` runs the regression self-check.
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
