// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { politeFetchJson } from "./polite.js";

// SonoVault (sonovault.now) — streaming-link resolution, plan A for MOO-471
// since the Odesli public API sunset. ISRC → cross-platform IDs, turned into
// open-in-service URLs stored on tracks.streamingLinks. Free tier: 1k req/mo,
// 20/min burst; svk_test_ keys return mocked data. No key → quietly disabled.

const BASE = "https://api.sonovault.now";
const INTERVAL = 3100; // 20/min free-tier burst → stay comfortably under

// The links payload maps platforms to IDs; exact field naming may vary, so we
// accept both bare and _id-suffixed keys. ponytail: verify against a real key
// once SONOVAULT_API_KEY lands in .env.local.
type LinksPayload = Record<string, unknown>;

const URL_BUILDERS: Record<string, (id: string) => string> = {
  spotify: (id) => `https://open.spotify.com/track/${id}`,
  applemusic: (id) => `https://music.apple.com/us/song/${id}`,
  tidal: (id) => `https://tidal.com/browse/track/${id}`,
  beatport: (id) => `https://www.beatport.com/track/-/${id}`,
  discogs: (id) => `https://www.discogs.com/release/${id}`,
  musicbrainz: (id) => `https://musicbrainz.org/recording/${id}`,
  youtube: (id) => `https://www.youtube.com/watch?v=${id}`,
};

function extractId(payload: LinksPayload, platform: string): string | undefined {
  for (const key of [platform, `${platform}_id`]) {
    const value = payload[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    if (value && typeof value === "object") {
      const inner = (value as Record<string, unknown>).id;
      if (typeof inner === "string" || typeof inner === "number") return String(inner);
    }
  }
  return undefined;
}

// ISRC → { spotify: url, applemusic: url, ... }; null when disabled/not found.
export async function sonovaultLinksByIsrc(
  isrc: string
): Promise<Record<string, string> | null> {
  const key = process.env.SONOVAULT_API_KEY;
  if (!key) return null;
  let payload: LinksPayload;
  try {
    payload = await politeFetchJson<LinksPayload>(
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
  const source = (payload.links && typeof payload.links === "object"
    ? (payload.links as LinksPayload)
    : payload) as LinksPayload;
  for (const [platform, build] of Object.entries(URL_BUILDERS)) {
    const id = extractId(source, platform);
    if (id) links[platform] = build(id);
  }
  return Object.keys(links).length > 0 ? links : null;
}
