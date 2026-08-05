// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import type { WorkItem } from "./convex.js";
import {
  deezerSearchArtist,
  discogsSearchArtist,
  mbSearchArtist,
  type MbCandidate,
} from "./sources.js";

// Candidate scoring + confidence buckets. Weighted components:
// name similarity, MusicBrainz search score, Discogs/Deezer cross-check
// agreement, genre coherence with the stations that played the artist, and
// era plausibility. The evidence string enumerates every component — that is
// the field-level provenance stored on the resolution record.

export const AUTO_THRESHOLD = 0.85;
export const ADJUDICATE_THRESHOLD = 0.55;
const AUTO_NAME_FLOOR = 0.85; // never auto-apply on a weak name match

const WEIGHTS = { name: 0.35, mb: 0.25, xcheck: 0.15, genre: 0.15, era: 0.1 };

// Playout artifacts that are not artists: station branding, placeholders.
const IGNORE_PATTERNS = [
  /414\s*music/i,
  /hyfin/i,
  /88\s*nine/i,
  /rhythm\s*lab/i,
  /radio\s*milwaukee/i,
  /^unknown( artist)?$/i,
  /^various( artists)?$/i,
];

// Loose station taste profiles for genre-coherence scoring. 414music is
// local-artist programming, so it carries no genre prior.
const STATION_GENRES: Record<string, string[]> = {
  hyfin: ["soul", "hip hop", "hip-hop", "rap", "r&b", "rnb", "funk", "afrobeats", "reggae", "jazz", "neo-soul"],
  "88nine": ["indie", "rock", "alternative", "pop", "folk", "soul", "electronic", "singer-songwriter"],
  rhythmlab: ["electronic", "jazz", "soul", "house", "downtempo", "broken beat", "hip hop"],
};

export function normalizeRaw(raw: string): string {
  let name = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*[([]?\s*(?:feat\.?|ft\.?|featuring)\s+.*$/i, "")
    .replace(/(.)\s*\([^)]*\)\s*$/, "$1") // "Silk Sonic (Bruno Mars & ...)" → "Silk Sonic"
    .trim();
  const inverted = name.match(/^(.+),\s*(the|a|an|los|las|les)$/i); // "Roots, The" → "The Roots"
  if (inverted) name = `${inverted[2]} ${inverted[1]}`;
  return name;
}

const canon = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Sørensen–Dice bigram similarity on canonicalized strings.
export function similarity(a: string, b: string): number {
  const ca = canon(a);
  const cb = canon(b);
  if (!ca || !cb) return 0;
  if (ca === cb) return 1;
  const bigrams = (s: string) => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      map.set(bg, (map.get(bg) ?? 0) + 1);
    }
    return map;
  };
  const ba = bigrams(ca);
  const bb = bigrams(cb);
  let overlap = 0;
  for (const [bg, count] of ba) overlap += Math.min(count, bb.get(bg) ?? 0);
  return (2 * overlap) / (ca.length - 1 + cb.length - 1);
}

export function isIgnorable(raw: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(raw));
}

export interface CrossChecks {
  discogs: { id: string; name: string } | null;
  deezer: { id: string; name: string; imageUrl?: string } | null;
}

export interface ScoredCandidate {
  candidate: MbCandidate;
  nameSim: number;
  genre: number;
  era: number;
  total: number;
  evidence: string;
}

export function scoreCandidate(
  candidate: MbCandidate,
  item: Pick<WorkItem, "rawArtist" | "stationSlugs">,
  crosschecks: CrossChecks
): ScoredCandidate {
  const normalized = normalizeRaw(item.rawArtist);
  const nameSim = Math.max(
    similarity(normalized, candidate.name),
    ...candidate.aliases.map((a) => similarity(normalized, a))
  );
  const mb = candidate.score / 100;

  const checks = [crosschecks.discogs, crosschecks.deezer].filter((c) => c !== null);
  const agreeing = checks.filter((c) => similarity(c.name, candidate.name) >= 0.85);
  const xcheck = checks.length === 0 ? 0.5 : agreeing.length / checks.length;

  const stationTags = item.stationSlugs.flatMap((s) => STATION_GENRES[s] ?? []);
  const candidateTags = candidate.tags.map((t) => t.toLowerCase());
  let genre = 0.5; // neutral: no tags, or no genre prior for these stations
  if (candidateTags.length > 0 && stationTags.length > 0) {
    genre = candidateTags.some((t) => stationTags.some((st) => t.includes(st) || st.includes(t)))
      ? 1
      : 0.35;
  }

  // Era: catalog play is normal, so only long-dead same-name acts get dinged.
  let era = 0.5;
  if (candidate.beginYear !== undefined) {
    era = candidate.endYear !== undefined && candidate.endYear < 1960 ? 0.25 : 1;
  }

  const total =
    WEIGHTS.name * nameSim +
    WEIGHTS.mb * mb +
    WEIGHTS.xcheck * xcheck +
    WEIGHTS.genre * genre +
    WEIGHTS.era * era;

  const agreeNames = agreeing.map((c) => (c === crosschecks.discogs ? "discogs" : "deezer"));
  const evidence =
    `name ${nameSim.toFixed(2)} · mb ${mb.toFixed(2)} · ` +
    `xcheck ${xcheck.toFixed(2)}${agreeNames.length ? ` (${agreeNames.join("+")})` : ""} · ` +
    `genre ${genre.toFixed(2)} · era ${era.toFixed(2)} → ${total.toFixed(2)}` +
    (candidate.disambiguation ? ` [${candidate.disambiguation}]` : "");

  return { candidate, nameSim, genre, era, total, evidence };
}

export type Decision =
  | { kind: "ignore"; reason: string }
  | { kind: "auto"; best: ScoredCandidate; method: "exact" | "fuzzy"; crosschecks: CrossChecks }
  | { kind: "adjudicate"; scored: ScoredCandidate[]; crosschecks: CrossChecks }
  | { kind: "review"; scored: ScoredCandidate[] };

export async function resolveItem(item: WorkItem): Promise<Decision> {
  if (isIgnorable(item.rawArtist)) {
    return { kind: "ignore", reason: "playout artifact (station branding / placeholder)" };
  }
  const normalized = normalizeRaw(item.rawArtist);
  const candidates = await mbSearchArtist(normalized);
  if (candidates.length === 0) return { kind: "review", scored: [] };

  const [discogs, deezer] = await Promise.all([
    discogsSearchArtist(normalized).catch(() => null),
    deezerSearchArtist(normalized).catch(() => null),
  ]);
  const crosschecks: CrossChecks = { discogs, deezer };

  const scored = candidates
    .map((c) => scoreCandidate(c, item, crosschecks))
    .sort((a, b) => b.total - a.total);

  const best = scored[0];
  // Auto-apply needs a positive corroborating signal beyond name agreement:
  // same-named artists match on name across MB/Discogs/Deezer alike (found in
  // hand-checking: a Virginia screamo band auto-applied for a local Milwaukee
  // act). Genre coherence or a known era distinguishes; otherwise Claude
  // adjudicates with station context and MB disambiguation.
  const corroborated = best.genre >= 1 || best.era >= 1;
  if (best.total >= AUTO_THRESHOLD && best.nameSim >= AUTO_NAME_FLOOR && corroborated) {
    const method = canon(normalized) === canon(best.candidate.name) ? "exact" : "fuzzy";
    return { kind: "auto", best, method, crosschecks };
  }
  if (best.total >= ADJUDICATE_THRESHOLD) {
    return { kind: "adjudicate", scored: scored.slice(0, 3), crosschecks };
  }
  return { kind: "review", scored: scored.slice(0, 3) };
}
