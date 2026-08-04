# Milestone 1 — Foundation & Connector — log

## What's new in the app

- The project now has a real home: one repository containing the data layer, the future steward agent, the future listener app, and the DataHub connector — all under an Apache 2.0 license.
- A brand-new Liner Notes database (Convex) exists with every table the later milestones need: resolved artists and tracks, the human review queue, steward run records, the influence graph, and playlists.
- **Judge mode:** anyone can run `npm run seed` and get a working dataset — 220 synthetic plays across the four real stations with deliberately messy artist names, plus sample events — no private Radio Milwaukee data required.
- The private airplay archive (166k+ real plays) is connected read-only and provably reachable with one command (`npm run verify:source`).
- A first-of-its-kind **Convex → DataHub connector**: point it at any Convex deployment and its tables, schemas, and row counts appear in the DataHub catalog, browsable in the UI. Both project deployments land there with one ingest command.

## What was built

- **Monorepo** (npm workspaces): `convex/` (Liner Notes deployment: `schema.ts`, `seed.ts`, `sampleData.json`), `agent/` (TS stub), `web/` (Next.js scaffold), `connector/` (Python), `scripts/verify-source.mjs`, root `README.md`, `.env.example`, `LICENSE` (Apache 2.0).
- **Convex deployment:** project `liner-notes`, dev deployment `dusty-crocodile-663` (team `tarikjmoody-gmail-com`), 12 tables in four layers (source mirror for judge mode / resolved catalog / steward records / graph + playlists).
- **Connector** (`connector/`, package `datahub-convex`): `client.py` (streaming-export client: `json_schemas`, paged `list_snapshot` row counting), `source.py` (`ConvexSource` + pydantic config; per-deployment containers via `gen_containers`; per-table Status, DatasetProperties, SubTypes, SchemaMetadata mapped from Convex JSON Schema incl. `Id(<table>)` reference descriptions, and exact DatasetProfile row counts). Registered via the `datahub.ingestion.source.plugins` entry point → recipes use `type: convex`. Recipe at `connector/recipes/convex.yml` covers both deployments with env-substituted deploy keys. Tests: `tests/test_schema_mapping.py` (3 passing, py3.11 via uv).

## Decisions not pre-specified in the PRD

1. **Source deployment is rm-playlist-v2 DEV (`precise-fish-444`)** — prod (`reliable-gerbil-906`) is empty; confirmed by Tarik. Configured via `CONVEX_SOURCE_URL`, so switching later is config-only.
2. Deploy key scoped to `deployment:data:view` — the "read-only source" locked decision enforced at credential level.
3. Judge-mode sample data uses **real artist names with synthetic play history** (fictional names could never resolve against MusicBrainz in M2).
4. Judge mode reads from `source*` mirror tables in the Liner Notes deployment rather than a second fake deployment.
5. Row counting walks `list_snapshot` pages (exact counts; `max_count_pages` cap, default 200 ≈ 205k rows) — Convex has no count endpoint.
6. npm workspaces (no pnpm/bun) and uv-managed Python 3.11 venv (system 3.14 too new for acryl-datahub).

## Things the next milestone needs to know

- **Env vars** (`.env.local`, gitignored; documented in `.env.example`): `CONVEX_SOURCE_URL`, `CONVEX_SOURCE_DEPLOY_KEY`, `CONVEX_LINER_NOTES_DEPLOY_KEY`, `ANTHROPIC_API_KEY`, `DISCOGS_TOKEN`, `PERPLEXITY_API_KEY`. The Convex keys contain `|` — keep them quoted.
- Liner Notes Convex client config is in `convex/.env.local` (`CONVEX_DEPLOYMENT=dev:dusty-crocodile-663`).
- DataHub quickstart: `connector/.venv/bin/datahub docker quickstart`; UI localhost:9002, GMS localhost:8080 (login datahub/datahub). The DataHub MCP server (M2 Orient phase) points at this GMS.
- Real source table row counts (2026-08-04): `plays` 166,688 · `artists` 3,106 · `tracks` (large) · `stations` 4.
- **Odesli public API is dead** (Aug 1 2026) — see MOO-471 comment for fallback plan (song.link URL construction / SonoVault / allowlist application pending).

## Deviations from the PRD

- None in scope. One environmental: source data comes from the dev deployment (see decision 1).

## Verification evidence

- `npm run seed` output: `{stations: 4, plays: 220, events: 6}`; `npx convex data` lists all 12 tables; sample rows show messy strings.
- `npm run verify:source`: "Source deployment reachable. 18 tables … plays: 5120+ rows".
- Connector unit tests: 3 passed.
- `datahub check plugins` lists `convex` among source plugins.
- DataHub ingest (stock `datahub docker quickstart`, GMS v1.7.0): pipeline "finished successfully; produced 222 events" — 30 datasets under 2 containers (`rm-playlist-v2` 18, `liner-notes` 12).
- Row counts in DataHub vs streaming-export ground truth: `artists` 3,106 = 3,106 · `stations` 4 = 4 · `sourcePlays` 220 = 220 · `plays` 167,154 vs 166,688 measured 6h earlier (live station drift, +466 real plays).
- Idempotency: 30 convex datasets before re-run, 30 after (second ingest clean, 222 events, 0 failures).
- UI screenshots: `docs/evidence/m1/datahub-plays-columns.png` (plays: 167.2k rows, 13 typed columns, `Id(...)` reference descriptions, nullable chips), `docs/evidence/m1/datahub-convex-both-deployments.png` (both deployment containers, "Synced … from Convex").
- Environmental note: the first quickstart attempt filled the host disk and corrupted Docker's VM (write I/O errors); fixed by freeing ~40GB (caches + old artifacts) and resetting the VM disk. MySQL first-boot health race required one quickstart re-run — harmless, documented here for reproducers.
