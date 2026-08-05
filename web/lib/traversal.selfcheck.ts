// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
// Known-answer checks for the Appendix A ports. Run via `npm run check`
// (agent workspace wires this in with tsx). assert-based, no framework.
import assert from "node:assert/strict";
import {
  buildAdjacency,
  genreDistance,
  intersectionArtists,
  kBfsArtists,
  maxFlow,
  shortestPath,
  type SnapNode,
} from "./traversal.js";

// Fixture: A—B strong (9), B—C strong (9), A—C weak (1), C—D (4), X isolated.
//   Dijkstra A→C must go via B: 1/10+1/10 = 0.2 < direct 1/2 = 0.5.
const edges = [
  { from: "A", to: "B", type: "curation", weight: 9 },
  { from: "B", to: "C", type: "curation", weight: 9 },
  { from: "A", to: "C", type: "curation", weight: 1 },
  { from: "C", to: "D", type: "canonical", weight: 4 },
];
const adj = buildAdjacency(edges);

const nodes = new Map<string, SnapNode>(
  (
    [
      ["A", ["soul"]],
      ["B", ["soul", "funk"]],
      ["C", ["funk"]],
      ["D", ["metal"]],
    ] as [string, string[]][]
  ).map(([id, genres]) => [
    id,
    {
      artistId: id,
      displayName: id,
      genres,
      spinCount: 10,
      stations: ["88nine"],
    },
  ])
);

// Algorithm 2 — the strong two-hop path beats the weak direct edge.
const path = shortestPath(adj, "A", "C");
assert.ok(path, "path A→C exists");
assert.deepEqual(path.path, ["A", "B", "C"], "Dijkstra prefers heavy edges");
assert.equal(path.hops.length, 2);
assert.equal(path.hops[0].weight, 9);
assert.equal(shortestPath(adj, "A", "X"), null, "no path to isolated node");
assert.deepEqual(shortestPath(adj, "A", "A"), { path: ["A"], hops: [] });

// Algorithm 3 — max flow A→C: min cut around C = 9 (via B) + 1 (direct) = 10.
const flow = maxFlow(adj, "A", "C");
assert.equal(flow.flow, 10, `maxflow A→C is 10, got ${flow.flow}`);
assert.equal(flow.capped, false);

// Coherence filter values.
assert.equal(genreDistance(["soul"], ["soul"]), 0);
assert.equal(genreDistance(["soul"], ["metal"]), 1);
assert.equal(genreDistance([], ["metal"]), 0.5, "unknown genres sit mid-scale");

// Algorithm 1 — τ=0.6 excludes D (funk↔metal distance 1) but admits A,B,C.
const seeded = () => 0.5; // deterministic jitter
const picks = kBfsArtists(adj, nodes, "A", 4, { tau: 0.6, rand: seeded });
assert.deepEqual(
  picks.map((p) => p.artistId).sort(),
  ["A", "B", "C"],
  "coherence filter blocks the genre lurch to D"
);
const viaB = picks.find((p) => p.artistId === "B");
assert.equal(viaB?.viaArtistId, "A", "provenance records the selecting hop");

// eligible() keeps traversing but only counts artists with tracks.
const eligiblePicks = kBfsArtists(adj, nodes, "A", 2, {
  tau: 1,
  rand: seeded,
  eligible: (id) => id !== "A",
});
assert.ok(!eligiblePicks.some((p) => p.artistId === "A"));
assert.equal(eligiblePicks.length, 2);

// Algorithm 4 — B and C are both neighbors of A and D's networks?
// Seeds A and D: layer 1 → C is neighbor of both (A—C, D—C) → crossroads.
const cross = intersectionArtists(adj, ["A", "D"], 3);
assert.equal(cross[0]?.artistId, "C", "C sits at the crossroads of A and D");

console.log("traversal selfcheck OK ✓ (dijkstra, maxflow, k-bfs, intersection)");
