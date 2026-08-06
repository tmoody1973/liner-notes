# Milestone 5 — Editorial edges, live events, ship — log

## What's new

- **Editorial edges with receipts (MOO-472).** `npm run editorial` scans the
  station's most-played artists against a 5-domain music-journalism registry
  via Perplexity sonar-pro and lands typed edges (collaborated-with /
  influenced / compared-to), each carrying its quote, citation URL, and
  confidence. 65 edges live (44 collab / 16 influenced / 5 compared); blue
  edges + quote receipts render in the app. 253 of 322 candidates were dropped
  for citing outside the registry or naming artists outside the catalog —
  the filter is the feature. Responses disk-cached; a 50-artist session costs
  ~$0.74.
- **See them live (MOO-473).** `npm run sync:events` reads the source
  platform's existing Ticketmaster/AXS tables (zero new APIs), matches
  performers to catalog artists, drops cancelled/rescheduled shows, and lands
  35 events for 23 artists. Event cards + "live soon" badges + emerald node
  dots in the app; display dedupes cross-source duplicates.
- **Governance surface (MOO-475).** `npm run governance` publishes domains
  (Liner Notes / Radio Milwaukee Source over 31 datasets), 9 glossary terms,
  5 tags, 8 structured properties with live stats — and wires incidents to
  assertions: a 4th assertion (resolution ≥80% target) is honestly RED at
  63.6%, keeping a real ACTIVE incident open on `plays` until review triage
  crosses the bar. Incident auto-resolve runs in every session's DOCUMENT phase.
- **Submission package (MOO-474).** Public repo
  (github.com/tmoody1973/liner-notes, Apache 2.0, full-history secret-scanned),
  README overhaul with architecture diagram + copy-paste judge path,
  `docs/samples/` (real run reports, narrated editorial log, playlist with
  receipts, DataHub screenshots), clean-clone test with honest transcript
  (`docs/evidence/m5-clean-clone.txt`), connector re-ingest refreshing graph
  table row counts (39,674 edges visible in DataHub), Convex connector ported
  to the DataHub monorepo (branch `feat/convex-ingestion-source` on the
  tmoody1973 fork; draft PR body written), sub-3-minute demo video produced
  end-to-end (HyperFrames + ElevenLabs, 2:49.5, majority real footage), and
  the Devpost draft (`docs/submission/devpost.md`).

## Fixes that came out of verification

- Root `package.json` gained workspace aliases (`graph`, `editorial`,
  `sync:events`, `governance`) so the README's judge path runs from repo root.
- `connector/recipes/convex.judge.yml` added — the committed recipe pointed at
  production deployment URLs a judge can't use.
- Clean-clone test found two judge-path blockers (anonymous Convex deployments
  can't mint deploy keys; `NEXT_PUBLIC_CONVEX_URL` undocumented) → README now
  routes judges through `npx convex login` and writes `web/.env.local`.
- Real bug: `updateIncidentStatus` used `UpdateIncidentStatusInput!` — GMS
  v1.7.0 wants `IncidentStatusInput!`. The path only fires when coverage
  crosses 80%, which judge-mode data did and production hadn't. Fixed in
  `agent/src/governance.ts`.
- The clean-clone judge session wrote its 93.4% numbers onto production
  assertions (no judge-mode GMS guard — documented as finding 6). A fresh real
  session restored the honest 63.6% state before footage was captured.
- OpenSearch on the demo VM OOM-died under ingest indexing load;
  `docker start datahub-opensearch-1` recovers it.

## Decisions not pre-specified

- Video voice: Tarik's professional ElevenLabs clone (`k50RwPmT87kNceJVrJG6`)
  is gated behind Creator tier on the current key; narration generated with
  his instant clone "Tarik 2" (`bMytOVfoTSi5oJ3DEe8q`) instead, with an
  alternate f01 sample from clone "Tarik" for comparison. Swap = regenerate 8
  segments + re-render.
- Upstream contribution targets the `datahub-project/datahub` monorepo
  (current documented path) rather than a standalone repo; a standalone
  `datahub-convex` split remains possible post-hackathon via `git subtree`.
- Draft PR not yet opened: the harness blocked the outward-facing `gh pr
  create` — branch + body are staged for a one-command open.

## Verified

- 169.536s MP4 (ffprobe), h264+aac, honest-assertion footage confirmed
  frame-by-frame; audio present (max −6.8 dB).
- Post-ingest GraphQL: graphEdges 39,674 · graphNodes 604 · artistEvents 35.
- Clean clone: 7/9 judge steps pass as written; the 2 blockers fixed same
  session (transcript preserved before fixes, per honesty policy).
