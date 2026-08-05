# Milestone 4 — Discovery App — log

## What's new in the app

- **You can now explore the station's musical brain in a browser.** Search any of 604 artists the four stations have played, land on their page, and see their corner of the graph — neighbors sized by airplay, colored by musical district, tap any artist to keep wandering. Works on a phone.
- **Every connection shows its receipt.** Tap a line between two artists and a panel tells you exactly why they're linked: "co-played 83 times within 60 minutes on Rhythm Lab, e.g. Apr 24, 2026" — or the MusicBrainz relationship that ties them. Every artist carries a trust chip showing how the steward matched them and how confident it was.
- **The Pathfinder walks influence paths.** Pick two artists and see the hop-by-hop route between them (Erykah Badu → Thundercat → Madlib → NILEXNILE → Holy Pinto), each hop with its receipt, plus an "influence flow" strength. Add a third artist to find who sits at the crossroads of all their networks.
- **One tap makes a playlist with a paper trail.** Seed any artist and a coherence-filtered walk builds a 12-track playlist — no genre lurches — where every track says why it's there. Playlists have stable URLs; regenerate gives a fresh-but-coherent variation.
- **The city map.** A zoomed-out map of all 604 artists in their four Claude-named districts, with neighborhood cards ("start here" playlists included) and ⚡ bridge artists — the Milwaukee connectors — each with a one-tap "cross the bridge" playlist that travels from their home district into the neighboring one.
- **Songs are hearable and takeable.** 208 tracks now play 30-second previews in the app, and every track offers Spotify / Apple Music / Deezer / YouTube buttons (real links where they exist, search links otherwise — never a dead button). The device remembers your preferred service.

## What was built

- **`convex/convex/app.ts`** (new): `artistIndex` (lite 604-row index → instant client search), `artistPanel`, `egoNetwork` (indexed `by_from`/`by_to` ranges + inter-neighbor edges, ~2k docs/query), `neighborhoodList`, paginated `nodesPage`/`edgesPage` (server snapshot feed), `trackIndex`.
- **`convex/convex/playlists.ts`** (new): `create`/`get` (hydrated). Schema: `playlists.why` added — per-track provenance `{artistId, viaArtistId, weight, type}`.
- **`convex/convex/steward.ts`**: `tracksForBackfill`, merge-only `setTrackMedia`.
- **`web/lib/`**: `traversal.ts` — Stell-R Appendix A ports (K-BFS w/ genre-Jaccard coherence + district bias + eligibility, modified Dijkstra `1/(w+1)`, Edmonds–Karp max-flow, multi-artist intersection) with `traversal.selfcheck.ts` wired into `npm run check`; `graph-store.ts` — module-scope in-memory snapshot (604 nodes / 39.6k edges, paged from Convex once per server process, `?refresh=1` rebuilds); `palette.ts`, `stations.ts`, `types.ts`.
- **Routes**: `/api/path` (Dijkstra + max-flow), `/api/intersection`, `/api/playlist` (K-BFS → `playlists:create`), `/api/map` (trimmed map: top-2-per-node ∪ weight≥12 = 6,418 edges + bridge district pairs).
- **Pages**: `/` (search + featured + hood cards), `/artist/[id]`, `/pathfinder`, `/playlist/[id]` (+ take-it-with-you), `/neighborhoods`, `/about`; dark "music city" theme in `globals.css`/`layout.tsx`.
- **Components**: `ForceGraphInner`/`GraphExplorer` (react-force-graph-2d canvas; ego + map modes), `SearchBox`, `ArtistView`, `ReceiptSheet`, `TrustChip`, `HopReceipt`, `PlaylistView`, `PreviewButton` (singleton audio), `StreamingButtons`.
- **`agent/src/`**: `deezer` track lookups in `sources.ts` (ISRC + guarded search), `backfill-links.ts` (`npm run backfill:links`) — ran against all 363 tracks: 208 previews, 209 deezer links, 132 ISRCs, 102 SonoVault link sets.
- Dependency added: `react-force-graph-2d` (web).

## Decisions not pre-specified in the PRD

1. **Traversals run on the Next server against an in-memory snapshot**, not in Convex — Convex caps queries at 32k docs (bit twice in M3) and whole-graph Dijkstra/max-flow wants adjacency in memory. Bounded reactive reads stay in Convex.
2. **Coherence τ = 0.9 genre-Jaccard distance; unknown genres = 0.5** (mid-scale) so under-enriched local artists aren't excluded from playlists.
3. **Max-flow included** (Tarik's call) as pair "influence strength", augmentation-capped with an honest "≥" when capped.
4. **Bridge badge threshold 0.5** on M3's normalized bridgeScore (real distribution p95≈0.22 with an elite 0.6–1.0 band — all Milwaukee cross-scene artists).
5. **Previews + Deezer links via Deezer API backfill** (Tarik's call): Deezer is keyless, returns 30s preview MP3s and ISRCs; SonoVault (Odesli's replacement, per MOO-471) provides youtube/discogs/musicbrainz. No direct Spotify/Apple links exist → those buttons always use the search-link fallback.
6. **Station filter semantics**: applies to curation edges (their receipts carry stations); canonical MusicBrainz edges are station-independent facts and stay visible.
7. **Playlist Algorithm 5 adaptation**: catalog has ~1 track per artist, so "random from top-N songs" ≈ that track; regenerate variety comes from random jitter in K-BFS neighbor ordering instead. Tracks preferred with previews.
8. **Dark "music city" theme** (Tarik's call) with a fixed 4-color district palette assigned by neighborhood list order.

## Things the next milestone (M5) needs to know

- **Editorial edges drop straight in**: `ReceiptSheet` already renders `editorial` type (quote + citation + confidence), `EDGE_COLORS.editorial` is defined, and the graph snapshot/edge queries carry `type` through everywhere. Insert editorial rows into `graphEdges` and the whole app picks them up.
- **The server graph snapshot caches per process** — after an editorial session writes new edges, hit any traversal route with `?refresh=1` (or restart `next dev`) to reload it.
- Events data for see-them-live: `sourceEvents`/`sourceEventArtists` exist in the schema (judge mode); production events come from rm-playlist-v2 read-only.
- **Track titles are raw playout strings** for some tracks ("3. Goldlink - Dark Skin Women Clean", "frank ocean - whip appeal (edit)") — they came from `workItems.topTitle`. If demo polish matters, a small steward pass could canonicalize titles from MusicBrainz recordings (post-hackathon note otherwise).
- `npm run check` now includes traversal known-answer tests; `web` production build verified green.
- Don't rebuild the graph before the demo (neighborhood names regenerate same-spirit, not verbatim).

## Deviations from the PRD

- **"Odesli streaming buttons" → SonoVault + Deezer** (Odesli public API sunset; already agreed on MOO-471). Buttons/caching/fallback behavior matches the PRD's intent exactly.
- Previews came from Deezer's API rather than "cached Apple Music preview URLs" (the liner-notes tracks table had zero preview URLs; source platform previews were never mirrored). Same listener outcome.
- Nothing else — "Done when" met: on a phone you can search an artist, explore their neighborhood, find the path between two artists, generate a playlist, read receipts behind connections, hear a preview, and open a track in your own streaming service.

## Verification evidence

Tracked in Linear (MOO-467…471, all Done with evidence comments + attachments) and `docs/evidence/m4-*`:

- Explorer + station filter: all=465 / 88Nine=53 / 414=0 edges for Erykah (query-verified) + before/after screenshots; re-center twice proven by URL transitions.
- Path Erykah→Holy Pinto (4 hops, receipts, flow ≥1347); playlist ear-test (12/12 Walker's Point Neo-Soul); reload-identical (Playwright text compare); regenerate variety shown.
- 3 receipt spot-checks vs `graph:edgeBetween` — exact matches; trust chip vs stored resolution (Thundercat llm/0.88) — exact.
- Cross-the-bridge playlist Twan Mack → Riverwest listed with per-track districts (7/12 land across the bridge).
- Streaming: live tap-through opened the correct Deezer track; 4 more API-verified; preference survives reload; fallback URLs shown.
- `npm run check` green (resolver + coplay + traversal); `next build` green.
