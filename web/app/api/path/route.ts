// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { NextRequest, NextResponse } from "next/server";
import { getSnapshot } from "@/lib/graph-store";
import { maxFlow, shortestPath } from "@/lib/traversal";

// GET /api/path?from=<artistId>&to=<artistId> — Stell-R Algorithm 2
// (modified Dijkstra) plus Algorithm 3 (max influence flow) as the
// "influence strength" of the pair.
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 });
  }
  const snap = await getSnapshot(req.nextUrl.searchParams.has("refresh"));
  if (!snap.nodes.has(from) || !snap.nodes.has(to)) {
    return NextResponse.json({ error: "unknown artist" }, { status: 404 });
  }
  const result = shortestPath(snap.adj, from, to);
  if (!result) return NextResponse.json({ path: null, flow: null });
  const flow = maxFlow(snap.adj, from, to);
  const lite = (id: string) => {
    const n = snap.nodes.get(id);
    return {
      artistId: id,
      displayName: n?.displayName ?? "?",
      imageUrl: n?.imageUrl,
      genres: (n?.genres ?? []).slice(0, 3),
      neighborhoodId: n?.neighborhoodId,
      spinCount: n?.spinCount ?? 0,
    };
  };
  return NextResponse.json({
    path: result.path.map(lite),
    hops: result.hops,
    flow: { value: flow.flow, atLeast: flow.capped },
  });
}
