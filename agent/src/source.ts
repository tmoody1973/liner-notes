// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { politeFetchJson } from "./polite.js";
import { LinerNotesClient } from "./convex.js";

// Reads plays from the source of record. Two modes:
//   real  — rm-playlist-v2 via Convex streaming export (read-only deploy key)
//   judge — anonymized sample data seeded into the Liner Notes deployment

export type SourceMode = "real" | "judge";

export interface PlayRecord {
  artistRaw: string;
  titleRaw?: string;
  playedAt?: number;
  stationSlug: string;
  enrichmentStatus: string;
}

export function detectMode(explicit?: string): SourceMode {
  if (explicit === "real" || explicit === "judge") return explicit;
  return process.env.CONVEX_SOURCE_URL && process.env.CONVEX_SOURCE_DEPLOY_KEY
    ? "real"
    : "judge";
}

// ponytail: caps at maxPages (~1024 plays each) per session and narrates the
// cap; incremental sync via document_deltas is a post-chassis upgrade.
export async function readPlays(
  mode: SourceMode,
  linerNotes: LinerNotesClient,
  { maxPages = 20 }: { maxPages?: number } = {}
): Promise<{ plays: PlayRecord[]; complete: boolean }> {
  if (mode === "judge") {
    const plays = await linerNotes.judgePlays();
    return { plays, complete: true };
  }

  const base = process.env.CONVEX_SOURCE_URL!.replace(/\/$/, "");
  const key = process.env.CONVEX_SOURCE_DEPLOY_KEY!;
  const headers = { Authorization: `Convex ${key}` };

  // Station id -> slug so worklists read like "hyfin", not document ids.
  const stationsPage = await politeFetchJson<{ values: { _id: string; slug: string }[] }>(
    `${base}/api/list_snapshot?tableName=stations`,
    { headers, cacheKey: `stations:${base}` }
  );
  const stationSlugById = new Map(stationsPage.values.map((s) => [s._id, s.slug]));

  const plays: PlayRecord[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ tableName: "plays" });
    if (cursor) params.set("cursor", cursor);
    const snapshot = await politeFetchJson<{
      values: {
        artistRaw?: string;
        titleRaw?: string;
        playedAt?: number;
        stationId?: string;
        enrichmentStatus?: string;
      }[];
      cursor?: string;
      hasMore: boolean;
    }>(`${base}/api/list_snapshot?${params}`, { headers });

    for (const play of snapshot.values) {
      if (!play.artistRaw) continue;
      plays.push({
        artistRaw: play.artistRaw,
        titleRaw: play.titleRaw,
        playedAt: play.playedAt,
        stationSlug: stationSlugById.get(play.stationId ?? "") ?? "unknown",
        enrichmentStatus: play.enrichmentStatus ?? "pending",
      });
    }
    if (!snapshot.hasMore) return { plays, complete: true };
    cursor = snapshot.cursor;
  }
  return { plays, complete: false };
}
