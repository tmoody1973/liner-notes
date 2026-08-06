# Sample generated playlist — seeded from Erykah Badu

Real output of the playlist generator (`playlists:get`, id
`k973pjytk1870q7gw2x9p7qxjh8bxqnf` — the stable "ear test" playlist used in
milestone evidence). Traversal mode: `coherent-kbfs` — a coherence-first walk
of the influence graph from the seed artist, staying inside the seed's
neighborhood. Every track carries its **why**: the graph edge that earned it a
slot, with the co-play curation weight as the receipt.

**Seed:** Erykah Badu · **Neighborhood:** Walker's Point Neo-Soul (all 12 tracks)

| # | Track | Artist | Why it's here (edge weight) | Listen |
|---|---|---|---|---|
| 1 | The Healer | Erykah Badu | seed artist | [Deezer](https://www.deezer.com/track/627426402) · [MusicBrainz](https://musicbrainz.org/recording/58b839d4-f2b3-4e54-af54-fd574db96f51) |
| 2 | Them Changes | Thundercat | co-played with Erykah Badu (203) | [Deezer](https://www.deezer.com/track/102654980) · [MusicBrainz](https://musicbrainz.org/recording/0f177b9e-4e31-4600-bd4d-0261b4f52077) |
| 3 | Dark Skin Women | GoldLink | co-played with Erykah Badu (119) | — |
| 4 | The Let Out ft. Nana Kwabena | Jidenna | co-played with Erykah Badu (111) | [Deezer](https://www.deezer.com/track/142337485) |
| 5 | Me Alone | Gabriel Garzón‐Montano | co-played with Erykah Badu (104) | [Deezer](https://www.deezer.com/track/1440219872) |
| 6 | Day Dreaming | Celeste | co-played with Erykah Badu (102) | — |
| 7 | your my lady bncstr | Sleepy Brown | co-played with Erykah Badu (90) | — |
| 8 | whip appeal (edit) | Frank Ocean | co-played with Erykah Badu (92) | — |
| 9 | The Wilhelm Twice | Sasha Keable | co-played with Erykah Badu (89) | — |
| 10 | Norfside (feat. Tierra Whack) | Jill Scott | co-played with Erykah Badu (86) | [Deezer](https://www.deezer.com/track/3840460841) |
| 11 | So Good Today [Yoruba Soul Remix] | Ben Westbeech | co-played with Erykah Badu (72) | [Deezer](https://www.deezer.com/track/1302105212) |
| 12 | Colorblind (feat. Loyle Carner) | Tom Misch | co-played with Erykah Badu (68) | — |

Two things worth noticing:

- **The mess is real.** Track titles like "your my lady bncstr" and
  "3. Goldlink - Dark Skin Women Clean" are the raw playout strings the
  steward agent contends with — track-level cleanup is future work; artist
  resolution is what shipped.
- **Streaming links come from enrichment.** Tracks with Deezer/MusicBrainz/
  Discogs/YouTube links got them from the agent's enrich phase; blank cells are
  artists still in the enrichment backlog — the same 25%-enriched gap the run
  report and the DataHub assertion admit to.
