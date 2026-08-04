# Handoff — Liner Notes (DataHub Agent Hackathon)

**For the next session:** planning is 100% complete; nothing is built and nothing is committed to git yet. Your job is to start building, issue by issue, with Linear as the record of truth.

## What this project is

Liner Notes: an autonomous steward agent turns Radio Milwaukee's four-station airplay history (Convex) into a DataHub-governed artist-influence knowledge graph, with a listener discovery app showing provenance "receipts" on every connection. Built for **Build with DataHub: The Agent Hackathon** (Devpost, deadline **Aug 10, 2026 5pm EDT**), Track 1. Based on the HDSR "Stell-R" paper — read `docs/research/stell-r-artist-influence-hdsr.md` (Appendix A has the traversal-algorithm pseudocode to port).

## Where truth lives (do not re-derive; read these)

- **Locked scope / PRD:** `_build_plan/prd.html` (features, cuts, data model, integrations, 5 milestones)
- **Linear project (record of truth):** https://linear.app/moodyco/project/liner-notes-datahub-agent-hackathon-95fae68e8506 — issues **MOO-459 → MOO-474**, full spec contracts (Intent/Acceptance/Verification/Out-of-scope), dependency-chained. Team: Moodyco.
- **Milestone plan-mode triggers:** `_build_plan/milestones/{1..5}-*/prompt.md` (each build writes a `milestone-log.md` beside it)
- **Repo instructions:** `AGENTS.md`

## ⚠️ Three prerequisites before Milestone 1 (Tarik must provide)

1. **Deploy key for rm-playlist-v2** — Convex dashboard → project `rm-playlist-v2` → Settings → Deploy key. Goes in `.env.local` (never committed). This is the read-only door to the source data.
2. **Discogs personal access token** — free, ~2 min at discogs.com developer settings.
3. **Anthropic + Perplexity API keys** on hand (Anthropic needed from M2; Perplexity not until M5/MOO-472).

## Context not captured in the PRD/Linear (hard-won this session)

- **Source deployment:** rm-playlist-v2 prod = `reliable-gerbil-906` (team `tarikjmoody-gmail-com`, Convex team id 106284). Public repo mirror: `tmoody1973/rm-playlist-v2` on GitHub; schema at `packages/convex/convex/schema.ts`. Key tables: `plays` (artistRaw/titleRaw, playedAt, stationId, `enrichmentStatus` = the agent's real backlog), `artists`/`tracks` (partial canonical catalog, some mbid/isrc/previewUrl), `events`+`eventArtists`+`touringFromRotation` (Ticketmaster/AXS, powers M5 see-them-live).
- **Convex CLI gotcha:** `npx convex data --deployment-name X` from outside a linked project fails with a 401 (token not attached) even though the login token in `~/.convex/config.json` works via curl against `api.convex.dev`. Don't fight it — the connector uses Convex's **streaming export REST API** (`/api/json_schemas`, `/api/list_snapshot`, `/api/document_deltas`) with the deploy key, which is also how schema discovery works.
- **Steward agent writes ONLY to the new Liner Notes deployment** (created in MOO-459). rm-playlist-v2 is read-only — locked decision, prod safety.
- **No audio features anywhere** (Spotify API deprecated; AcousticBrainz dead). Coherence filter = tag/genre-vector similarity. Deliberate adaptation from the paper — say so in docs/video.
- **Judge mode is a submission requirement detail:** repo must run without private radio data → anonymized sample dataset seeds the Liner Notes deployment (in MOO-459's acceptance criteria).
- **DataHub judging tell:** write-back ("contributions back to the metadata graph") is weighted highest; the connector doubles as the OSS-contribution bonus. MCP Server is their preferred agent integration — the agent's Orient phase must visibly read from it.
- Odesli for streaming links (no OAuth); JamBase/browser-use explicitly rejected (post-hackathon notes only).

## How to start

1. Confirm the three prerequisites are in `.env.local`.
2. Make the initial git commit (user hasn't asked for it yet this session — confirm, then commit `_build_plan/`, `docs/`, `AGENTS.md`).
3. Say **"build MOO-459"** → the `linear-build:linear-build` skill runs the loop: read issue → align → In Progress → build to acceptance criteria → verify against real data → Done with evidence comment. Pair with `_build_plan/milestones/1-foundation-connector/prompt.md` for plan mode.

## Suggested skills for next session

- `linear-build:linear-build` — the build loop per issue (primary workflow)
- `superpowers:writing-plans` / plan mode via the milestone prompt.md files
- `superpowers:verification-before-completion` — every issue's verification checklist demands real evidence
- `vercel:nextjs` (M4) and `claude-api` (M2 agent implementation) when those milestones arrive

## Session decisions log (chronology, for the curious)

Brainstormed via superpowers:brainstorming → concept pivoted twice on user direction: (1) listener-first product grounded in the Stell-R paper, (2) editorial edges from established music journalism via Perplexity (not Radio Milwaukee's own content, not scraping). PRD created interactively via bm-prd-creator (all 10 features + 9 cuts individually locked). Linear project + 16 issues created via linear-build. All scope questions are settled — don't reopen them; if something new arises, it's a Linear issue conversation, not a scope re-litigation.
