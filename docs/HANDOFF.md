# Handoff — Liner Notes (DataHub Agent Hackathon) → next: M5 (editorial, live, ship)

**Updated 2026-08-05 ~17:00 CDT.** **M1–M4 are COMPLETE** — MOO-459…471 all Done with evidence comments + attachments; milestone logs written for all four (`_build_plan/milestones/*/milestone-log.md`). The discovery app is live at `localhost:3000` (dev server usually already running — check before starting another; a stale one on port 3000 belongs to this repo). Deadline **Aug 10, 2026 5pm EDT** (Devpost, Track 1) — do the job properly, don't cut corners.

## Next actions (in order)

1. **M5:** MOO-472 (editorial edges via Perplexity — typed, cited connections), MOO-473 (see-them-live cards + badges), MOO-474 (submission package: README, sub-3-min video, sample outputs, connector PR, Devpost). Read `_build_plan/milestones/5-editorial-live-ship/prompt.md` first (plan mode + Tarik's confirmation, per pattern).
2. Workflow stays `linear-build` (align → In Progress → build → verify vs real data → Done + evidence comment). Load `claude-api` before touching agent LLM code; Perplexity key is in root `.env.local` (`PERPLEXITY_API_KEY` — verify name before use).

## M4 (done) — what M5 consumes

- **Web app** (`web/`, Next 16 + Tailwind 4 + Convex `anyApi`, dark "music city" theme): `/` search+featured, `/artist/[id]` (ego explorer, receipts on edge tap, trust chip, previews, streaming buttons, bridge badge + cross-the-bridge), `/pathfinder` (Dijkstra path + receipts + max-flow strength; 3+ artists = intersection), `/playlist/[id]` (stable URLs, per-track "why", take-it-with-you links), `/neighborhoods` (city map + cards + bridge roster), `/about`, `/review` (operator, untouched).
- **Editorial-ready by design (MOO-472 is mostly agent work):** `ReceiptSheet` renders the editorial type (quote/citation/confidence) already; `EDGE_COLORS.editorial` defined; schema `graphEdges.receipt` has quote/citationUrl/relationType/confidence fields since M1. Insert `type:"editorial"` rows into `graphEdges` and the UI shows them everywhere. **After writing edges, refresh the server snapshot** (`/api/path?refresh=1` etc., or restart dev) — it caches per process.
- **Traversals** live in `web/lib/traversal.ts` (Stell-R Appendix A: K-BFS+coherence, Dijkstra 1/(w+1), max-flow, intersection) against `web/lib/graph-store.ts` in-memory snapshot (paged via `app:nodesPage`/`edgesPage`). Self-checks in `npm run check` (agent workspace runs them).
- **Media backfill:** `npm run backfill:links` (agent) — SonoVault (key in `.env.local`) + Deezer (keyless). Current coverage: 363 tracks → 208 previews, 209 deezer, 132 ISRCs filled. Idempotent + disk-cached; re-run after any new tracks appear.
- **Convex additions:** `app.ts` (artistIndex/artistPanel/egoNetwork/neighborhoodList/nodesPage/edgesPage/trackIndex), `playlists.ts` (+ `playlists.why` in schema), `steward.tracksForBackfill`/`setTrackMedia`.
- Bridge threshold 0.5 (`web/lib/palette.ts BRIDGE_THRESHOLD`); station filter applies to curation edges only (canonical always visible).
- Track titles: some are raw playout strings — optional M5 polish note in the M4 milestone log.

## M3 graph (unchanged — DON'T rebuild before the demo)

- 604 nodes, 39,609 edges (39,594 curation + 15 canonical), 4 neighborhoods (Bronzeville Beat Loop 175 / Riverwest Synth Blocks 282 / Walker's Point Neo-Soul 66 / Bay View Indie Row 63), bridges: Twan Mack 1.0, Immortal Girlfriend, B Free, NILEXNILE…
- `npm run graph -- --mode=real` rebuilds (~4 min) but **names regenerate same-spirit not verbatim** — the app + evidence reference current names; don't rebuild between rehearsal and recording.
- Convex scale rule (bit twice): >32k-doc queries must paginate; mutations cap at 4096 reads. New M5 edge inserts: reuse `graph:insertEdges` (chunked).

## DataHub on Linode (LIVE — workspace instance)

- VM id `102316033`, IP `172.236.98.82`, ~$0.072/hr — **delete after submission** (`linode-cli linodes delete 102316033`). Creds in root `.env.local` (`DATAHUB_VM_*`); SSH key `~/.ssh/id_ed25519`.
- Reached via tunnel (`ssh -fN -L 9002:localhost:9002 -L 8080:localhost:8080 root@172.236.98.82`) → UI `localhost:9002` (datahub/datahub), GMS `localhost:8080`. **If DataHub "disappears", rerun the tunnel.** Judges run local quickstart — unaffected.
- Write-back client: `agent/src/gms.ts` (stable assertion URNs on rm-playlist-v2.plays; lineage; docs; owners). GraphQL gotcha: custom type label at `info { customAssertion { type } }` — introspect, don't guess. M5 editorial sessions should document themselves via the same client (session.ts DOCUMENT phase pattern).

## Current data/system state

- Backlog drained (0 pending / 672 resolved / 304 review / 79 ignored of 1,055); all three assertions GREEN (63.7% / 0 / 100%). `npm run session -- --mode=real` is idempotent — safe to run for demo footage.
- Catalog: 613 artists all enriched; 363 tracks (media coverage above). `/review` has ~304 pending — optional phone triage.
- Convex: liner-notes `dev:dusty-crocodile-663`; source `precise-fish-444` read-only.
- Standing rules: 414music-only artists skip external enrichment; station branding strings ignored; source read-only; no audio features; `_build_plan/` never imported by code; SonoVault > song.link.

## Env & tooling gotchas (hard-won)

- Playwright MCP: screenshots save to repo root (or path given); `browser_run_code_unsafe` with `page.mouse` works for canvas taps (hover first, then click — force-graph needs pointer tracking). Modal open checks via screenshot, not innerText (races).
- react-force-graph-2d: `next/dynamic` doesn't forward refs → inner client component owns the ref (`ForceGraphInner`). Map mode needs weak link strength + charge −60, warmup 300 ticks, and percentile-based zoomToFit (outliers otherwise shrink the city). minZoom must be low (0.05).
- Tailwind 4 CSS vars in arbitrary values: `from-(--hood-0)` (parens), NOT v3's `from-[--hood-0]` — the v3 form silently renders nothing.
- Convex CLI `npx convex data/run` from `convex/` workspace; plain `npx convex dev --once` deploys — confirm `.env.local` says `dev:dusty-crocodile-663`.
- MusicBrainz 1.1s/req; SonoVault 1.1s; Deezer 150ms — all via `agent/src/polite.ts` (cache `agent/.cache/`). Don't run two agent sessions concurrently.
- Python 3.14 too new for acryl-datahub → `connector/.venv` (py3.11). VM runs py3.12.
- Linear attachments: prepare (exact `stat -f%z` size) → curl PUT with ALL signed headers verbatim → finalize; one file at a time, 60s URL expiry.
- `.agents/`, `.claude/`, `skills-lock.json` untracked — decide at M5 whether to gitignore.
- Tarik's disk ~16GB free.

## Standing decisions (do not reopen)

Source read-only; steward writes only to liner-notes. No audio features. Scope settled — new ideas → Linear comments. `_build_plan/` never imported by code. SonoVault+Deezer > song.link. 414music-only = no external enrichment. DataHub on Linode via tunnel for Tarik; local quickstart is the judge story. Assertions on rm-playlist-v2.plays with stable URNs. Dark music-city theme; bridge threshold 0.5; editorial receipts layout already shipped.
