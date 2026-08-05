# Liner Notes

Radio Milwaukee's four stations' airplay history, turned into an explorable,
DataHub-governed artist-influence knowledge graph — by an autonomous steward
agent that shows its receipts.

Built for **Build with DataHub: The Agent Hackathon** (Track 1 — Agents That
Do Real Work). Licensed under **[Apache 2.0](./LICENSE)**.

## What's here

| Directory | What it is |
|---|---|
| `convex/` | The Liner Notes Convex deployment: schema (resolved catalog, steward records, influence graph, playlists) + judge-mode seed |
| `connector/` | Convex → DataHub ingestion source, Python — see [connector/README.md](./connector/README.md) |
| `agent/` | The steward agent, TypeScript — `npm run steward` runs a narrated session (orient via DataHub MCP → detect → resolve → enrich → document) |
| `web/` | The listener discovery app, Next.js (Milestone 4) |
| `scripts/` | `verify-source.mjs` — read-only smoke test against the source deployment |

## Setup

```sh
npm install
cp .env.example .env.local        # fill in what you have (see below)
cd convex && npx convex dev --once  # creates/links your Convex deployment, pushes schema
cd ..
```

### Judge mode (no private data required)

The repo runs without Radio Milwaukee's private airplay data. One command
seeds your Convex deployment with an anonymized sample dataset — real artist
names (so entity resolution genuinely works), synthetic play history across
the four real stations, deliberately messy artist strings included:

```sh
npm run seed
```

Then open the Convex dashboard (`npx convex dashboard` from `convex/`) and
browse `sourcePlays`, `sourceStations`, `sourceEvents`.

### Real mode (Radio Milwaukee source data)

Set `CONVEX_SOURCE_URL` and `CONVEX_SOURCE_DEPLOY_KEY` in `.env.local`
(read-only deploy key, scope `deployment:data:view`), then prove the
connection:

```sh
npm run verify:source
# Source deployment reachable. 18 tables: ...
# plays: 5120+ rows (stopped after 5 pages; more exist).
```

## Steward agent sessions

With DataHub up (see `connector/README.md`) and the connector ingest run once:

```sh
npm run steward                  # real mode if source keys are set, else judge mode
npm run steward -- --mode=judge  # force judge mode (sample data, no private keys)
```

Each session narrates five phases — **orient** (reads schemas, assertion state, and
prior run reports from DataHub via the official MCP Server), **detect** (builds the
prioritized worklist from unresolved plays), **resolve/enrich** (works the queue —
one Convex mutation per item, so a killed session resumes without double-applying),
and **document** (run record + a Claude-written report persisted to `stewardRuns`).
Requires `uv` (for `uvx mcp-server-datahub`) and Node 20+.

## Credentials

Every credential the project uses is documented in [.env.example](./.env.example).
Nothing is required for judge mode except a free Convex account.
