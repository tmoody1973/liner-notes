// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0

// Curation edges from co-play (Stell-R adapted to radio): two resolved
// artists played within `windowMs` on the same station = one co-curation
// event. Pure and deterministic — same plays in, same edges out.

export interface ResolvedPlay {
  artistId: string;
  stationSlug: string;
  playedAt: number;
}

export interface CoPlayEdge {
  fromArtistId: string; // canonical order: fromArtistId < toArtistId
  toArtistId: string;
  weight: number;
  stations: string[]; // sorted, deduped
  exampleShowDate: number; // earliest co-play event (deterministic receipt)
}

export function computeCoPlayEdges(plays: ResolvedPlay[], windowMs: number): CoPlayEdge[] {
  const byStation = new Map<string, ResolvedPlay[]>();
  for (const play of plays) {
    const list = byStation.get(play.stationSlug) ?? [];
    list.push(play);
    byStation.set(play.stationSlug, list);
  }

  const acc = new Map<string, { weight: number; stations: Set<string>; example: number }>();
  for (const [station, list] of byStation) {
    const sorted = [...list].sort((a, b) => a.playedAt - b.playedAt);
    let windowStart = 0;
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      while (sorted[windowStart].playedAt < current.playedAt - windowMs) windowStart += 1;
      for (let j = windowStart; j < i; j++) {
        const earlier = sorted[j];
        if (earlier.artistId === current.artistId) continue;
        const [from, to] =
          earlier.artistId < current.artistId
            ? [earlier.artistId, current.artistId]
            : [current.artistId, earlier.artistId];
        const key = `${from}|${to}`;
        const entry = acc.get(key) ?? { weight: 0, stations: new Set(), example: current.playedAt };
        entry.weight += 1;
        entry.stations.add(station);
        if (current.playedAt < entry.example) entry.example = current.playedAt;
        acc.set(key, entry);
      }
    }
  }

  return [...acc.entries()]
    .map(([key, entry]) => {
      const [fromArtistId, toArtistId] = key.split("|");
      return {
        fromArtistId,
        toArtistId,
        weight: entry.weight,
        stations: [...entry.stations].sort(),
        exampleShowDate: entry.example,
      };
    })
    .sort((a, b) => b.weight - a.weight);
}
