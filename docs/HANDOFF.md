# Handoff — Liner Notes (DataHub Agent Hackathon)

**Updated 2026-08-05 ~05:50 CDT.** M1 done; M2 needs only MOO-464 (461/462/463 closed). Deadline **Aug 10, 2026 5pm EDT** (Devpost, Track 1) — Tarik manages deadline pressure; don't cut corners to save time. Next action: **build MOO-464** (DataHub write-back) — set up the Linode 8GB VM first (linode-cli installed AND authenticated).

## Where truth lives (read, don't re-derive)

- **Locked scope/PRD:** `_build_plan/prd.html` · **Research:** `docs/research/stell-r-artist-influence-hdsr.md` (Appendix A = traversal pseudocode for M3/M4)
- **Linear (record of truth):** project "Liner Notes — DataHub Agent Hackathon", team Moodyco, MOO-459→474. Done: **459, 460, 461, 462** (each closed with a real-evidence comment worth reading — 462's includes the false-positive story). Next: **MOO-464** (DataHub write-back) closes M2 — then write `_build_plan/milestones/2-steward-agent/milestone-log.md` per that folder's prompt.md.
- **Workflow:** `linear-build:linear-build` skill per issue (align → In Progress → plan mode → build → verify against real data → Done with evidence). Load `claude-api` before touching agent LLM code.

## Running state (live right now)

- **Full-backlog drain session running in background** (`/tmp/steward-drain-run.log`, no --max-items) with the corrected resolver. Queue at last check: 104 resolved / 71 review / 1 ignored / ~879 pending of 1,055. Resumable — kill/restart is safe; deferred items auto-requeue at session start.
- **DataHub Docker is STOPPED** (freed Tarik's 16GB M3). **Decision: Linode 8GB VM (~$9/wk, hourly) gets set up when MOO-464 starts** — Tarik must create the Linode account. Rules verified (datahub.devpost.com/rules): local quickstart is officially fine; no DataHub Cloud needed. Agent's orient phase degrades gracefully while DataHub is down.
- **Convex:** liner-notes `dev:dusty-crocodile-663`; source rm-playlist-v2 dev `precise-fish-444` read-only (`data:view` key). Keys in root `.env.local` (quoted — contain `|`).

## MOO-462 outcomes the next issues build on

- **Resolution pipeline** (`agent/src/resolve.ts`, `sources.ts`, `adjudicate.ts`, `enrich.ts`, `sonovault.ts`): score = name-sim + MB score + Discogs/Deezer cross-check + station-genre coherence + era. Buckets: ≥0.85 + name≥0.85 + **positive genre-or-era corroboration** → auto; 0.55–0.85 → Claude (claude-opus-5, structured verdict, reasoning persisted); else review. Name-only matches NEVER auto-apply (hand-check found a Virginia screamo band matched for local act "Dialogues" — see MOO-462 comment).
- **Review page shipped (MOO-463):** `web/app/review/page.tsx` at `/review` (`npm run dev` in web/; needs `web/.env.local` NEXT_PUBLIC_CONVEX_URL). Mutations: `steward:pendingReviews/approveReview/rejectReview`. Real decisions made: Ellie Jackson approved (method "human"), Dialogues rejected (workItem ignored). SonoVault key is LIVE in root .env.local (Starter, 50k/mo) — enrichment writes tracks.streamingLinks now.
- **Standing rule from Tarik: 414music-only artists skip external enrichment** (direct local uploads, not on streaming platforms). Ignore patterns catch station branding ("414Music.FM" → ignored).
- **Streaming links (MOO-471): SonoVault is plan A** (Tarik's call; full eval + API docs notes in MOO-471 comments). Client wired in `agent/src/sonovault.ts`, dormant until **Tarik creates the account** (sonovault.now/signup, free) and adds `SONOVAULT_API_KEY` to root `.env.local`. Fallbacks: song.link URL from appleMusicSongId, then search links. Deezer links come from Deezer's own ISRC lookup, not SonoVault.
- **DataHub skills installed** (`.agents/skills/`, symlinked for Claude Code): datahub-search/enrich/lineage/quality + connector-review-vs-22-standards — use for MOO-464 and the upstream connector PR. `.agents/`, `.claude/`, `skills-lock.json` are untracked; decide at M5 whether to gitignore.

## Env & tooling gotchas (hard-won)

- Python 3.14 system default too new for acryl-datahub; connector venv `connector/.venv` (py3.11). `uvx` available.
- Plain `npx convex dev --once` silently targets an anonymous LOCAL deployment — confirm `convex/.env.local` says `dev:dusty-crocodile-663`.
- MusicBrainz 1.1s/req + UA `LinerNotes/0.1 (tarik@radiomilwaukee.org)`; all HTTP via `agent/src/polite.ts` (cache in gitignored `agent/.cache/`). Full drain ≈ 2h; `--max-items=N` bounds a run.
- `npm run check` (agent) = resolver self-check incl. the Dialogues regression; `npm run typecheck` before commits.
- Disk on Tarik's Mac is tight again (~16GB free) — ~92GB of node_modules junk in `~/Documents/Projects` still reclaimable by Tarik.

## Standing decisions (do not reopen)

Source is read-only. Steward writes only to liner-notes deployment. No audio features. Scope questions settled — new ideas become Linear issue comments, not scope changes. `_build_plan/` is temporary docs, never imported by code. SonoVault > song.link hack (don't demote it again). 414music-only = no external enrichment.
