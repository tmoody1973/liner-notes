import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Liner Notes deployment schema (per PRD data model).
// Source layer (rm-playlist-v2) is never modified; the source* tables below
// exist only for judge mode, where an anonymized sample dataset stands in
// for the private production data.

const resolution = v.object({
  method: v.string(), // "exact" | "fuzzy" | "llm" | "human"
  confidence: v.number(), // 0..1
  evidence: v.string(),
  runId: v.optional(v.id("stewardRuns")),
  resolvedAt: v.optional(v.number()), // ms epoch
});

const edgeReceipt = v.object({
  // curation: co-play evidence
  coPlayCount: v.optional(v.number()),
  stations: v.optional(v.array(v.string())),
  exampleShowDate: v.optional(v.number()),
  // canonical: MusicBrainz relationship
  mbRelationType: v.optional(v.string()),
  // editorial: journalism quote (milestone 5)
  quote: v.optional(v.string()),
  citationUrl: v.optional(v.string()),
  relationType: v.optional(v.string()),
  confidence: v.optional(v.number()),
});

export default defineSchema({
  // ── Source mirror (judge mode only) ──────────────────────────────────
  sourceStations: defineTable({
    name: v.string(),
    slug: v.string(),
    tagline: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  sourcePlays: defineTable({
    artistRaw: v.string(),
    titleRaw: v.string(),
    playedAt: v.number(), // ms epoch
    stationSlug: v.string(),
    enrichmentStatus: v.string(), // "pending" | "resolved" | "unresolved" | "ignored"
  })
    .index("by_station", ["stationSlug"])
    .index("by_status", ["enrichmentStatus"]),

  sourceEvents: defineTable({
    title: v.string(),
    venueName: v.string(),
    city: v.string(),
    startsAt: v.optional(v.number()),
    status: v.string(),
    ticketUrl: v.optional(v.string()),
    source: v.string(), // "ticketmaster" | "axs"
  }),

  sourceEventArtists: defineTable({
    eventId: v.id("sourceEvents"),
    artistNameRaw: v.string(),
    role: v.string(), // "headliner" | "support"
  }).index("by_event", ["eventId"]),

  // ── Resolved catalog ─────────────────────────────────────────────────
  artists: defineTable({
    mbid: v.optional(v.string()),
    displayName: v.string(),
    rawNames: v.array(v.string()),
    genres: v.optional(v.array(v.string())),
    discogsId: v.optional(v.string()),
    deezerId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    resolution: v.optional(resolution),
    // MusicBrainz artist-artist relationships, kept for M3's canonical edges.
    mbRelations: v.optional(
      v.array(
        v.object({
          type: v.string(),
          targetMbid: v.string(),
          targetName: v.string(),
        })
      )
    ),
  })
    .index("by_mbid", ["mbid"])
    .index("by_displayName", ["displayName"]),

  tracks: defineTable({
    title: v.string(),
    artistId: v.id("artists"),
    isrc: v.optional(v.string()),
    releaseYear: v.optional(v.number()),
    previewUrl: v.optional(v.string()),
    streamingLinks: v.optional(v.record(v.string(), v.string())),
  })
    .index("by_artist", ["artistId"])
    .index("by_isrc", ["isrc"]),

  // ── Steward records ──────────────────────────────────────────────────
  reviewItems: defineTable({
    rawArtist: v.string(),
    candidates: v.array(
      v.object({
        mbid: v.string(),
        name: v.string(),
        evidence: v.string(),
        score: v.number(),
      })
    ),
    status: v.string(), // "pending" | "approved" | "rejected"
    approvedMbid: v.optional(v.string()),
    adjudicatorNote: v.optional(v.string()), // Claude's reasoning when it routed here
    runId: v.optional(v.id("stewardRuns")),
  }).index("by_status", ["status"]),

  stewardRuns: defineTable({
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    counts: v.optional(v.record(v.string(), v.number())),
    report: v.optional(v.string()),
  }),

  // The agent's resumable work queue: one row per distinct raw artist string.
  workItems: defineTable({
    rawArtist: v.string(),
    playCount: v.number(),
    stationSlugs: v.array(v.string()),
    topTitle: v.optional(v.string()), // most-played raw title for this artist
    firstPlayedAt: v.optional(v.number()), // ms epoch, era signal for scoring
    lastPlayedAt: v.optional(v.number()),
    status: v.string(), // "pending" | "deferred" | "resolved" | "review" | "ignored"
    attempts: v.number(),
    lastRunId: v.optional(v.id("stewardRuns")),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_rawArtist", ["rawArtist"]),

  // ── Influence graph ──────────────────────────────────────────────────
  graphNodes: defineTable({
    artistId: v.id("artists"),
    spinCount: v.number(),
    firstAired: v.optional(v.number()),
    lastAired: v.optional(v.number()),
    stations: v.array(v.string()),
    neighborhoodId: v.optional(v.id("neighborhoods")),
    bridgeScore: v.optional(v.number()),
  }).index("by_artist", ["artistId"]),

  graphEdges: defineTable({
    fromArtistId: v.id("artists"),
    toArtistId: v.id("artists"),
    type: v.string(), // "curation" | "canonical" | "editorial"
    weight: v.number(),
    receipt: edgeReceipt,
  })
    .index("by_from", ["fromArtistId"])
    .index("by_to", ["toArtistId"]),

  neighborhoods: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  }),

  // ── Listener product ─────────────────────────────────────────────────
  playlists: defineTable({
    seedArtistIds: v.array(v.id("artists")),
    traversal: v.string(),
    trackIds: v.array(v.id("tracks")),
    createdAt: v.number(),
  }),
});
