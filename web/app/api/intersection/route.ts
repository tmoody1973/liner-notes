// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { NextRequest, NextResponse } from "next/server";
import { getSnapshot } from "@/lib/graph-store";
import { intersectionArtists } from "@/lib/traversal";

// GET /api/intersection?ids=a,b[,c...] — Stell-R Algorithm 4: artists at the
// crossroads of every seed's network, ranked by total connection strength.
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .filter(Boolean);
  if (ids.length < 2) {
    return NextResponse.json({ error: "at least 2 ids" }, { status: 400 });
  }
  const snap = await getSnapshot(req.nextUrl.searchParams.has("refresh"));
  for (const id of ids) {
    if (!snap.nodes.has(id)) {
      return NextResponse.json({ error: `unknown artist ${id}` }, { status: 404 });
    }
  }
  const found = intersectionArtists(snap.adj, ids, 12);
  return NextResponse.json({
    artists: found.map(({ artistId, strength }) => {
      const n = snap.nodes.get(artistId);
      return {
        artistId,
        displayName: n?.displayName ?? "?",
        imageUrl: n?.imageUrl,
        genres: (n?.genres ?? []).slice(0, 3),
        neighborhoodId: n?.neighborhoodId,
        spinCount: n?.spinCount ?? 0,
        strength,
      };
    }),
  });
}
