// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import type { PlayRecord } from "./source.js";

export interface WorklistEntry {
  rawArtist: string;
  playCount: number;
  stationSlugs: string[];
}

const UNWORKED = new Set(["pending", "unresolved"]);

// Distinct raw artist strings from unworked plays, prioritized by airplay.
export function buildWorklist(plays: PlayRecord[]): WorklistEntry[] {
  const byArtist = new Map<string, { playCount: number; stations: Set<string> }>();
  for (const play of plays) {
    if (!UNWORKED.has(play.enrichmentStatus)) continue;
    const entry = byArtist.get(play.artistRaw) ?? { playCount: 0, stations: new Set() };
    entry.playCount += 1;
    entry.stations.add(play.stationSlug);
    byArtist.set(play.artistRaw, entry);
  }
  return [...byArtist.entries()]
    .map(([rawArtist, { playCount, stations }]) => ({
      rawArtist,
      playCount,
      stationSlugs: [...stations].sort(),
    }))
    .sort((a, b) => b.playCount - a.playCount);
}
