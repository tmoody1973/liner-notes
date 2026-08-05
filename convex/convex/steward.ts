import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Steward-session persistence: run records + the resumable work queue.
// The agent applies work one mutation per item, so a killed session never
// loses or duplicates applied work.

export const startRun = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.insert("stewardRuns", { startedAt: Date.now() });
  },
});

export const finishRun = mutation({
  args: {
    runId: v.id("stewardRuns"),
    counts: v.record(v.string(), v.number()),
    report: v.string(),
  },
  handler: async (ctx, { runId, counts, report }) => {
    await ctx.db.patch(runId, { finishedAt: Date.now(), counts, report });
  },
});

export const recentRuns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db.query("stewardRuns").order("desc").take(limit ?? 5);
  },
});

// Upsert by rawArtist: seeding twice never duplicates the queue.
// Returns how many items were newly created.
export const seedWorklist = mutation({
  args: {
    items: v.array(
      v.object({
        rawArtist: v.string(),
        playCount: v.number(),
        stationSlugs: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, { items }) => {
    let created = 0;
    for (const item of items) {
      const existing = await ctx.db
        .query("workItems")
        .withIndex("by_rawArtist", (q) => q.eq("rawArtist", item.rawArtist))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          playCount: item.playCount,
          stationSlugs: item.stationSlugs,
        });
      } else {
        await ctx.db.insert("workItems", {
          ...item,
          status: "pending",
          attempts: 0,
          updatedAt: Date.now(),
        });
        created += 1;
      }
    }
    return { created, seen: items.length };
  },
});

export const pendingItems = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("workItems")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit ?? 50);
  },
});

export const workItemCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("workItems").collect();
    const counts: Record<string, number> = {};
    for (const item of all) counts[item.status] = (counts[item.status] ?? 0) + 1;
    return { total: all.length, ...counts };
  },
});

// Judge mode reads sample plays from this deployment instead of rm-playlist-v2.
export const judgePlays = query({
  args: {},
  handler: async (ctx) => {
    const plays = await ctx.db.query("sourcePlays").take(5000);
    return plays.map((p) => ({
      artistRaw: p.artistRaw,
      stationSlug: p.stationSlug,
      enrichmentStatus: p.enrichmentStatus,
    }));
  },
});

export const markItem = mutation({
  args: {
    id: v.id("workItems"),
    status: v.string(),
    runId: v.id("stewardRuns"),
  },
  handler: async (ctx, { id, status, runId }) => {
    const item = await ctx.db.get(id);
    if (!item) return;
    await ctx.db.patch(id, {
      status,
      attempts: item.attempts + 1,
      lastRunId: runId,
      updatedAt: Date.now(),
    });
  },
});
