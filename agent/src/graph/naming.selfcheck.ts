// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { matchNeighborhoods } from "./naming.js";

// Smallest runnable check for neighborhood name pinning. Run: npm run check

const prev = [
  { name: "Bronzeville Beat Loop", description: "hip-hop", artistIds: ["a", "b", "c", "d"] },
  { name: "Bay View Indie Row", description: "indie", artistIds: ["x", "y", "z"] },
];

// Clusters drifted but clearly the same districts → both names kept, right order
const matched = matchNeighborhoods(prev, [
  ["x", "y", "q"], // 2/4 overlap with Bay View
  ["a", "b", "c", "e", "f"], // 3/6 overlap with Bronzeville
]);
assert.equal(matched[0]?.name, "Bay View Indie Row");
assert.equal(matched[1]?.name, "Bronzeville Beat Loop");

// A genuinely new cluster gets no pinned name
const withNew = matchNeighborhoods(prev, [
  ["a", "b", "c", "d"],
  ["m", "n", "o"],
]);
assert.equal(withNew[0]?.name, "Bronzeville Beat Loop");
assert.equal(withNew[1], null);

// One previous district can pin at most one cluster (best overlap wins)
const split = matchNeighborhoods(prev, [
  ["a", "b", "c"],
  ["a", "d"],
]);
assert.equal(split[0]?.name, "Bronzeville Beat Loop");
assert.equal(split[1], null);

// Below-threshold overlap does not pin (1 shared of 8 union)
const weak = matchNeighborhoods(prev, [["a", "p", "q", "r", "s"]]);
assert.equal(weak[0], null);

// First build (no previous neighborhoods) pins nothing
assert.deepEqual(matchNeighborhoods([], [["a", "b"]]), [null]);

console.log("naming.selfcheck: all assertions passed");
