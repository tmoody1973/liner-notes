# Handoff — Liner Notes (DataHub Agent Hackathon)

**Updated 2026-08-04 ~19:15 CDT.** M1 complete, M2 one-third done. Deadline **Aug 10, 2026 5pm EDT** (Devpost, Track 1). Next action: **build MOO-462**.

## Where truth lives (read, don't re-derive)

- **Locked scope/PRD:** `_build_plan/prd.html` · **Research:** `docs/research/stell-r-artist-influence-hdsr.md` (Appendix A = traversal pseudocode for M3/M4)
- **Linear (record of truth):** project "Liner Notes — DataHub Agent Hackathon", team Moodyco, issues MOO-459→474. Done: **459, 460, 461** (each closed with a real-evidence comment worth reading). In progress: nothing. Next: **MOO-462** (resolution+enrichment), then 463 (review UI), 464 (DataHub write-back) closes M2.
- **M1 log:** `_build_plan/milestones/1-foundation-connector/milestone-log.md` (decisions + env gotchas). M2 log gets written when 461–464 are all done (per `_build_plan/milestones/2-steward-agent/prompt.md`).
- **Workflow:** `linear-build:linear-build` skill per issue (align → In Progress → plan mode → build → verify against real data → Done with evidence). Suggested next-session skills: `linear-build:linear-build`, `claude-api` (before touching agent LLM code), `superpowers:verification-before-completion`.

## Running state (live right now on this machine)

- **DataHub quickstart is running** in Docker (GMS :8080 healthy, UI :9002, login datahub/datahub). Both Convex deployments ingested: 30 datasets under containers `rm-playlist-v2` (18) + `liner-notes` (12). If Docker restarts: `connector/.venv/bin/datahub docker quickstart` (may need one rerun after a MySQL healthcheck race).
- **Convex:** liner-notes deployment `dev:dusty-crocodile-663` (client config in `convex/.env.local`). Source = rm-playlist-v2 **dev** `precise-fish-444` — **prod is empty**, dev holds the real data (166k+ plays). Keys in root `.env.local` (gitignored; values quoted — they contain `|`).
- **Steward work queue:** `workItems` has 1,055 rows, **all status "deferred"** from the MOO-461 chassis runs. MOO-462's resolver should process `pending` items — decide whether to reset deferred→pending (add a small mutation) or treat deferred as the resolver's intake. `stewardRuns` has 5 run records with Claude-written reports.

## Env & tooling gotchas (hard-won)

- Root `.env.local`: `CONVEX_SOURCE_URL`, `CONVEX_SOURCE_DEPLOY_KEY` (scope data:view), `CONVEX_LINER_NOTES_DEPLOY_KEY`, `ANTHROPIC_API_KEY`, `DISCOGS_TOKEN` (+KEY/SECRET), `PERPLEXITY_API_KEY`. All verified working 2026-08-04.
- Python 3.14 is system default — too new for acryl-datahub; connector venv is `connector/.venv` (py3.11 via uv). `uvx` available (agent spawns `uvx mcp-server-datahub`).
- Plain `npx convex dev --once` from `convex/` silently targets an anonymous LOCAL deployment — always confirm `convex/.env.local` says `dev:dusty-crocodile-663` after configure.
- Disk was at 100% earlier today (corrupted Docker VM, since reset). ~35-48GB free now. **~92GB of node_modules/.venv junk in `~/Documents/Projects` still reclaimable** — bulk `rm -rf` was permission-blocked for the agent; Tarik can run the find command (in scrollback / re-derive: find node_modules,.next,.venv,venv,__pycache__,.turbo dirs, rm -rf).
- **Odesli public API is dead (410 since Aug 1).** Allowlist application submitted. Fallback plan A/B/C recorded as a comment on MOO-471 (song.link URL construction from appleMusicSongId; SonoVault; allowlist).

## MOO-462 implementation notes (what the chassis already gives you)

- Swap the defer handler in `agent/src/session.ts` (marked `ponytail:` comment) with real resolution. Plumbing that exists: `agent/src/polite.ts` (politeFetchJson: per-host spacing, backoff, file cache — REQUIRED for MusicBrainz 1 req/s), `agent/src/convex.ts` (LinerNotesClient wrapping `convex/convex/steward.ts` functions), `agent/src/report.ts` (Claude claude-opus-5 pattern with refusal fallback — reuse for LLM adjudication).
- Convex `artists` table (schema.ts) has the resolution record shape: `{method, confidence, evidence, runId}` + rawNames[] — designed for the three buckets (auto-apply / LLM-adjudicated / human review). `reviewItems` table ready for the review bucket (MOO-463 renders it).
- MusicBrainz: no key, polite UA string required (e.g. `LinerNotes/0.1 (tarik@radiomilwaukee.org)`), 1 req/s. Discogs token in env. Deezer public.
- Real sample messiness to design against: "414Music.FM" (station name as artist, 80 plays — should hit the ignore path or review), casing variants, "feat." strings.
- Judge mode (`--mode=judge`) must keep working — its 91 sample items resolve against real MusicBrainz.

## Standing decisions (do not reopen)

Source is read-only (enforced by key scope). Steward writes only to liner-notes deployment. No audio features (tag/genre similarity instead). Scope questions are settled — new ideas become Linear issue comments, not scope changes. `_build_plan/` is temporary docs, never imported by code.
