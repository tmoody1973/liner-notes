// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { computeCoPlayEdges } from "./coplay.js";

// Known-answer test for the co-play window logic. Run via `npm run check`.

const MIN = 60_000;
const WINDOW = 60 * MIN;

const play = (artistId: string, stationSlug: string, minutes: number) => ({
  artistId,
  stationSlug,
  playedAt: minutes * MIN,
});

// 1. Basic window: X@0, Y@30 co-play; Z@90 pairs with Y (60min, boundary
//    inclusive) but not with X (90min).
{
  const edges = computeCoPlayEdges([play("X", "a", 0), play("Y", "a", 30), play("Z", "a", 90)], WINDOW);
  const keys = edges.map((e) => `${e.fromArtistId}-${e.toArtistId}`).sort();
  assert.deepEqual(keys, ["X-Y", "Y-Z"], `basic window: ${keys}`);
}

// 2. Boundary: 61 minutes apart is out, 59 is in.
{
  const out = computeCoPlayEdges([play("X", "a", 0), play("Y", "a", 61)], WINDOW);
  assert.equal(out.length, 0, "61min apart must not connect");
  const inn = computeCoPlayEdges([play("X", "a", 0), play("Y", "a", 59)], WINDOW);
  assert.equal(inn.length, 1, "59min apart must connect");
}

// 3. No self-edges; repeat plays of the same pair accumulate weight.
{
  const edges = computeCoPlayEdges(
    [play("X", "a", 0), play("Y", "a", 10), play("X", "a", 20), play("X", "a", 25)],
    WINDOW
  );
  assert.equal(edges.length, 1, "one distinct pair");
  assert.equal(edges[0].weight, 3, `X-Y co-events: X0·Y10, Y10·X20, Y10·X25 → 3, got ${edges[0].weight}`);
}

// 4. Canonical ordering: Y-before-X and X-before-Y land on one edge.
{
  const edges = computeCoPlayEdges([play("Y", "a", 0), play("X", "a", 10)], WINDOW);
  assert.equal(edges[0].fromArtistId, "X");
  assert.equal(edges[0].toArtistId, "Y");
}

// 5. Stations never cross-pollinate; both stations recorded when both co-play.
{
  const edges = computeCoPlayEdges([play("X", "a", 0), play("Y", "b", 10)], WINDOW);
  assert.equal(edges.length, 0, "different stations at same hour must not connect");
  const both = computeCoPlayEdges(
    [play("X", "a", 0), play("Y", "a", 10), play("X", "b", 500), play("Y", "b", 510)],
    WINDOW
  );
  assert.equal(both.length, 1);
  assert.deepEqual(both[0].stations, ["a", "b"]);
  assert.equal(both[0].weight, 2);
}

// 6. Receipt: exampleShowDate is the earliest co-play event, deterministically.
{
  const edges = computeCoPlayEdges(
    [play("X", "a", 0), play("Y", "a", 30), play("X", "a", 200), play("Y", "a", 210)],
    WINDOW
  );
  assert.equal(edges[0].exampleShowDate, 30 * MIN);
}

// 7. Determinism: shuffled input, identical output.
{
  const plays = [play("X", "a", 0), play("Y", "a", 30), play("Z", "a", 45), play("W", "a", 300)];
  const a = computeCoPlayEdges(plays, WINDOW);
  const b = computeCoPlayEdges([...plays].reverse(), WINDOW);
  assert.deepEqual(a, b, "shuffled input must produce identical edges");
}

console.log("coplay.selfcheck: all assertions passed");
