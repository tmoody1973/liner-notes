# Handoff — Liner Notes (DataHub Agent Hackathon) → next: MOO-464

**Updated 2026-08-05 ~06:10 CDT.** M1 done; M2 needs only **MOO-464** (459/460/461/462/463 all Done with evidence comments). Deadline **Aug 10, 2026 5pm EDT** (Devpost, Track 1) — Tarik manages deadline pressure; do the job properly, don't cut corners to save time.

## Next action: MOO-464 — DataHub write-back (assertions, lineage, run reports)

Issue spec (read it in Linear for the checklists): the agent documents its own work into DataHub — the judges' highest-weighted criterion. Acceptance: (1) quality assertions the agent maintains each session (resolution coverage %, duplicate count, enrichment coverage, pass/fail); (2) lineage rm-playlist-v2 raw → liner-notes resolved; (3) plain-English run report attached as dataset documentation; (4) owners + descriptions on datasets; (5) **the closed loop** — session N+1's Orient phase provably consumes what session N wrote. Verification: DataHub UI screenshots (assertions red→improved, lineage graph, report on dataset), session N+1's worklist quoting session N's assertion state, assertion coverage % matching an independent Convex count side-by-side. Out of scope: alerts, domains/glossaries/policies, custom DataHub UI.

Workflow: `linear-build:linear-build` skill (align → In Progress → plan mode → build → verify vs real data → Done + evidence comment). Load `claude-api` before touching agent LLM code.

### Step 0 for MOO-464: DataHub on the Linode VM (decided, do not relitigate)

Local Docker DataHub is **stopped** (Tarik's M3/16GB can't run quickstart + browser + recorder; demo video is a hard requirement). Decision: **Linode 8GB VM (~$0.072/hr ≈ $9/wk), delete after submission**. `linode-cli` is installed **and authenticated** (`linode-cli regions list` works). Setup sketch:
1. `linode-cli linodes create --type g6-standard-4 --region us-ord --image linode/ubuntu24.04 --label datahub-hackathon --root_pass <generate>` (g6-standard-4 = 8GB; us-ord = Chicago, closest to Milwaukee).
2. Firewall: lock inbound 8080/9002 to Tarik's IP (linode-cli firewalls), SSH open.
3. On VM: install Docker + python3.11/pipx → `datahub docker quickstart` (login datahub/datahub).
4. Re-run ingest against the VM: `connector/recipes/convex.yml` sink `server:` → `http://<vm-ip>:8080` (currently `http://localhost:8080`), run with `connector/.venv/bin/datahub ingest -c connector/recipes/convex.yml` (needs root `.env.local` sourced — keys are quoted, contain `|`). ~2 min, lands 30 datasets under containers `rm-playlist-v2` + `liner-notes`.
5. Agent: set `DATAHUB_GMS_URL=http://<vm-ip>:8080` in root `.env.local` (agent/src/datahub.ts defaults to localhost:8080; it spawns `uvx mcp-server-datahub` which reads DATAHUB_GMS_URL/DATAHUB_GMS_TOKEN).
6. Judges/README unaffected — they run local quickstart; the VM is Tarik's workspace only (rules verified: datahub.devpost.com/rules requires public Apache-2.0 repo + working URL + <3min video; local DataHub explicitly blessed).

### Write-back implementation notes

- **DataHub skills installed** (`.agents/skills/`, Claude Code symlinked): `datahub-quality` (assertions/incidents — READ THIS ONE for MOO-464), `datahub-enrich` (descriptions/owners/tags), `datahub-lineage`, `datahub-search`, `datahub-setup`, plus connector-standards skills for the M5 upstream PR. Use them.
- Write path options: the acryl-datahub Python SDK/CLI (connector venv already has it) or the MCP server's tools (read-mostly — check `datahub.listToolNames()` output: search, get_lineage, get_dataset_queries, get_entities, list_schema_fields, get_lineage_paths_between — **no write tools**, so write-back goes through the Python SDK from a small script the agent shells out to, or the REST emitter from Node — decide in plan mode; the Python emitter (`datahub.emitter.rest_emitter`) in the connector venv is the proven path).
- The closed loop already half-exists: `agent/src/session.ts` Orient phase reads assertions via `summarizeAssertions(entity)` (`agent/src/datahub.ts`) and narrates them; it currently prints "no assertions recorded yet". After write-back, that same line becomes the proof for "session N+1 consumes session N".
- Coverage numbers come from `steward:workItemCounts` (Convex) — the same query is the independent count for the side-by-side verification.
- Run reports: `stewardRuns.report` rows (Claude-written) already exist per session — attach latest to the datasets as documentation (dataset description or institutionalMemory aspect).

## Current data/system state

- **Full-backlog drain session** may still be running (`/tmp/steward-drain-run.log`; started ~05:45 CDT, ~2h expected). Last check: 134 resolved / 92 review / 2 ignored / 827 pending of 1,055. Resumable & idempotent — kill/restart safe; if dead, `npm run steward -- --mode=real` continues where it left off. **Run it (or a fresh session) again after write-back lands for the before/after assertion screenshots.**
- **Review page live (MOO-463):** `/review` — `npm run dev --workspace @liner-notes/web`, needs `web/.env.local` (`NEXT_PUBLIC_CONVEX_URL=https://dusty-crocodile-663.convex.cloud`, exists). Mutations `steward:pendingReviews/approveReview/rejectReview`. Real decisions already made: Ellie Jackson approved (`method:"human"`), Dialogues rejected (workItem ignored). ~90+ items pending — **Tarik can triage on his phone anytime; more human-approved rows make better demo material.**
- **Resolution pipeline (MOO-462):** buckets auto (needs total ≥0.85 AND name ≥0.85 AND positive genre-or-era corroboration — name-only matches NEVER auto-apply; see the Dialogues false-positive story in MOO-462's evidence comment) / Claude-adjudicated (reasoning persisted) / review / ignored. `npm run check` (agent) runs the resolver self-check incl. that regression.
- **SonoVault (MOO-471 plan A, Tarik's call — do not demote):** Starter plan key LIVE in root `.env.local` (`SONOVAULT_API_KEY`, 50k req/mo). Client `agent/src/sonovault.ts` verified against live API; enrichment writes `tracks.streamingLinks`. Observed gap: no Spotify/Apple links on test tracks (Discogs/MB/YouTube only) — fallbacks: song.link URL from appleMusicSongId, then search links; Deezer via Deezer's own ISRC lookup. Remaining 471 work: backfill pre-key tracks, Deezer lookup, UI buttons (M4).
- **Convex:** liner-notes `dev:dusty-crocodile-663` (app data); source rm-playlist-v2 dev `precise-fish-444` **read-only** (`data:view` key — cannot write, by design). `npx convex data <table>` / `npx convex run steward:<fn>` from `convex/` for inspection.
- **Standing rule from Tarik:** 414music-only artists skip external enrichment (direct local uploads). Station branding raw strings get ignored.

## After MOO-464

Write `_build_plan/milestones/2-steward-agent/milestone-log.md` per that folder's `prompt.md` (starts with "## What's new in the app" for non-technical readers), then M3 (graph build — `artists.mbRelations` is already populated for canonical edges; curation edges from co-play per the Stell-R method in `docs/research/stell-r-artist-influence-hdsr.md` Appendix A).

## Env & tooling gotchas (hard-won)

- Python 3.14 system default too new for acryl-datahub → use `connector/.venv` (py3.11).
- Plain `npx convex dev --once` silently targets an anonymous LOCAL deployment — confirm `convex/.env.local` says `dev:dusty-crocodile-663`.
- MusicBrainz 1.1s/req + UA `LinerNotes/0.1 (tarik@radiomilwaukee.org)`; all external HTTP through `agent/src/polite.ts` (disk cache in gitignored `agent/.cache/`). `--max-items=N` bounds a session.
- Screenshots/evidence live in `docs/evidence/`; Linear attachments via prepare_attachment_upload (exact byte size required — `stat -f%z` first).
- `.agents/`, `.claude/`, `skills-lock.json` untracked (installed skills/tooling) — decide at M5 whether to gitignore.
- Tarik's disk ~16GB free; ~92GB reclaimable in `~/Documents/Projects` (Tarik runs the cleanup himself).

## Standing decisions (do not reopen)

Source read-only; steward writes only to liner-notes. No audio features. Scope settled — new ideas → Linear comments, not scope changes. `_build_plan/` never imported by code. SonoVault > song.link hack. 414music-only = no external enrichment. DataHub on Linode VM for Tarik's workflow; local quickstart remains the judge story.
