# Handoff — Liner Notes (DataHub Agent Hackathon) → next: finish MOO-474 (submission package)

**Updated 2026-08-05 ~19:05 CDT.** M1–M4 complete; M5 features complete: **MOO-472 (editorial edges), MOO-473 (see-them-live), MOO-475 (DataHub governance surface) all Done** with evidence + attachments. **MOO-474 (submission package) is In Progress** — public repo pushed, everything else remains. Deadline **Aug 10, 2026 5pm EDT** (Devpost, Track 1).

## MOO-474 — what's done / what remains (in order)

**Done:** full-history secret scan (clean; only `.env.example` ever tracked) → public repo created + pushed: **https://github.com/tmoody1973/liner-notes** (Apache 2.0 in repo; description set).

**Remaining:**
1. **README overhaul** (root): what/why, architecture (connector → DataHub ⇄ steward agent → graph → app), copy-paste judge setup (DataHub quickstart → `npm run seed` judge data → connector ingest → `npm run steward -- --mode=judge` → `npm run graph -- --mode=judge` → web app), Apache 2.0 prominent. Existing `connector/README.md` is already polished — link it.
2. **Sample outputs** `docs/samples/`: a real run report (pull from `stewardRuns.report` via `npx convex data stewardRuns`), the editorial session summary (in `/tmp/editorial-run.log` — copy before reboot!), a generated playlist markdown (playlists `k973pjytk1870q7gw2x9p7qxjh8bxqnf` via `playlists:get`), DataHub screenshots (reuse `docs/evidence/moo464-*` + `m5-datahub-*`).
3. **Demo-prep:** re-run connector ingest (updates stale row counts on graph tables — they show 0 from pre-graph ingest); `connector/.venv` py3.11, recipe unchanged, sink via tunnel.
4. **Clean-clone test:** fresh clone from GitHub into scratchpad, follow README judge path (anonymous local `npx convex dev` + seed + judge session + web). Save transcript to `docs/evidence/m5-clean-clone.txt`. DataHub steps validated against the running instance (local disk ~16GB — don't start a second quickstart).
5. **Connector upstream PR:** research current DataHub community-source contribution path, prepare branch + PR text, open DRAFT PR from Tarik's gh account (`tmoody1973`), link on MOO-474.
6. **Demo video — Tarik's call: I produce it end-to-end.** Invoke the **`hyperframes` skill first** (mandatory video entry point) + `elevenlabs-tts` for VO. Storyboard (per issue, <3:00): 0:00–0:20 problem (messy playout data) → 0:20–1:10 agent works (terminal narration, DataHub beats: assertions, lineage, incident, glossary/domains) → 1:10–2:20 app payoff (search → explorer → receipt tap → pathfinder → playlist → city map → editorial receipt → event card) → 2:20–2:55 loop + OSS ask. Raw footage: Playwright screen captures (browser already logged into DataHub at localhost:9002 datahub/datahub) + a fresh `npm run session -- --mode=real` terminal capture (idempotent, safe). Show final MP4 duration <3:00.
7. **Devpost draft** `docs/submission/devpost.md` + YouTube upload (Tarik's Chrome via claude-in-chrome, or hand off) + Devpost form; screenshots as evidence.

## M5 features (done) — quick reference

- **Editorial (MOO-472):** `npm run editorial` (agent) — sonar-pro, 50-artist cap, registry-filtered; 65 edges live (44 collab / 16 influenced / 5 compared); receipts render (blue edges; ReceiptSheet quote+citation+confidence). Responses disk-cached → re-runs free. `editorial:stats` for counts. After inserting edges: refresh web snapshot via any `/api/*?refresh=1`.
- **Events (MOO-473):** `npm run sync:events` (full resync; 35 rows / 23 artists). EventCard + LiveSoonBadge + emerald node dots. Display dedupes TM/AXS duplicates.
- **Governance (MOO-475):** `npm run governance` — domains (13+18 datasets), 9 glossary terms, 5 tags, 8 structured properties w/ live stats, incidents wired to assertions (also runs in every session's DOCUMENT phase). **4th assertion added:** resolution ≥80% *target* — honestly RED at 63.7% → real ACTIVE incident on plays ("Steward: Resolution coverage target failing"). It auto-resolves when review triage crosses 80% — if Tarik triages `/review` (304 pending) past that, capture the RESOLVED screenshot for MOO-475's honesty note.

## Environment state (critical)

- **GMS tunnel: local port 18080** (`DATAHUB_GMS_URL=http://localhost:18080` now in root `.env.local`) — **local 8080 is occupied by Tarik's newsdesk.server (PID ~31338, don't kill)**. Tunnel cmd: `ssh -fN -L 18080:localhost:8080 -L 9002:localhost:9002 -o ServerAliveInterval=30 -o ServerAliveCountMax=6 root@172.236.98.82`. Tunnels die quietly — verify with a GraphQL curl before blaming code.
- DataHub UI localhost:9002 (datahub/datahub; Playwright Chrome session already logged in). VM `102316033` — **delete after submission**.
- Web dev server on port 3000 (long-running); Convex `dev:dusty-crocodile-663`; graph NOT rebuilt (names frozen); 604 nodes / 39,674 edges (incl. 65 editorial).
- `/tmp/editorial-run.log` holds the full editorial session narration — copy into docs/samples before it's lost.

## Gotchas added this session

- Perplexity via `polite.ts` (now supports POST); `/chat/completions` endpoint works; response_format json_schema accepted on sonar-pro.
- GraphQL governance mutations confirmed on 1.7.0 via introspection (see `governance.ts` for exact shapes). `createStructuredProperty` valueType urns: `urn:li:dataType:datahub.number|string`; entityTypes `urn:li:entityType:datahub.dataset`.
- tsx one-offs: put temp scripts inside `agent/src/` (module resolution) and use file scripts, not `tsx -e` (no top-level await in cjs eval).
- Playwright innerText checks race React + CSS `text-transform: uppercase` changes innerText case — verify modals via screenshot or querySelector, not text search.
- npm workspace scripts: run `node -e` package.json edits from inside the right workspace dir (a stray run polluted convex/package.json once; reverted).

## Standing decisions (do not reopen)

Everything from before, plus: editorial = Perplexity-only (5-domain registry, no scraping); bridge threshold 0.5; GMS via 18080; incident thresholds honest (no faked resolutions); MOO-475 scope was Tarik-directed. Milestone log for M5 still to be written at close of MOO-474 (`_build_plan/milestones/5-editorial-live-ship/milestone-log.md`).
