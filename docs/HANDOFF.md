# Handoff — Liner Notes (DataHub Agent Hackathon) → next: MOO-474 final mile (PR open, YouTube, Devpost)

**Updated 2026-08-05 ~20:30 CDT.** MOO-474 is ~90% done (see the evidence comment on the issue). **Done this session:** README overhaul + `docs/architecture.svg` + `docs/samples/` (commits 625367b→c3d0780); connector re-ingest verified (graphEdges 39,674); clean-clone test (`docs/evidence/m5-clean-clone.txt`, 7/9 pass, blockers fixed, incident-mutation bug fixed in `agent/src/governance.ts`); upstream port pushed to fork branch `feat/convex-ingestion-source` (PR body preserved at `docs/submission/upstream-pr-body.md`); **final video rendered: `videos/liner-notes-demo/renders/liner-notes-final-2m49s.mp4` (2:49.5, verified)**; Devpost draft `docs/submission/devpost.md`; M5 milestone log written.

**Remaining (in order):** (1) open the draft PR — `gh pr create --repo datahub-project/datahub --base master --head tmoody1973:feat/convex-ingestion-source --title "feat(ingestion): add Convex metadata ingestion source" --body-file docs/submission/upstream-pr-body.md --draft`` (was permission-blocked for the agent; Tarik can run it with `!`); (2) attach PR link to MOO-474 + fill the two `[link — fill in]` slots in devpost.md; (3) YouTube upload (PUBLIC) + Devpost form; (4) mark MOO-474 Done with screenshots. Video voice = Tarik's instant clone "Tarik 2" (professional clone `k50RwPmT87kNceJVrJG6` is Creator-tier-gated; alt sample `public/vo/f01-alt-tarik1.mp3`); VO regenerate + re-render ≈ 10 min if he wants a swap. Deadline **Aug 10, 2026 5pm EDT**.

**Watch-outs added this session:** OpenSearch on the VM OOM-dies under ingest load → `ssh root@172.236.98.82 'docker start datahub-opensearch-1'`; judge/clean-clone steward sessions WRITE to whatever GMS they point at (no namespace guard) — restore honest state with `npm run steward -- --mode=real` before capturing DataHub evidence; `videos/` and `connector/recipes/convex.local.yml` are gitignored on purpose.

## Cold-start (first 5 minutes of the next session)

1. Kickoff was "read docs/HANDOFF.md and continue" — the workflow is `linear-build:linear-build` (issue → In Progress → build → verify vs real data → Done + evidence comment). MOO-474 is already In Progress; no plan-mode gate needed (Tarik approved the M5 plan incl. the video approach; his three locked calls: sonar-pro/50, **I produce the video with HyperFrames + ElevenLabs VO**, public repo now).
2. Verify the estate before building: `git status` (clean, origin=github.com/tmoody1973/liner-notes, pushed through 54f90ec); web dev server on **localhost:3000** (long-running — check before starting another); Convex `dev:dusty-crocodile-663`; GMS tunnel alive? → `curl -s http://localhost:18080/api/graphql -X POST -H 'Content-Type: application/json' -d '{"query":"{ __typename }"}'` (rerun the ssh line below if dead); DataHub UI localhost:9002 (datahub/datahub — Playwright Chrome already logged in).
3. For the video: **invoke the `hyperframes` skill BEFORE anything video-related** (it's the mandatory entry point and owns the workflow); `elevenlabs-tts` for the voiceover.

## Demo entities (stable IDs used across evidence — reuse for footage)

| Thing | ID / URL |
|---|---|
| Erykah Badu (explorer/star of M4 evidence) | `/artist/j576x206tcqtnf2n1shktf0ayd8bx39r` |
| Madlib (editorial blue edges + receipt sheet) | `/artist/j5714fzx84fbs8xsnzw7avs9y98bwp5g` |
| Sylvan Esso (event card + live-soon) | `/artist/j579dfqt5ngt7ct2j74bbpjvyh8bx66t` |
| Twan Mack (top bridge, cross-the-bridge) | `/artist/j577qxpawr7s50g6w6bkqtcrah8bxfta` |
| Ear-test playlist (stable URL) | `/playlist/k973pjytk1870q7gw2x9p7qxjh8bxqnf` |
| Path demo | Pathfinder: Erykah Badu → Holy Pinto (4 hops, flow ≥1347) |
| plays dataset in DataHub (incident/quality/lineage) | `http://localhost:9002/dataset/urn%3Ali%3Adataset%3A(urn%3Ali%3AdataPlatform%3Aconvex%2Crm-playlist-v2.plays%2CPROD)/Incidents` |
| graphEdges in DataHub (props/tags/terms/domain) | same pattern with `liner-notes.graphEdges`, `/Properties` |

Footage capture notes: graph pages need ~8–20s to settle (staged auto-fit stops on user interaction); phone viewport 390×844 works; canvas taps via `page.mouse` need a hover first; check modals via screenshot (innerText races React + CSS uppercase).

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
