// MOO-465 verification: independently recount co-play weights for sampled
// pairs using a BRUTE-FORCE per-pair algorithm (different from the sliding
// window in coplay.ts), and verify canonical edges against MusicBrainz.
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { LinerNotesClient } from "../convex.js";
import { loadEnv, requireEnv } from "../env.js";
import { graphConfig } from "../graph/config.js";
import { readPlays } from "../source.js";

loadEnv();
const linerNotes = new LinerNotesClient();
const convex = new ConvexHttpClient(requireEnv("CONVEX_URL"));
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

const artists = await linerNotes.catalogArtists();
const byId = new Map(artists.map((a) => [a._id, a]));
const idByRawName = new Map<string, string>();
for (const a of artists) for (const raw of a.rawNames) idByRawName.set(norm(raw), a._id);

console.log("scanning plays for independent recount...");
const { plays } = await readPlays("real", linerNotes, { maxPages: graphConfig.maxPages });
type P = { artistId: string; stationSlug: string; playedAt: number };
const resolved: P[] = [];
for (const p of plays) {
  const id = idByRawName.get(norm(p.artistRaw));
  if (id && p.playedAt !== undefined)
    resolved.push({ artistId: id, stationSlug: p.stationSlug, playedAt: p.playedAt });
}
console.log(`${resolved.length} resolved plays\n`);

// Brute force: for pair (A,B), count all (playA, playB) same-station pairs
// within the window. O(nA*nB) per pair — independent of the sliding window.
function bruteForceWeight(a: string, b: string) {
  const playsA = resolved.filter((p) => p.artistId === a);
  const playsB = resolved.filter((p) => p.artistId === b);
  let count = 0;
  const examples: { station: string; ta: number; tb: number }[] = [];
  for (const pa of playsA)
    for (const pb of playsB)
      if (
        pa.stationSlug === pb.stationSlug &&
        Math.abs(pa.playedAt - pb.playedAt) <= graphConfig.windowMs
      ) {
        count += 1;
        if (examples.length < 2) examples.push({ station: pa.stationSlug, ta: pa.playedAt, tb: pb.playedAt });
      }
  return { count, examples };
}

// Sample: recompute pair counts brute-force over ALL pairs is too slow; instead
// take the 5 highest-spin artist pairs among stored edges by querying the pairs
// of the 6 most-played artists (dense corner of the graph) + 2 mid pairs.
const spinCounts = new Map<string, number>();
for (const p of resolved) spinCounts.set(p.artistId, (spinCounts.get(p.artistId) ?? 0) + 1);
const topArtists = [...spinCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id);
const midArtists = [...spinCounts.entries()].sort((a, b) => b[1] - a[1]).slice(40, 44).map(([id]) => id);
const samplePairs: [string, string][] = [
  [topArtists[0], topArtists[1]],
  [topArtists[0], topArtists[2]],
  [topArtists[1], topArtists[3]],
  [midArtists[0], midArtists[1]],
  [midArtists[2], midArtists[3]],
];

console.log("=== Curation edge spot-checks (stored weight vs independent brute-force recount) ===");
for (const [a, b] of samplePairs) {
  const stored = (await convex.query(anyApi.graph.edgeBetween, { a, b })) as {
    type: string;
    weight: number;
    receipt: { coPlayCount?: number; stations?: string[]; exampleShowDate?: number };
  }[];
  const curation = stored.find((e) => e.type === "curation");
  const brute = bruteForceWeight(a, b);
  const nameA = byId.get(a)?.displayName;
  const nameB = byId.get(b)?.displayName;
  const storedW = curation?.weight ?? 0;
  const match = storedW === brute.count || (brute.count < graphConfig.minCurationWeight && !curation);
  console.log(
    `${match ? "✓" : "✗"} "${nameA}" ↔ "${nameB}": stored=${storedW} brute-force=${brute.count}` +
      (curation ? ` stations=${curation.receipt.stations} example=${new Date(curation.receipt.exampleShowDate!).toISOString()}` : " (below noise floor — correctly absent)")
  );
  if (brute.examples[0]) {
    const e = brute.examples[0];
    console.log(
      `    real co-play: ${e.station} ${new Date(e.ta).toISOString()} & ${new Date(e.tb).toISOString()} (${Math.round(Math.abs(e.ta - e.tb) / 60000)}min apart)`
    );
  }
}

console.log("\n=== Canonical edge spot-checks (vs MusicBrainz) ===");
const canonical = artists.flatMap((a) =>
  a.mbRelations
    .filter((r) => artists.some((t) => t.mbid === r.targetMbid && t._id !== a._id))
    .map((r) => ({ from: a, rel: r }))
);
for (const { from, rel } of canonical) {
  const target = artists.find((t) => t.mbid === rel.targetMbid)!;
  const stored = (await convex.query(anyApi.graph.edgeBetween, { a: from._id, b: target._id })) as {
    type: string;
    receipt: { mbRelationType?: string };
  }[];
  const edge = stored.find((e) => e.type === "canonical");
  console.log(
    `${edge && edge.receipt.mbRelationType === rel.type ? "✓" : "✗"} "${from.displayName}" —[${rel.type}]→ "${target.displayName}"`
  );
  console.log(`    verify: https://musicbrainz.org/artist/${from.mbid} ↔ https://musicbrainz.org/artist/${target.mbid}`);
}
console.log("\nVERIFY_DONE");
