# Devpost submission — Liner Notes

**Track:** 1 — Agents That Do Real Work
**Repo:** https://github.com/tmoody1973/liner-notes (Apache 2.0)
**Live app:** https://liner-notes-pi.vercel.app
**Standalone connector:** https://github.com/tmoody1973/datahub-convex
**Video:** [YouTube link — fill in after upload]
**Team:** Tarik Moody (Radio Milwaukee)

## Elevator pitch (200 chars)

An AI steward agent cleans Radio Milwaukee's hand-typed playout logs, governed
end-to-end in DataHub — and turns them into a music discovery graph where every
connection shows its receipt.

## Inspiration

Radio Milwaukee's four stations log every song a DJ plays — 168,921 plays in
fifteen weeks on the current playout platform, artist names typed live by DJs:
typos, aliases, "feat." strings, duplicates.
"Erykah Badu", "Badu, Erykah", and "Erykah Badu feat. Common" are three
different artists to the database. Nobody can answer "what have we actually
played?" — and every station, podcast network, and music library has a version
of this table. We wanted an agent to do the cleanup, with the governance visible: real checks, honest failures, and a receipt for every judgment call.

## What it does

- **A custom Convex → DataHub connector** (Python, recipe-driven like official
  sources) ingests every table of the playout platform and the project's own
  deployment: schemas, exact row counts, containers, lineage.
- **An autonomous steward agent** (TypeScript + Claude) runs narrated sessions:
  it **orients by reading DataHub through the official MCP Server** (schemas,
  assertion state, its own prior run reports), detects unresolved artist
  strings, resolves them against MusicBrainz with Claude adjudicating the
  ambiguous ones, enriches with Discogs and streaming links, then **documents —
  writing run reports, assertion results, lineage, and ownership back into
  DataHub**.
- **A governance surface the agent maintains**: 4 quality assertions on the
  backlog, domains, a glossary, tags, structured properties with live stats —
  and **honest incidents**: the resolution-coverage stretch target (80%) is
  genuinely failing at 63.6%, so a real ACTIVE incident sits on the dataset
  until triage catches up. No faked green.
- **An influence graph** built from the cleaned catalog: 604 artists, 39,674
  edges — co-play edges from what DJs actually played back-to-back, and editorial edges mined from cited music journalism (Perplexity, quote +
  citation + confidence stored on every edge).
- **A listener app** (Next.js): search, force-graph explorer, influence
  pathfinder, generated playlists, a "city map" of musical neighborhoods, live
  event cards. Tapping any connection opens its receipt.

## How we addressed the judging criteria

**Use of DataHub.** The agent doesn't just read metadata — it lives in the
context graph. It orients via the official DataHub MCP Server every session,
and it *contributes back*: dataset documentation, four custom assertions with
per-run results, operational incidents (raised and auto-resolved by threshold),
lineage from raw plays through the resolved catalog to the graph tables,
domains/glossary/tags/structured properties, and technical ownership on all 31
datasets. The catalog is the agent's memory and its conscience.

**Technical execution.** The full loop runs end-to-end and is reproducible in
judge mode with anonymized sample data (README quickstart). A clean-clone test
transcript is in `docs/evidence/m5-clean-clone.txt` — including the README gaps
it caught, which we fixed.

**Originality.** DataHub usually governs pipelines; here it governs an
*agent's judgment* — every artist-identity decision carries confidence scores,
evidence, and an audit trail, surfaced to listeners as receipts ("these two
were played back-to-back 73 times", "this quote from a cited review"). We
composed DataHub's shipped features (assertions, incidents, MCP, lineage,
glossary) instead of rebuilding any of them.

**Real-world usefulness.** Every playout system rots the same way. The pattern
— agent cleanup with DataHub as the control tower and honest quality gates —
transfers to any org with a messy human-entered backlog. And the connector
fills a real catalog gap: Convex backs many production apps with no DataHub
integration until now.

**Submission quality.** Sub-3-minute video with real footage of every claim;
README with architecture diagram and copy-paste judge path; sample outputs in
`docs/samples/` (real run reports, the narrated editorial session log, a
generated playlist with per-track receipts, DataHub screenshots).

**Open source (bonus).** The whole project is Apache 2.0. The Convex connector
is submitted upstream to `datahub-project/datahub` as a draft PR
(https://github.com/datahub-project/datahub/pull/19082) and published as a standalone pip-installable repo:
https://github.com/tmoody1973/datahub-convex. It registers via the standard plugin entry point and runs
against a stock quickstart.

## How we built it

Convex (source platform + project database) · Python (`acryl-datahub` source
API) · TypeScript agent with Claude (Sonnet for adjudication and run reports) ·
official DataHub MCP Server (`mcp-server-datahub`) · MusicBrainz + Discogs +
Deezer for canonical identity and enrichment · Perplexity sonar-pro for cited
editorial retrieval (5-domain registry, $0.74 per 50-artist session) · Next.js
+ react-force-graph for the app · DataHub v1.7.0 quickstart.

## Challenges

- **Honest governance is a feature.** We wired incidents to assertions and let
  the stretch target fail publicly rather than tuning thresholds to look green.
- **Entity resolution is a judgment problem.** Scores alone misfire on
  reversed names and one-play local artists; Claude's adjudication with an
  explicit "send it to a human" option is what made auto-apply safe.
- **Receipts all the way down.** Editorial edges only ship with a quote, a
  citation from a registry of five music-journalism domains, and a confidence
  floor — 253 of 322 candidates were dropped for citing outside the registry
  or referencing unknown artists.

## What's next

Track-level cleanup (the playlist titles still show the raw mess), human
review UI throughput (305 items pending — the incident resolves itself at
80%), and upstreaming the connector past draft.
