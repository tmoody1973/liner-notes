// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { v } from "convex/values";
import { query } from "./_generated/server";

// Listener-facing reads for the M4 discovery app. All queries here are
// bounded: whole-table reads only over small tables (604 nodes, 613 artists,
// 4 neighborhoods), and graphEdges (~40k rows) only through by_from/by_to
// index ranges — never a full scan (Convex caps queries at 32k documents).

// One row per graph node, lite fields — the client keeps this in memory for
// instant search, featured lists, and artist pickers. ~604 rows.
export const artistIndex = query({
  args: {},
  handler: async (ctx) => {
    const nodes = await ctx.db.query("graphNodes").collect();
    const result = [];
    for (const node of nodes) {
      const artist = await ctx.db.get(node.artistId);
      if (!artist) continue;
      result.push({
        artistId: node.artistId,
        displayName: artist.displayName,
        imageUrl: artist.imageUrl,
        genres: (artist.genres ?? []).slice(0, 3),
        spinCount: node.spinCount,
        stations: node.stations,
        neighborhoodId: node.neighborhoodId,
        bridgeScore: node.bridgeScore,
      });
    }
    return result;
  },
});

// The nightly loop's visible pulse: artists that entered the catalog in the
// last `days` (default 7), newest first. Stations/spins come from workItems
// because brand-new artists have no graph node until the next rebuild.
export const newThisWeek = query({
  args: { days: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, { days, limit }) => {
    const since = Date.now() - (days ?? 7) * 24 * 60 * 60 * 1000;
    const artists = await ctx.db.query("artists").collect();
    const fresh = artists
      .filter((a) => (a.resolution?.resolvedAt ?? 0) >= since)
      .sort((a, b) => (b.resolution?.resolvedAt ?? 0) - (a.resolution?.resolvedAt ?? 0))
      .slice(0, limit ?? 12);
    const result = [];
    for (const artist of fresh) {
      const stations = new Set<string>();
      let playCount = 0;
      for (const raw of artist.rawNames) {
        const item = await ctx.db
          .query("workItems")
          .withIndex("by_rawArtist", (q) => q.eq("rawArtist", raw))
          .unique();
        if (!item) continue;
        playCount += item.playCount;
        for (const slug of item.stationSlugs) stations.add(slug);
      }
      result.push({
        artistId: artist._id,
        displayName: artist.displayName,
        imageUrl: artist.imageUrl,
        genres: (artist.genres ?? []).slice(0, 2),
        resolvedAt: artist.resolution?.resolvedAt ?? 0,
        stations: [...stations].sort(),
        playCount,
      });
    }
    return result;
  },
});

// Everything the artist page needs in one read: identity, enrichment,
// resolution provenance (trust chip), airplay stats, neighborhood, tracks.
export const artistPanel = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, { artistId }) => {
    const artist = await ctx.db.get(artistId);
    if (!artist) return null;
    const node = await ctx.db
      .query("graphNodes")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .unique();
    const neighborhood = node?.neighborhoodId
      ? await ctx.db.get(node.neighborhoodId)
      : null;
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .collect();
    let lastRunAt: number | null = null;
    if (artist.resolution?.runId) {
      const run = await ctx.db.get(artist.resolution.runId);
      lastRunAt = run?.startedAt ?? null;
    }
    return {
      artistId,
      displayName: artist.displayName,
      rawNames: artist.rawNames,
      mbid: artist.mbid,
      imageUrl: artist.imageUrl,
      genres: artist.genres ?? [],
      resolution: artist.resolution ?? null,
      lastRunAt,
      spinCount: node?.spinCount ?? 0,
      firstAired: node?.firstAired,
      lastAired: node?.lastAired,
      stations: node?.stations ?? [],
      bridgeScore: node?.bridgeScore,
      neighborhood: neighborhood
        ? { id: neighborhood._id, name: neighborhood.name }
        : null,
      tracks: tracks.map((t) => ({
        id: t._id,
        title: t.title,
        isrc: t.isrc,
        releaseYear: t.releaseYear,
        previewUrl: t.previewUrl,
        streamingLinks: t.streamingLinks ?? {},
      })),
    };
  },
});

// The explorer's view: the focused artist, its strongest neighbors, and the
// edges among them. Station filter applies to curation edges (their receipt
// carries co-play stations); canonical edges are station-independent facts
// and stay visible. Reads ≈ focus degree + Σ by_from degree of shown
// neighbors — ~2k docs typical, safely under the 32k query cap.
export const egoNetwork = query({
  args: {
    artistId: v.id("artists"),
    station: v.optional(v.string()),
    maxNeighbors: v.optional(v.number()),
  },
  handler: async (ctx, { artistId, station, maxNeighbors }) => {
    const cap = Math.min(maxNeighbors ?? 30, 60);
    const matchesStation = (edge: {
      type: string;
      receipt: { stations?: string[] };
    }) =>
      !station ||
      edge.type !== "curation" ||
      (edge.receipt.stations ?? []).includes(station);

    const fromFocus = await ctx.db
      .query("graphEdges")
      .withIndex("by_from", (q) => q.eq("fromArtistId", artistId))
      .collect();
    const toFocus = await ctx.db
      .query("graphEdges")
      .withIndex("by_to", (q) => q.eq("toArtistId", artistId))
      .collect();
    // Curation edges compete for the cap by weight; canonical and editorial
    // edges are rare, precious, and weight-1 — they always make the cut.
    const allFocus = [...fromFocus, ...toFocus].filter(matchesStation);
    const special = allFocus.filter((e) => e.type !== "curation");
    const focusEdges = [
      ...special,
      ...allFocus
        .filter((e) => e.type === "curation")
        .sort((a, b) => b.weight - a.weight)
        .slice(0, cap),
    ];

    const visible = new Set<string>([artistId]);
    for (const e of focusEdges) {
      visible.add(e.fromArtistId);
      visible.add(e.toArtistId);
    }

    // Edges among the visible neighbors: every stored edge has one endpoint
    // as `from`, so scanning by_from per visible node finds them all.
    const interEdges = [];
    for (const id of visible) {
      if (id === artistId) continue;
      const out = await ctx.db
        .query("graphEdges")
        .withIndex("by_from", (q) =>
          q.eq("fromArtistId", id as typeof artistId)
        )
        .collect();
      for (const e of out) {
        if (e.toArtistId !== artistId && visible.has(e.toArtistId) && matchesStation(e)) {
          interEdges.push(e);
        }
      }
    }

    const nodes = [];
    for (const id of visible) {
      const nodeArtistId = id as typeof artistId;
      const artist = await ctx.db.get(nodeArtistId);
      const node = await ctx.db
        .query("graphNodes")
        .withIndex("by_artist", (q) => q.eq("artistId", nodeArtistId))
        .unique();
      if (!artist || !node) continue;
      nodes.push({
        artistId: nodeArtistId,
        displayName: artist.displayName,
        imageUrl: artist.imageUrl,
        spinCount: node.spinCount,
        stations: node.stations,
        neighborhoodId: node.neighborhoodId,
        bridgeScore: node.bridgeScore,
      });
    }

    // Guard: an edge endpoint without a graph node (e.g. an editorial match
    // to a catalog artist the graph build predates) would crash the renderer.
    const placed = new Set(nodes.map((n) => n.artistId));
    const edges = [...focusEdges, ...interEdges]
      .filter((e) => placed.has(e.fromArtistId) && placed.has(e.toArtistId))
      .map((e) => ({
        id: e._id,
        from: e.fromArtistId,
        to: e.toArtistId,
        type: e.type,
        weight: e.weight,
        receipt: e.receipt,
      }));
    return { focus: artistId, nodes, edges };
  },
});

// Neighborhoods with member counts — nav cards and map legend. ~608 reads.
export const neighborhoodList = query({
  args: {},
  handler: async (ctx) => {
    const hoods = await ctx.db.query("neighborhoods").collect();
    const nodes = await ctx.db.query("graphNodes").collect();
    return hoods.map((hood) => ({
      id: hood._id,
      name: hood.name,
      description: hood.description,
      memberCount: nodes.filter((n) => n.neighborhoodId === hood._id).length,
    }));
  },
});

// ── Whole-graph snapshot pages (Next server in-memory traversal store) ──────
// graphEdges is ~40k rows; the web server pages through these once at boot
// and keeps an adjacency map in memory (Convex caps queries at 32k docs).

export const nodesPage = query({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db
      .query("graphNodes")
      .paginate({ cursor: cursor ?? null, numItems: 500 });
    const items = [];
    for (const node of page.page) {
      const artist = await ctx.db.get(node.artistId);
      if (!artist) continue;
      items.push({
        artistId: node.artistId,
        displayName: artist.displayName,
        imageUrl: artist.imageUrl,
        genres: artist.genres ?? [],
        spinCount: node.spinCount,
        stations: node.stations,
        neighborhoodId: node.neighborhoodId,
        bridgeScore: node.bridgeScore,
      });
    }
    return { items, continueCursor: page.isDone ? null : page.continueCursor };
  },
});

export const edgesPage = query({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db
      .query("graphEdges")
      .paginate({ cursor: cursor ?? null, numItems: 8000 });
    return {
      items: page.page.map((e) => ({
        from: e.fromArtistId,
        to: e.toArtistId,
        type: e.type,
        weight: e.weight,
      })),
      continueCursor: page.isDone ? null : page.continueCursor,
    };
  },
});

// All tracks, lite — the playlist generator picks one per recommended artist.
export const trackIndex = query({
  args: {},
  handler: async (ctx) => {
    const tracks = await ctx.db.query("tracks").collect();
    return tracks.map((t) => ({
      trackId: t._id,
      artistId: t.artistId,
      title: t.title,
      previewUrl: t.previewUrl,
    }));
  },
});
