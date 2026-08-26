// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0

// Graph build tunables (PRD: "config file only" — no tuning UI).
export const graphConfig = {
  // Two artists co-played within this window on the same station count as one
  // co-curation event (Stell-R "co-mention in a review" → radio's "same
  // curated block"; 60 min ≈ the same DJ moment — Tarik's call, 2026-08-05).
  windowMs: 60 * 60 * 1000,
  // Curation edges below this co-play count are noise, not curation.
  minCurationWeight: 2,
  // Full play scan: 400 pages ≈ 410k plays — headroom over the ~190k history
  // (growing ~1.6k plays/day) so "full history" stays true for months.
  maxPages: 400,
  // Convex mutation chunk size for graph inserts.
  insertChunk: 400,
};
