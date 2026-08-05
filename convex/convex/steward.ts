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
        topTitle: v.optional(v.string()),
        firstPlayedAt: v.optional(v.number()),
        lastPlayedAt: v.optional(v.number()),
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
          topTitle: item.topTitle,
          firstPlayedAt: item.firstPlayedAt,
          lastPlayedAt: item.lastPlayedAt,
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

// Chassis-era and API-failure deferrals get retried on the next session.
export const requeueDeferred = mutation({
  args: {},
  handler: async (ctx) => {
    const deferred = await ctx.db
      .query("workItems")
      .withIndex("by_status", (q) => q.eq("status", "deferred"))
      .collect();
    for (const item of deferred) {
      await ctx.db.patch(item._id, { status: "pending", updatedAt: Date.now() });
    }
    return { requeued: deferred.length };
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
      titleRaw: p.titleRaw,
      playedAt: p.playedAt,
      stationSlug: p.stationSlug,
      enrichmentStatus: p.enrichmentStatus,
    }));
  },
});

// Apply a resolution: upsert the artist by MBID, record field-level
// provenance, mark the work item resolved. One mutation per item so a killed
// session never loses or duplicates applied work.
export const applyResolution = mutation({
  args: {
    workItemId: v.id("workItems"),
    rawArtist: v.string(),
    mbid: v.string(),
    displayName: v.string(),
    method: v.string(), // "exact" | "fuzzy" | "llm"
    confidence: v.number(),
    evidence: v.string(),
    runId: v.id("stewardRuns"),
  },
  handler: async (ctx, args) => {
    const resolution = {
      method: args.method,
      confidence: args.confidence,
      evidence: args.evidence,
      runId: args.runId,
      resolvedAt: Date.now(),
    };
    const existing = await ctx.db
      .query("artists")
      .withIndex("by_mbid", (q) => q.eq("mbid", args.mbid))
      .unique();
    let artistId;
    if (existing) {
      artistId = existing._id;
      const rawNames = existing.rawNames.includes(args.rawArtist)
        ? existing.rawNames
        : [...existing.rawNames, args.rawArtist];
      await ctx.db.patch(existing._id, { rawNames, resolution });
    } else {
      artistId = await ctx.db.insert("artists", {
        mbid: args.mbid,
        displayName: args.displayName,
        rawNames: [args.rawArtist],
        resolution,
      });
    }
    const item = await ctx.db.get(args.workItemId);
    if (item) {
      await ctx.db.patch(args.workItemId, {
        status: "resolved",
        attempts: item.attempts + 1,
        lastRunId: args.runId,
        updatedAt: Date.now(),
      });
    }
    return artistId;
  },
});

// Low-confidence items land here for the human review page (MOO-463).
export const queueReview = mutation({
  args: {
    workItemId: v.id("workItems"),
    rawArtist: v.string(),
    candidates: v.array(
      v.object({
        mbid: v.string(),
        name: v.string(),
        evidence: v.string(),
        score: v.number(),
      })
    ),
    adjudicatorNote: v.optional(v.string()),
    runId: v.id("stewardRuns"),
  },
  handler: async (ctx, { workItemId, rawArtist, candidates, adjudicatorNote, runId }) => {
    await ctx.db.insert("reviewItems", {
      rawArtist,
      candidates,
      adjudicatorNote,
      status: "pending",
      runId,
    });
    const item = await ctx.db.get(workItemId);
    if (item) {
      await ctx.db.patch(workItemId, {
        status: "review",
        attempts: item.attempts + 1,
        lastRunId: runId,
        updatedAt: Date.now(),
      });
    }
  },
});

// Undo a wrong resolution: remove the artist row (and its tracks) and put the
// work item back in the queue. Used for hand-check corrections and by the
// review page's reject flow (MOO-463).
export const retractResolution = mutation({
  args: {
    artistId: v.id("artists"),
    workItemId: v.id("workItems"),
  },
  handler: async (ctx, { artistId, workItemId }) => {
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .collect();
    for (const track of tracks) await ctx.db.delete(track._id);
    await ctx.db.delete(artistId);
    await ctx.db.patch(workItemId, { status: "pending", updatedAt: Date.now() });
  },
});

// Enrichment operates on resolved artists that have no genres yet, so an
// interrupted enrich phase resumes cleanly from the database.
export const artistsNeedingEnrichment = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const all = await ctx.db.query("artists").collect();
    return all
      .filter((a) => a.resolution !== undefined && a.genres === undefined)
      .slice(0, limit ?? 50);
  },
});

export const enrichArtist = mutation({
  args: {
    artistId: v.id("artists"),
    genres: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    deezerId: v.optional(v.string()),
    discogsId: v.optional(v.string()),
    mbRelations: v.optional(
      v.array(
        v.object({
          type: v.string(),
          targetMbid: v.string(),
          targetName: v.string(),
        })
      )
    ),
    track: v.optional(
      v.object({
        title: v.string(),
        isrc: v.optional(v.string()),
        releaseYear: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { artistId, track, ...fields }) => {
    await ctx.db.patch(artistId, fields);
    if (track) {
      const existing = await ctx.db
        .query("tracks")
        .withIndex("by_artist", (q) => q.eq("artistId", artistId))
        .filter((q) => q.eq(q.field("title"), track.title))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          isrc: track.isrc,
          releaseYear: track.releaseYear,
        });
      } else {
        await ctx.db.insert("tracks", { ...track, artistId });
      }
    }
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
