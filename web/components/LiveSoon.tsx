"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { formatDate } from "@/lib/types";

// "See them live" (M5): one shared reactive query drives the live-soon badge
// everywhere (Convex dedupes identical subscriptions across components).

export function useLiveSoonIds(): Set<string> {
  const ids = useQuery(anyApi.events.liveSoonIds) as string[] | undefined;
  return useMemo(() => new Set(ids ?? []), [ids]);
}

export function LiveSoonBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
      🎤 live soon
    </span>
  );
}

export type ArtistEvent = {
  _id: string;
  title: string;
  venueName: string;
  city: string;
  region?: string;
  startsAt?: number;
  dateTbd: boolean;
  status: string;
  ticketUrl?: string;
  source: string;
  role: string;
};

const STATUS_TONES: Record<string, string> = {
  "on sale": "bg-emerald-400/15 text-emerald-300",
  "sold out": "bg-red-400/15 text-red-300",
  "venue change": "bg-amber-400/15 text-amber-300",
};

// "On stage near Milwaukee" card for the artist page. Renders nothing when
// the artist has no upcoming shows (the no-card case is the honest default).
export function EventCard({ artistId }: { artistId: string }) {
  const events = useQuery(anyApi.events.eventsFor, { artistId }) as
    | ArtistEvent[]
    | undefined;
  if (!events || events.length === 0) return null;
  return (
    <div className="rounded-2xl border border-edge bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        🎤 On stage near Milwaukee
      </h2>
      <ul className="mt-3 space-y-3">
        {events.map((event) => (
          <li key={event._id} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">
                {event.dateTbd ? "Date TBD" : formatDate(event.startsAt)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  STATUS_TONES[event.status] ?? "bg-raised text-muted"
                }`}
              >
                {event.status}
              </span>
            </div>
            <p className="mt-0.5 text-muted">
              {event.venueName}
              {event.city && ` · ${event.city}`}
              {event.role === "support" && " · supporting"}
            </p>
            <p className="truncate text-xs text-muted">{event.title}</p>
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-medium underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                Tickets ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
