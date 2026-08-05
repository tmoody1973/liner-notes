// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Editorial edge extraction support (M5, MOO-472). The agent reads music
// journalism via Perplexity's cited API and lands typed artist connections
// as graphEdges rows with type "editorial" — quote + citation as receipt,
// never article text.

// Most-played catalog artists the extractor hasn't scanned yet.
export const worklist = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const nodes = await ctx.db.query("graphNodes").collect();
    nodes.sort((a, b) => b.spinCount - a.spinCount);
    const result = [];
    for (const node of nodes) {
      if (result.length >= (limit ?? 50)) break;
      const scanned = await ctx.db
        .query("editorialScans")
        .withIndex("by_artist", (q) => q.eq("artistId", node.artistId))
        .unique();
      if (scanned) continue;
      const artist = await ctx.db.get(node.artistId);
      if (!artist) continue;
      result.push({
        artistId: node.artistId,
        displayName: artist.displayName,
        spinCount: node.spinCount,
        genres: artist.genres ?? [],
      });
    }
    return result;
  },
});

// Insert an editorial edge unless the same pair + relation already exists.
export const upsertEdge = mutation({
  args: {
    fromArtistId: v.id("artists"),
    toArtistId: v.id("artists"),
    quote: v.string(),
    citationUrl: v.string(),
    relationType: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, { fromArtistId, toArtistId, ...receipt }) => {
    const existing = [
      ...(await ctx.db
        .query("graphEdges")
        .withIndex("by_from", (q) => q.eq("fromArtistId", fromArtistId))
        .filter((q) => q.eq(q.field("toArtistId"), toArtistId))
        .collect()),
      ...(await ctx.db
        .query("graphEdges")
        .withIndex("by_from", (q) => q.eq("fromArtistId", toArtistId))
        .filter((q) => q.eq(q.field("toArtistId"), fromArtistId))
        .collect()),
    ];
    const duplicate = existing.find(
      (e) => e.type === "editorial" && e.receipt.relationType === receipt.relationType
    );
    if (duplicate) return { inserted: false, edgeId: duplicate._id };
    const edgeId = await ctx.db.insert("graphEdges", {
      fromArtistId,
      toArtistId,
      type: "editorial",
      weight: 1,
      receipt,
    });
    return { inserted: true, edgeId };
  },
});

export const recordScan = mutation({
  args: {
    artistId: v.id("artists"),
    connectionsFound: v.number(),
    requests: v.number(),
    runId: v.optional(v.id("stewardRuns")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("editorialScans")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, checkedAt: Date.now() });
    } else {
      await ctx.db.insert("editorialScans", { ...args, checkedAt: Date.now() });
    }
  },
});

// Verification counts: editorial edges by relation type + scan progress.
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const scans = await ctx.db.query("editorialScans").collect();
    // Editorial edges are few (weight-1 inserts, not the 40k curation set),
    // but graphEdges is big — count via the scanned artists' indexed ranges.
    const byRelation: Record<string, number> = {};
    const seen = new Set<string>();
    let total = 0;
    for (const scan of scans) {
      for (const indexName of ["by_from", "by_to"] as const) {
        const field = indexName === "by_from" ? "fromArtistId" : "toArtistId";
        const edges = await ctx.db
          .query("graphEdges")
          .withIndex(indexName, (q) =>
            q.eq(field as "fromArtistId", scan.artistId)
          )
          .filter((q) => q.eq(q.field("type"), "editorial"))
          .collect();
        for (const e of edges) {
          if (seen.has(e._id)) continue;
          seen.add(e._id);
          total += 1;
          const rel = e.receipt.relationType ?? "?";
          byRelation[rel] = (byRelation[rel] ?? 0) + 1;
        }
      }
    }
    return {
      scannedArtists: scans.length,
      totalRequests: scans.reduce((s, x) => s + x.requests, 0),
      editorialEdges: total,
      byRelation,
    };
  },
});
