// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { buildAdjacency, type Adjacency, type SnapNode } from "./traversal";

// Server-side whole-graph snapshot for traversal routes. ~604 nodes and
// ~40k edges — a few MB, loaded once per server process by paging through
// Convex (queries cap at 32k docs, hence the cursor loops) and cached in
// module scope. `?refresh=1` on any traversal route rebuilds it.

export type TrackLite = {
  trackId: string;
  artistId: string;
  title: string;
  previewUrl?: string;
};

export type Snapshot = {
  nodes: Map<string, SnapNode>;
  adj: Adjacency;
  tracksByArtist: Map<string, TrackLite[]>;
  edgeCount: number;
  loadedAt: number;
};

let snapshotPromise: Promise<Snapshot> | null = null;

export function getSnapshot(refresh = false): Promise<Snapshot> {
  if (!snapshotPromise || refresh) {
    snapshotPromise = load().catch((err) => {
      snapshotPromise = null; // don't cache a failed load
      throw err;
    });
  }
  return snapshotPromise;
}

async function load(): Promise<Snapshot> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
  const client = new ConvexHttpClient(url);

  const nodes = new Map<string, SnapNode>();
  let cursor: string | null = null;
  do {
    const page = (await client.query(anyApi.app.nodesPage, { cursor })) as {
      items: SnapNode[];
      continueCursor: string | null;
    };
    for (const n of page.items) nodes.set(n.artistId, n);
    cursor = page.continueCursor;
  } while (cursor);

  const edges = [];
  cursor = null;
  do {
    const page = (await client.query(anyApi.app.edgesPage, { cursor })) as {
      items: { from: string; to: string; type: string; weight: number }[];
      continueCursor: string | null;
    };
    edges.push(...page.items);
    cursor = page.continueCursor;
  } while (cursor);

  const tracks = (await client.query(anyApi.app.trackIndex, {})) as TrackLite[];
  const tracksByArtist = new Map<string, TrackLite[]>();
  for (const t of tracks) {
    const list = tracksByArtist.get(t.artistId);
    if (list) list.push(t);
    else tracksByArtist.set(t.artistId, [t]);
  }

  return {
    nodes,
    adj: buildAdjacency(edges),
    tracksByArtist,
    edgeCount: edges.length,
    loadedAt: Date.now(),
  };
}

export function convexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
  return new ConvexHttpClient(url);
}
