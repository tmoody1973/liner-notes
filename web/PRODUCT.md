# Liner Notes — web app

## Register

product — the design serves music discovery; data density in service of listeners, not analysts.

## What it is

Radio Milwaukee's airplay history (168,921 hand-typed plays across four
stations, cleaned by an AI steward agent and governed in DataHub) turned into
an explorable artist-influence graph. Every artist-to-artist connection
carries a receipt: why these two artists are linked and how sure we are.

## Who it's for

1. **Listeners** — Radio Milwaukee's audience: music-curious, not technical.
   They should wander artist-to-artist the way they'd flip through crates,
   and every claim should feel earned, not algorithmic.
2. **Hackathon judges** (secondary, time-boxed) — data practitioners who will
   probe whether the receipts are real.

## The one concept a visitor must get

A **connection** between two artists comes from one of three evidence types,
each with its own color and receipt:

- **co-play** (station-colored/red tones): a DJ chose to play these artists
  back-to-back on air, N separate times. Human curation, not an algorithm.
- **MusicBrainz** (green): a documented real-world relationship (member of,
  collaborated, remixed).
- **editorial** (blue): a claim from cited music journalism — quote, source
  link, and confidence shown.

Tap any connection → the receipt sheet shows exactly this.

## Surfaces

`/` search + featured artists · `/artist/[id]` ego graph + panel ·
`/pathfinder` hop-by-hop influence paths · `/playlist/[id]` generated
playlists with per-track "why" · `/neighborhoods` city map of musical
districts · `/about` data provenance.

## Brand personality

Crate-digger warmth on a dark "music city at night" canvas. Confident, plain
language; zero data-science jargon at the listener layer. The receipt is the
brand: honest, specific, a little proud of its homework.

## Anti-references

Spotify-style black-box "because you listened to..."; corporate dashboard
chrome; algorithm-speak ("similarity score", "embedding") anywhere a
listener can see it.

## Strategic design principles

1. Every claim shows its evidence one tap away.
2. Plain words over graph words ("played back-to-back 73 times on air" beats
   "co-play weight 73").
3. The graph is the toy; the receipts are the trust; the playlist is the
   payoff.
