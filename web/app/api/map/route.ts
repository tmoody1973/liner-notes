// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { NextRequest, NextResponse } from "next/server";
import { getSnapshot } from "@/lib/graph-store";
import { BRIDGE_THRESHOLD } from "@/lib/palette";

// GET /api/map — the zoomed-out city map: every node, edges trimmed to the
// strongest (the full 40k would be a hairball), and each bridge artist's
// district pair (the two neighborhoods its connections concentrate in).
const MIN_MAP_WEIGHT = 12;
const TOP_PER_NODE = 2;

export async function GET(req: NextRequest) {
  const snap = await getSnapshot(req.nextUrl.searchParams.has("refresh"));

  // Keep an edge if it's heavy, or if it's one of either endpoint's top-2 —
  // the union keeps sparse corners of the map connected.
  const keep = new Set<string>();
  const edgeKey = (a: string, b: string, w: number) => `${a}|${b}|${w}`;
  for (const [id, neighbors] of snap.adj) {
    const top = [...neighbors].sort((a, b) => b.weight - a.weight).slice(0, TOP_PER_NODE);
    for (const n of top) keep.add(edgeKey(id, n.other, n.weight));
  }
  const edges: { from: string; to: string; type: string; weight: number }[] = [];
  const seen = new Set<string>();
  for (const [id, neighbors] of snap.adj) {
    for (const n of neighbors) {
      const pair = id < n.other ? `${id}|${n.other}` : `${n.other}|${id}`;
      if (seen.has(pair)) continue;
      if (
        n.weight >= MIN_MAP_WEIGHT ||
        keep.has(edgeKey(id, n.other, n.weight)) ||
        keep.has(edgeKey(n.other, id, n.weight))
      ) {
        seen.add(pair);
        edges.push({ from: id, to: n.other, type: n.type, weight: n.weight });
      }
    }
  }

  // Bridge pairs: for each qualifying artist, the two districts its co-play
  // weight concentrates in.
  const bridges: Record<string, string[]> = {};
  for (const [id, node] of snap.nodes) {
    if ((node.bridgeScore ?? 0) < BRIDGE_THRESHOLD) continue;
    const tally = new Map<string, number>();
    for (const n of snap.adj.get(id) ?? []) {
      const hood = snap.nodes.get(n.other)?.neighborhoodId;
      if (hood) tally.set(hood, (tally.get(hood) ?? 0) + n.weight);
    }
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (top.length === 2) bridges[id] = top.map(([hood]) => hood);
  }

  return NextResponse.json({
    nodes: [...snap.nodes.values()],
    edges,
    bridges,
    edgeCount: snap.edgeCount,
  });
}
