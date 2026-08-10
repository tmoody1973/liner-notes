# YouTube metadata — Liner Notes submission video

## Title (85 chars)

An AI agent cleans 168,921 hand-typed radio plays — governed in DataHub | Liner Notes

### Alternates
- Every music connection gets a receipt: an AI data steward for public radio | Liner Notes (89)
- Liner Notes: an AI steward agent for Radio Milwaukee, governed end-to-end in DataHub (84)

## Description

Every radio station has a table like this: 168,921 plays logged live, by hand, across fifteen weeks — the same artist spelled three different ways. Liner Notes is an autonomous AI steward agent that cleans Radio Milwaukee's playout log and turns it into a music discovery graph where every connection shows its receipt.

Built for the DataHub Agent Hackathon (Track 1 — Agents That Do Real Work).

How it works:
• A custom Convex → DataHub connector ships every table's metadata into the catalog — schemas, row counts, lineage.
• Each session, the steward agent orients by reading DataHub through the official MCP Server, resolves messy artist names against MusicBrainz, and hands ambiguous ones to Claude — which knows when to say "let a human decide."
• Then it writes its work back: run reports, four quality assertions, lineage, domains, a glossary, ownership. Tonight three assertions pass and one fails — so a real incident stays open on the dataset. No faked green.
• The cleaned catalog powers a listener app: 604 artists, 39,674 connections drawn from what four stations actually played — with a receipt on every edge.

Chapters
0:00 The problem — a hand-typed playout log
0:17 The architecture — connector, catalog, agent
0:30 The steward session — MCP orientation, MusicBrainz, Claude adjudication
0:47 Honest governance — assertions, a live incident, lineage
1:16 The discovery app — neighborhoods and receipts
1:41 Pathfinder and playlists
1:59 The city map and editorial edges
2:23 The loop, open source

Links
Live app: https://liner-notes-pi.vercel.app
Repo (Apache 2.0): https://github.com/tmoody1973/liner-notes
Standalone connector: https://github.com/tmoody1973/datahub-convex

Built by Tarik Moody, Radio Milwaukee — 88Nine, HYFIN, 414 Music, Rhythm Lab.

#DataHub #AIAgents #DataGovernance #MusicDiscovery #PublicRadio
