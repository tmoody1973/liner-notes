import { internalMutation } from "./_generated/server";
import sampleData from "../sampleData.json";

// Judge-mode seed: wipes the source* mirror tables and fills them with an
// anonymized sample dataset — real artist names (so MusicBrainz resolution
// works in later milestones) but fully synthetic play history and events.
// Run with: npm run seed  (→ npx convex run seed:run)

const SOURCE_TABLES = [
  "sourcePlays",
  "sourceEventArtists",
  "sourceEvents",
  "sourceStations",
] as const;

// Deterministic PRNG so every seed run produces the same dataset.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fixed anchor so timestamps are stable across runs (2026-08-01T00:00:00Z).
const ANCHOR_MS = 1785542400000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PLAY_COUNT = 220;

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const table of SOURCE_TABLES) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) await ctx.db.delete(doc._id);
    }

    for (const station of sampleData.stations) {
      await ctx.db.insert("sourceStations", station);
    }

    const rand = mulberry32(414);
    const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
    const statuses = [
      ...Array(17).fill("pending"),
      "resolved",
      "unresolved",
      "ignored",
    ];

    for (let i = 0; i < PLAY_COUNT; i++) {
      const artist = pick(sampleData.artists);
      await ctx.db.insert("sourcePlays", {
        artistRaw: pick(artist.variants),
        titleRaw: pick(artist.tracks),
        playedAt: ANCHOR_MS - Math.floor(rand() * 30 * DAY_MS),
        stationSlug: pick(artist.stations),
        enrichmentStatus: pick(statuses),
      });
    }

    for (const event of sampleData.events) {
      const eventId = await ctx.db.insert("sourceEvents", {
        title: event.title,
        venueName: event.venueName,
        city: event.city,
        startsAt: ANCHOR_MS + event.daysOut * DAY_MS,
        status: event.status,
        ticketUrl: "ticketUrl" in event ? event.ticketUrl : undefined,
        source: event.source,
      });
      for (const performer of event.artists) {
        await ctx.db.insert("sourceEventArtists", {
          eventId,
          artistNameRaw: performer.name,
          role: performer.role,
        });
      }
    }

    const summary = {
      stations: sampleData.stations.length,
      plays: PLAY_COUNT,
      events: sampleData.events.length,
    };
    console.log("Seeded judge-mode sample data:", JSON.stringify(summary));
    return summary;
  },
});
