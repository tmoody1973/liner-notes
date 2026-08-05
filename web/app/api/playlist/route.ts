// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { NextRequest, NextResponse } from "next/server";
import { convexClient, getSnapshot } from "@/lib/graph-store";
import { kBfsArtists } from "@/lib/traversal";

const K_DEFAULT = 12;

// POST /api/playlist {seedArtistId, k?, targetNeighborhoodId?}
// Stell-R Algorithm 1 (coherence-filtered K-BFS) picks the artists,
// Algorithm 5 picks one track per artist; the playlist is persisted to
// Convex so its URL is stable. Regenerate = call again (fresh jitter).
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    seedArtistId?: string;
    k?: number;
    targetNeighborhoodId?: string;
  } | null;
  if (!body?.seedArtistId) {
    return NextResponse.json({ error: "seedArtistId required" }, { status: 400 });
  }
  const snap = await getSnapshot(req.nextUrl.searchParams.has("refresh"));
  if (!snap.nodes.has(body.seedArtistId)) {
    return NextResponse.json({ error: "unknown artist" }, { status: 404 });
  }
  const K = Math.min(Math.max(body.k ?? K_DEFAULT, 3), 25);
  const picks = kBfsArtists(snap.adj, snap.nodes, body.seedArtistId, K, {
    targetNeighborhoodId: body.targetNeighborhoodId,
    // Only artists with a track can contribute to a playlist (Algorithm 5
    // needs a song); the walk still traverses trackless artists.
    eligible: (id) => (snap.tracksByArtist.get(id)?.length ?? 0) > 0,
  });
  if (picks.length < 2) {
    return NextResponse.json(
      { error: "not enough connected artists with tracks" },
      { status: 422 }
    );
  }
  // Algorithm 5: one (random top-)track per recommended artist.
  const trackIds = [];
  const why = [];
  for (const pick of picks) {
    const tracks = snap.tracksByArtist.get(pick.artistId) ?? [];
    if (tracks.length === 0) continue;
    const withPreview = tracks.filter((t) => t.previewUrl);
    const pool = withPreview.length > 0 ? withPreview : tracks;
    const track = pool[Math.floor(Math.random() * pool.length)];
    trackIds.push(track.trackId);
    why.push({
      artistId: pick.artistId,
      viaArtistId: pick.viaArtistId,
      weight: pick.weight,
      type: pick.type,
    });
  }
  const playlistId = await convexClient().mutation(anyApi.playlists.create, {
    seedArtistIds: [body.seedArtistId],
    traversal: body.targetNeighborhoodId ? "cross-bridge-kbfs" : "coherent-kbfs",
    trackIds,
    why,
  });
  return NextResponse.json({ playlistId });
}
