// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { loadEnv, requireEnv } from "./env.js";
import { say } from "./narrate.js";
import { politeFetchJson } from "./polite.js";
import { normalizeRaw } from "./resolve.js";
import { detectMode } from "./source.js";

// See-them-live sync (M5, MOO-473): read the source platform's existing
// Ticketmaster/AXS events (read-only — zero new APIs), keep upcoming shows,
// drop cancelled/rescheduled, match performers to catalog artists by
// normalized name, and land matches in liner-notes artistEvents.
// Full resync per run; safe to re-run anytime.

const STATUS_LABELS: Record<string, string> = {
  buyTickets: "on sale",
  soldOut: "sold out",
  venueChange: "venue change",
};
const DROP_STATUSES = new Set(["cancelled", "rescheduled"]); // the AC's "cancelled/postponed"

interface SourceEvent {
  externalId: string;
  title: string;
  venueName: string;
  city: string;
  region?: string;
  startsAt?: number;
  status: string;
  ticketUrl?: string;
  source: string;
}

interface Performer {
  artistNameRaw: string;
  role: string;
}

async function readRealEvents(): Promise<{
  events: Map<string, SourceEvent>;
  performersByEvent: Map<string, Performer[]>;
}> {
  const base = requireEnv("CONVEX_SOURCE_URL").replace(/\/$/, "");
  const headers = { Authorization: `Convex ${requireEnv("CONVEX_SOURCE_DEPLOY_KEY")}` };

  const page = async <T>(table: string, cursor?: string) => {
    const params = new URLSearchParams({ tableName: table });
    if (cursor) params.set("cursor", cursor);
    return politeFetchJson<{ values: T[]; cursor?: string; hasMore: boolean }>(
      `${base}/api/list_snapshot?${params}`,
      { headers }
    );
  };

  const events = new Map<string, SourceEvent>();
  let cursor: string | undefined;
  for (let i = 0; i < 40; i++) {
    const snap = await page<{
      _id: string;
      title?: string;
      venueName?: string;
      city?: string;
      region?: string;
      startsAt?: number;
      status?: string;
      ticketUrl?: string;
      source?: string;
    }>("events", cursor);
    for (const e of snap.values) {
      if (!e.title || !e.venueName) continue;
      events.set(e._id, {
        externalId: e._id,
        title: e.title,
        venueName: e.venueName,
        city: e.city ?? "",
        region: e.region,
        startsAt: e.startsAt,
        status: e.status ?? "buyTickets",
        ticketUrl: e.ticketUrl,
        source: e.source ?? "ticketmaster",
      });
    }
    if (!snap.hasMore) break;
    cursor = snap.cursor;
  }

  const performersByEvent = new Map<string, Performer[]>();
  cursor = undefined;
  for (let i = 0; i < 40; i++) {
    type PerformerRow = { eventId?: string; artistNameRaw?: string; role?: string };
    const snap: { values: PerformerRow[]; cursor?: string; hasMore: boolean } =
      await page<PerformerRow>("eventArtists", cursor);
    for (const p of snap.values) {
      if (!p.eventId || !p.artistNameRaw) continue;
      const list = performersByEvent.get(p.eventId) ?? [];
      list.push({ artistNameRaw: p.artistNameRaw, role: p.role ?? "headliner" });
      performersByEvent.set(p.eventId, list);
    }
    if (!snap.hasMore) break;
    cursor = snap.cursor;
  }
  return { events, performersByEvent };
}

async function main() {
  loadEnv();
  const mode = detectMode(process.argv.find((a) => a === "--mode=judge") ? "judge" : undefined);
  const client = new ConvexHttpClient(requireEnv("CONVEX_URL"));
  say(`event sync — source mode: ${mode}`);

  // Catalog match table (same normalization the resolver uses).
  const catalog = (await client.query(anyApi.graph.catalogArtists, {})) as {
    _id: string;
    displayName: string;
    rawNames: string[];
  }[];
  const byNorm = new Map<string, string>();
  for (const artist of catalog) {
    for (const name of [artist.displayName, ...artist.rawNames]) {
      byNorm.set(normalizeRaw(name), artist._id);
    }
  }

  let events: Map<string, SourceEvent>;
  let performersByEvent: Map<string, Performer[]>;
  if (mode === "real") {
    ({ events, performersByEvent } = await readRealEvents());
  } else {
    const judge = (await client.query(anyApi.events.judgeSourceEvents, {})) as (SourceEvent & {
      performers: Performer[];
    })[];
    events = new Map(judge.map((e) => [e.externalId, e]));
    performersByEvent = new Map(judge.map((e) => [e.externalId, e.performers]));
  }
  say(`source: ${events.size} events, ${performersByEvent.size} with performer joins`);

  const now = Date.now();
  const items = [];
  let dropped = { status: 0, past: 0, unmatched: 0 };
  for (const [eventId, event] of events) {
    if (DROP_STATUSES.has(event.status)) {
      dropped.status += 1;
      continue;
    }
    const dateTbd = event.startsAt === undefined;
    if (!dateTbd && event.startsAt! < now) {
      dropped.past += 1;
      continue;
    }
    for (const performer of performersByEvent.get(eventId) ?? []) {
      const artistId = byNorm.get(normalizeRaw(performer.artistNameRaw));
      if (!artistId) {
        dropped.unmatched += 1;
        continue;
      }
      items.push({
        artistId,
        title: event.title,
        venueName: event.venueName,
        city: event.city,
        region: event.region,
        startsAt: event.startsAt,
        dateTbd,
        status: STATUS_LABELS[event.status] ?? event.status,
        ticketUrl: event.ticketUrl,
        source: event.source,
        role: performer.role,
        externalId: event.externalId,
      });
    }
  }

  const cleared = (await client.mutation(anyApi.events.clearEvents, {})) as number;
  for (let i = 0; i < items.length; i += 200) {
    await client.mutation(anyApi.events.insertEvents, { items: items.slice(i, i + 200) });
  }
  const artists = new Set(items.map((i) => i.artistId)).size;
  say(
    `synced ${items.length} artist-event rows (${artists} catalog artists with upcoming shows); ` +
      `replaced ${cleared} previous rows. Dropped: ${dropped.status} cancelled/rescheduled, ` +
      `${dropped.past} past, ${dropped.unmatched} performers not in catalog.`
  );
}

main().catch((err) => {
  console.error("event sync failed:", err);
  process.exit(1);
});
