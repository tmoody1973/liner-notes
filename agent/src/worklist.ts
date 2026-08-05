// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import type { PlayRecord } from "./source.js";

export interface WorklistEntry {
  rawArtist: string;
  playCount: number;
  stationSlugs: string[];
  topTitle?: string;
  firstPlayedAt?: number;
  lastPlayedAt?: number;
}

const UNWORKED = new Set(["pending", "unresolved"]);

// Distinct raw artist strings from unworked plays, prioritized by airplay.
// Carries the most-played title (representative track for ISRC/release-year
// enrichment) and the play-era range (era signal for candidate scoring).
export function buildWorklist(plays: PlayRecord[]): WorklistEntry[] {
  const byArtist = new Map<
    string,
    {
      playCount: number;
      stations: Set<string>;
      titles: Map<string, number>;
      firstPlayedAt?: number;
      lastPlayedAt?: number;
    }
  >();
  for (const play of plays) {
    if (!UNWORKED.has(play.enrichmentStatus)) continue;
    const entry =
      byArtist.get(play.artistRaw) ??
      { playCount: 0, stations: new Set<string>(), titles: new Map<string, number>() };
    entry.playCount += 1;
    entry.stations.add(play.stationSlug);
    if (play.titleRaw) entry.titles.set(play.titleRaw, (entry.titles.get(play.titleRaw) ?? 0) + 1);
    if (play.playedAt !== undefined) {
      entry.firstPlayedAt = Math.min(entry.firstPlayedAt ?? play.playedAt, play.playedAt);
      entry.lastPlayedAt = Math.max(entry.lastPlayedAt ?? play.playedAt, play.playedAt);
    }
    byArtist.set(play.artistRaw, entry);
  }
  return [...byArtist.entries()]
    .map(([rawArtist, { playCount, stations, titles, firstPlayedAt, lastPlayedAt }]) => ({
      rawArtist,
      playCount,
      stationSlugs: [...stations].sort(),
      topTitle: [...titles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
      firstPlayedAt,
      lastPlayedAt,
    }))
    .sort((a, b) => b.playCount - a.playCount);
}
