// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import {
  ADJUDICATE_THRESHOLD,
  AUTO_THRESHOLD,
  isIgnorable,
  normalizeRaw,
  scoreCandidate,
  similarity,
} from "./resolve.js";

// Smallest runnable check for the pure resolution logic. Run: npm run check

// normalizeRaw strips featured artists and noise whitespace
assert.equal(normalizeRaw("  Beyoncé   feat. Jay-Z "), "Beyoncé");
assert.equal(normalizeRaw("Little Simz ft. Cleo Sol"), "Little Simz");
assert.equal(normalizeRaw("Khruangbin (featuring Leon Bridges)"), "Khruangbin");
assert.equal(normalizeRaw("The Roots"), "The Roots");
assert.equal(normalizeRaw("Roots, The"), "The Roots");
assert.equal(normalizeRaw("Silk Sonic (Bruno Mars & Anderson .Paak)"), "Silk Sonic");

// similarity: exact (diacritics/case-insensitive), near, and far
assert.equal(similarity("Beyoncé", "beyonce"), 1);
assert.ok(similarity("Tyler The Creator", "Tyler, the Creator") > 0.9);
assert.ok(similarity("Radiohead", "Erykah Badu") < 0.3);

// station branding / placeholders are ignorable, real artists are not
assert.ok(isIgnorable("414Music.FM"));
assert.ok(isIgnorable("HYFIN"));
assert.ok(isIgnorable("Unknown Artist"));
assert.ok(!isIgnorable("Sault"));

// scoring: a perfect match on a genre-coherent station clears AUTO_THRESHOLD
const strong = scoreCandidate(
  {
    mbid: "x",
    name: "Little Simz",
    score: 100,
    tags: ["hip hop", "uk rap"],
    aliases: [],
    beginYear: 2010,
  },
  { rawArtist: "Little Simz", stationSlugs: ["hyfin"] },
  { discogs: { id: "1", name: "Little Simz" }, deezer: { id: "2", name: "Little Simz" } }
);
assert.ok(strong.total >= AUTO_THRESHOLD, `expected auto, got ${strong.total}`);
assert.ok(strong.evidence.includes("name 1.00"));

// name-only agreement with zero corroboration (no tags, no life-span) must
// NOT clear the auto bar — this is the "Dialogues" screamo-band false positive
const nameOnly = scoreCandidate(
  { mbid: "z", name: "Dialogues", score: 100, tags: [], aliases: [] },
  { rawArtist: "Dialogues", stationSlugs: ["414music", "88nine"] },
  { discogs: { id: "1", name: "Dialogues" }, deezer: { id: "2", name: "Dialogues" } }
);
assert.ok(nameOnly.genre < 1 && nameOnly.era < 1, "expected neutral genre/era");
assert.ok(
  !(nameOnly.genre >= 1 || nameOnly.era >= 1),
  "name-only match must fail the corroboration gate"
);

// a weak name match with mediocre corroboration lands below the auto bar
const weak = scoreCandidate(
  { mbid: "y", name: "Completely Different Band", score: 55, tags: [], aliases: [] },
  { rawArtist: "Little Simz", stationSlugs: ["hyfin"] },
  { discogs: null, deezer: null }
);
assert.ok(weak.total < ADJUDICATE_THRESHOLD, `expected review-tier, got ${weak.total}`);

console.log("resolve.selfcheck: all assertions passed");
