// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generated playlists (M4). The Next server computes the traversal against
// its in-memory graph snapshot, then persists recipe + tracks here so every
// playlist has a stable URL that reloads identically.

const why = v.array(
  v.object({
    artistId: v.id("artists"),
    viaArtistId: v.optional(v.id("artists")),
    weight: v.optional(v.number()),
    type: v.optional(v.string()),
  })
);

export const create = mutation({
  args: {
    seedArtistIds: v.array(v.id("artists")),
    traversal: v.string(),
    trackIds: v.array(v.id("tracks")),
    why: v.optional(why),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("playlists", { ...args, createdAt: Date.now() });
  },
});

// Hydrated playlist for the /playlist/[id] page: tracks with artist context.
export const get = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, { playlistId }) => {
    const playlist = await ctx.db.get(playlistId);
    if (!playlist) return null;
    const seeds = [];
    for (const id of playlist.seedArtistIds) {
      const artist = await ctx.db.get(id);
      if (artist) seeds.push({ artistId: id, displayName: artist.displayName });
    }
    const tracks = [];
    for (const [i, trackId] of playlist.trackIds.entries()) {
      const track = await ctx.db.get(trackId);
      if (!track) continue;
      const artist = await ctx.db.get(track.artistId);
      const node = await ctx.db
        .query("graphNodes")
        .withIndex("by_artist", (q) => q.eq("artistId", track.artistId))
        .unique();
      const hood = node?.neighborhoodId
        ? await ctx.db.get(node.neighborhoodId)
        : null;
      const whyEntry = playlist.why?.[i] ?? null;
      let viaName: string | undefined;
      if (whyEntry?.viaArtistId) {
        const via = await ctx.db.get(whyEntry.viaArtistId);
        viaName = via?.displayName;
      }
      tracks.push({
        trackId,
        title: track.title,
        isrc: track.isrc,
        previewUrl: track.previewUrl,
        streamingLinks: track.streamingLinks ?? {},
        artistId: track.artistId,
        artistName: artist?.displayName ?? "?",
        artistImageUrl: artist?.imageUrl,
        neighborhood: hood
          ? { id: hood._id, name: hood.name }
          : null,
        why: whyEntry
          ? { viaArtistId: whyEntry.viaArtistId, viaName, weight: whyEntry.weight, type: whyEntry.type }
          : null,
      });
    }
    return {
      playlistId,
      traversal: playlist.traversal,
      createdAt: playlist.createdAt,
      seeds,
      tracks,
    };
  },
});
