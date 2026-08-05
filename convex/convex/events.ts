// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// See-them-live storage (M5, MOO-473). Full-resync model: the sync script
// clears and reinserts — the matched-events table is small (catalog artists
// with upcoming shows only).

const eventFields = {
  artistId: v.id("artists"),
  title: v.string(),
  venueName: v.string(),
  city: v.string(),
  region: v.optional(v.string()),
  startsAt: v.optional(v.number()),
  dateTbd: v.boolean(),
  status: v.string(),
  ticketUrl: v.optional(v.string()),
  source: v.string(),
  role: v.string(),
  externalId: v.string(),
};

export const clearEvents = mutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("artistEvents").collect();
    for (const row of rows) await ctx.db.delete(row._id);
    return rows.length;
  },
});

export const insertEvents = mutation({
  args: { items: v.array(v.object(eventFields)) },
  handler: async (ctx, { items }) => {
    for (const item of items) await ctx.db.insert("artistEvents", item);
    return items.length;
  },
});

// Upcoming (or date-TBD) shows for one artist, soonest first.
export const eventsFor = query({
  args: { artistId: v.id("artists") },
  handler: async (ctx, { artistId }) => {
    const rows = await ctx.db
      .query("artistEvents")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .collect();
    const now = Date.now();
    const upcoming = rows
      .filter((e) => e.dateTbd || (e.startsAt ?? 0) >= now)
      .sort((a, b) => (a.startsAt ?? Infinity) - (b.startsAt ?? Infinity));
    // The same show often arrives from both Ticketmaster and AXS — show it once.
    const seen = new Set<string>();
    return upcoming.filter((e) => {
      const day = e.startsAt ? Math.floor(e.startsAt / 86400000) : "tbd";
      const key = `${e.title.toLowerCase().slice(0, 20)}|${day}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
});

// Artist ids with an upcoming show — drives the "live soon" badge app-wide.
export const liveSoonIds = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("artistEvents").collect();
    const now = Date.now();
    const ids = new Set<string>();
    for (const e of rows) {
      if (e.dateTbd || (e.startsAt ?? 0) >= now) ids.add(e.artistId);
    }
    return [...ids];
  },
});

// Judge-mode source: the seeded sample events, joined to their raw artist
// names (real mode reads rm-playlist-v2's streaming export instead).
export const judgeSourceEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("sourceEvents").collect();
    const result = [];
    for (const event of events) {
      const performers = await ctx.db
        .query("sourceEventArtists")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();
      result.push({
        externalId: event._id,
        title: event.title,
        venueName: event.venueName,
        city: event.city,
        region: undefined as string | undefined,
        startsAt: event.startsAt,
        status: event.status,
        ticketUrl: event.ticketUrl,
        source: event.source,
        performers: performers.map((p) => ({
          artistNameRaw: p.artistNameRaw,
          role: p.role,
        })),
      });
    }
    return result;
  },
});
