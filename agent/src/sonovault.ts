// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { politeFetchJson } from "./polite.js";

// SonoVault (sonovault.now) — streaming-link resolution, plan A for MOO-471
// since the Odesli public API sunset. ISRC → per-platform URLs stored on
// tracks.streamingLinks. Starter plan: 50k req/mo, 60/min burst. Response
// shape verified live 2026-08-05: { links: [{source, external_id, url}] }.
// No key → quietly disabled.

const BASE = "https://api.sonovault.now";
const INTERVAL = 1100; // 60/min Starter burst

interface LinksResponse {
  track_id?: number;
  title?: string;
  isrc?: string;
  links?: { source: string; external_id: string; url: string }[];
}

// ISRC → { spotify: url, musicbrainz: url, ... }; null when disabled/not found.
export async function sonovaultLinksByIsrc(
  isrc: string
): Promise<Record<string, string> | null> {
  const key = process.env.SONOVAULT_API_KEY;
  if (!key) return null;
  let payload: LinksResponse;
  try {
    payload = await politeFetchJson<LinksResponse>(
      `${BASE}/v1/tracks/links?isrc=${encodeURIComponent(isrc)}`,
      {
        minIntervalMs: INTERVAL,
        headers: { "x-api-key": key },
        cacheKey: `sonovault:links:${isrc}`,
      }
    );
  } catch {
    return null; // 404 not-found or quota — track falls through to song.link fallback
  }
  const links: Record<string, string> = {};
  for (const link of payload.links ?? []) {
    if (link.source && link.url) links[link.source] = link.url;
  }
  return Object.keys(links).length > 0 ? links : null;
}
