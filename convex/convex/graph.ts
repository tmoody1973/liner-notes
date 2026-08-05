// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Graph build storage (M3). Full-rebuild model per the PRD: the builder calls
// clearGraph, then chunked insert* mutations (Convex arg limits), so a build
// replaces the graph atomically enough for a demo-sized dataset.

const edgeReceipt = v.object({
  coPlayCount: v.optional(v.number()),
  stations: v.optional(v.array(v.string())),
  exampleShowDate: v.optional(v.number()),
  mbRelationType: v.optional(v.string()),
  quote: v.optional(v.string()),
  citationUrl: v.optional(v.string()),
  relationType: v.optional(v.string()),
  confidence: v.optional(v.number()),
});

// Everything the graph builder needs about the resolved catalog in one read.
export const catalogArtists = query({
  args: {},
  handler: async (ctx) => {
    const artists = await ctx.db.query("artists").collect();
    return artists
      .filter((a) => a.resolution !== undefined)
      .map((a) => ({
        _id: a._id,
        mbid: a.mbid,
        displayName: a.displayName,
        rawNames: a.rawNames,
        genres: a.genres ?? [],
        mbRelations: a.mbRelations ?? [],
      }));
  },
});

// Chunked: a full graph holds ~19k edges, well past Convex's 4096-reads-per-
// mutation limit — the client loops until done: true.
export const clearGraph = mutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const cap = limit ?? 1000;
    let deleted = 0;
    for (const table of ["graphEdges", "graphNodes", "neighborhoods"] as const) {
      const rows = await ctx.db.query(table).take(cap - deleted);
      for (const row of rows) {
        await ctx.db.delete(row._id);
        deleted += 1;
      }
      if (deleted >= cap) return { deleted, done: false };
    }
    return { deleted, done: true };
  },
});

export const insertNeighborhoods = mutation({
  args: {
    items: v.array(v.object({ name: v.string(), description: v.optional(v.string()) })),
  },
  handler: async (ctx, { items }) => {
    const ids = [];
    for (const item of items) ids.push(await ctx.db.insert("neighborhoods", item));
    return ids;
  },
});

export const insertNodes = mutation({
  args: {
    items: v.array(
      v.object({
        artistId: v.id("artists"),
        spinCount: v.number(),
        firstAired: v.optional(v.number()),
        lastAired: v.optional(v.number()),
        stations: v.array(v.string()),
        neighborhoodId: v.optional(v.id("neighborhoods")),
        bridgeScore: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { items }) => {
    for (const item of items) await ctx.db.insert("graphNodes", item);
    return items.length;
  },
});

export const insertEdges = mutation({
  args: {
    items: v.array(
      v.object({
        fromArtistId: v.id("artists"),
        toArtistId: v.id("artists"),
        type: v.string(),
        weight: v.number(),
        receipt: edgeReceipt,
      })
    ),
  },
  handler: async (ctx, { items }) => {
    for (const item of items) await ctx.db.insert("graphEdges", item);
    return items.length;
  },
});

// Edge lookup by artist pair (either orientation) — spot-check verification
// now, the M4 receipts panel later.
export const edgeBetween = query({
  args: { a: v.id("artists"), b: v.id("artists") },
  handler: async (ctx, { a, b }) => {
    const fromA = await ctx.db
      .query("graphEdges")
      .withIndex("by_from", (q) => q.eq("fromArtistId", a))
      .filter((q) => q.eq(q.field("toArtistId"), b))
      .collect();
    const fromB = await ctx.db
      .query("graphEdges")
      .withIndex("by_from", (q) => q.eq("fromArtistId", b))
      .filter((q) => q.eq(q.field("toArtistId"), a))
      .collect();
    return [...fromA, ...fromB];
  },
});

// Counts for build-summary verification (independent of the builder's math).
export const graphStats = query({
  args: {},
  handler: async (ctx) => {
    const nodes = await ctx.db.query("graphNodes").collect();
    const edges = await ctx.db.query("graphEdges").collect();
    const neighborhoods = await ctx.db.query("neighborhoods").collect();
    const edgesByType: Record<string, number> = {};
    for (const e of edges) edgesByType[e.type] = (edgesByType[e.type] ?? 0) + 1;
    return {
      nodes: nodes.length,
      edges: edges.length,
      edgesByType,
      neighborhoods: neighborhoods.length,
      nodesWithBridgeScore: nodes.filter((n) => n.bridgeScore !== undefined).length,
      nodesWithNeighborhood: nodes.filter((n) => n.neighborhoodId !== undefined).length,
    };
  },
});
