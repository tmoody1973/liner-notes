// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { politeFetchJson } from "./polite.js";

// External catalog APIs the resolver consults. Everything goes through
// politeFetchJson: MusicBrainz 1 req/s (polite UA required), Discogs 60/min
// (token), Deezer public. Responses are disk-cached so re-runs are free.

const MB_UA = "LinerNotes/0.1 (tarik@radiomilwaukee.org)";
const MB_INTERVAL = 1100;
const DISCOGS_INTERVAL = 1100;
const DEEZER_INTERVAL = 150;

export interface MbCandidate {
  mbid: string;
  name: string;
  score: number; // MusicBrainz search score 0..100
  type?: string;
  disambiguation?: string;
  tags: string[];
  aliases: string[];
  beginYear?: number;
  endYear?: number;
}

interface MbArtistSearchResponse {
  artists?: {
    id: string;
    name: string;
    score?: number;
    type?: string;
    disambiguation?: string;
    tags?: { name: string; count?: number }[];
    aliases?: { name: string }[];
    "life-span"?: { begin?: string; end?: string };
  }[];
}

const year = (s?: string) => {
  const y = Number(s?.slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
};

export async function mbSearchArtist(name: string): Promise<MbCandidate[]> {
  const quoted = await mbArtistQuery(`artist:"${name.replace(/"/g, '\\"')}"`, name, "exactq");
  if (quoted.length > 0) return quoted;
  // Fallback: unquoted Lucene query (sanitized) catches typos, inversions,
  // and punctuation-heavy playout strings the strict phrase search misses.
  const loose = name.replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
  if (!loose) return [];
  return mbArtistQuery(loose, name, "loose");
}

async function mbArtistQuery(
  query: string,
  name: string,
  kind: string
): Promise<MbCandidate[]> {
  const url = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(query)}&limit=5&fmt=json`;
  const data = await politeFetchJson<MbArtistSearchResponse>(url, {
    minIntervalMs: MB_INTERVAL,
    headers: { "User-Agent": MB_UA },
    cacheKey: `mb:artist-search:${kind}:${name.toLowerCase()}`,
  });
  return (data.artists ?? []).map((a) => ({
    mbid: a.id,
    name: a.name,
    score: a.score ?? 0,
    type: a.type,
    disambiguation: a.disambiguation,
    tags: (a.tags ?? []).map((t) => t.name),
    aliases: (a.aliases ?? []).map((al) => al.name),
    beginYear: year(a["life-span"]?.begin),
    endYear: year(a["life-span"]?.end),
  }));
}

export interface MbArtistDetail {
  genres: string[];
  relations: { type: string; targetMbid: string; targetName: string }[];
}

interface MbArtistLookupResponse {
  genres?: { name: string; count?: number }[];
  relations?: { type: string; artist?: { id: string; name: string } }[];
}

export async function mbGetArtist(mbid: string): Promise<MbArtistDetail> {
  const url = `https://musicbrainz.org/ws/2/artist/${mbid}?inc=genres+artist-rels&fmt=json`;
  const data = await politeFetchJson<MbArtistLookupResponse>(url, {
    minIntervalMs: MB_INTERVAL,
    headers: { "User-Agent": MB_UA },
    cacheKey: `mb:artist:${mbid}`,
  });
  const genres = (data.genres ?? [])
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 8)
    .map((g) => g.name);
  const relations = (data.relations ?? [])
    .filter((r) => r.artist)
    .slice(0, 10)
    .map((r) => ({ type: r.type, targetMbid: r.artist!.id, targetName: r.artist!.name }));
  return { genres, relations };
}

export interface MbRecording {
  isrc?: string;
  releaseYear?: number;
}

interface MbRecordingSearchResponse {
  recordings?: {
    isrcs?: string[];
    "first-release-date"?: string;
  }[];
}

export async function mbSearchRecording(title: string, arid: string): Promise<MbRecording> {
  const query = `recording:"${title.replace(/"/g, '\\"')}" AND arid:${arid}`;
  const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&limit=3&fmt=json`;
  const data = await politeFetchJson<MbRecordingSearchResponse>(url, {
    minIntervalMs: MB_INTERVAL,
    headers: { "User-Agent": MB_UA },
    cacheKey: `mb:recording:${arid}:${title.toLowerCase()}`,
  });
  const withIsrc = (data.recordings ?? []).find((r) => r.isrcs?.length) ?? data.recordings?.[0];
  return {
    isrc: withIsrc?.isrcs?.[0],
    releaseYear: year(withIsrc?.["first-release-date"]),
  };
}

interface DiscogsSearchResponse {
  results?: { id: number; title: string }[];
}

// Returns the top Discogs artist hit, or null (also when no token configured).
export async function discogsSearchArtist(
  name: string
): Promise<{ id: string; name: string } | null> {
  const token = process.env.DISCOGS_TOKEN;
  if (!token) return null;
  const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(name)}&type=artist&per_page=3&token=${token}`;
  const data = await politeFetchJson<DiscogsSearchResponse>(url, {
    minIntervalMs: DISCOGS_INTERVAL,
    headers: { "User-Agent": MB_UA },
    cacheKey: `discogs:artist:${name.toLowerCase()}`,
  });
  const top = data.results?.[0];
  return top ? { id: String(top.id), name: top.title } : null;
}

interface DeezerSearchResponse {
  data?: { id: number; name: string; picture_xl?: string }[];
}

export async function deezerSearchArtist(
  name: string
): Promise<{ id: string; name: string; imageUrl?: string } | null> {
  const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`;
  const data = await politeFetchJson<DeezerSearchResponse>(url, {
    minIntervalMs: DEEZER_INTERVAL,
    cacheKey: `deezer:artist:${name.toLowerCase()}`,
  });
  const top = data.data?.[0];
  return top ? { id: String(top.id), name: top.name, imageUrl: top.picture_xl } : null;
}
