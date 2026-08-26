"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useMemo } from "react";
import { SearchBox } from "@/components/SearchBox";
import { LiveSoonBadge, useLiveSoonIds } from "@/components/LiveSoon";
import { EDGE_COLORS, hoodColor } from "@/lib/palette";
import { stationLabel } from "@/lib/stations";
import type { ArtistLite, Neighborhood } from "@/lib/types";

type NewArtist = {
  artistId: string;
  displayName: string;
  imageUrl?: string;
  genres: string[];
  resolvedAt: number;
  stations: string[];
  playCount: number;
};

export default function Home() {
  const index = useQuery(anyApi.app.artistIndex) as ArtistLite[] | undefined;
  const hoods = useQuery(anyApi.app.neighborhoodList) as
    | Neighborhood[]
    | undefined;
  const fresh = useQuery(anyApi.app.newThisWeek, {}) as NewArtist[] | undefined;
  const liveSoon = useLiveSoonIds();

  const featured = useMemo(
    () =>
      [...(index ?? [])]
        .sort((a, b) => b.spinCount - a.spinCount)
        .slice(0, 12),
    [index]
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl pb-10 pt-12 text-center sm:pt-20">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          The station&apos;s musical brain,
          <br />
          <span style={{ color: "var(--hood-0)" }}>made explorable.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted">
          {index
            ? `${index.length} artists, linked by what four Radio Milwaukee stations actually played on air.`
            : "Artists linked by what four Radio Milwaukee stations actually played on air."}{" "}
          Search someone you love and follow the lines.
        </p>
        <div className="mt-8">
          <SearchBox autoFocus />
        </div>

        {/* How connections work — the one concept a first-time visitor needs. */}
        <div className="mx-auto mt-6 max-w-lg text-left text-sm text-muted">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em]">
            Every line between two artists is earned
          </p>
          <ul className="mt-3 space-y-1.5">
            <li className="flex items-center gap-2.5">
              <span
                className="inline-block h-0.5 w-5 shrink-0 rounded"
                style={{ background: EDGE_COLORS.curation }}
              />
              A DJ played them back-to-back on air — again and again
            </li>
            <li className="flex items-center gap-2.5">
              <span
                className="inline-block h-0.5 w-5 shrink-0 rounded"
                style={{ background: EDGE_COLORS.canonical }}
              />
              Real-world credits — bandmates, collaborators, remixes
            </li>
            <li className="flex items-center gap-2.5">
              <span
                className="inline-block h-0.5 w-5 shrink-0 rounded"
                style={{ background: EDGE_COLORS.editorial }}
              />
              Music journalism — a quote from a cited review or interview
            </li>
          </ul>
          <p className="mt-3 text-center text-xs">
            Tap any line to see its receipt: what connects them, and how we
            know.
          </p>
        </div>
      </section>

      {/* ── New on air this week — the nightly loop's visible pulse ── */}
      {fresh && fresh.length > 0 && (
        <section className="pb-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              New on air this week
            </h2>
            <span className="text-xs text-muted">
              added nightly from the stations&apos; airwaves
            </span>
          </div>
          <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {fresh.map((a) => (
              <Link
                key={a.artistId}
                href={`/artist/${a.artistId}`}
                className="group w-36 shrink-0 snap-start overflow-hidden rounded-2xl border border-edge bg-surface transition hover:border-[color:var(--muted)]"
              >
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote artist art, no next/image domain config
                  <img
                    src={a.imageUrl}
                    alt={a.displayName}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-raised text-2xl font-bold text-muted">
                    {a.displayName.slice(0, 1)}
                  </div>
                )}
                <div className="p-2.5">
                  <p className="truncate text-sm font-medium">{a.displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {a.playCount} spins · {a.stations.map(stationLabel).join(", ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Neighborhoods strip ──────────────────────────────────── */}
      {hoods && hoods.length > 0 && (
        <section className="pb-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Musical neighborhoods
            </h2>
            <Link
              href="/neighborhoods"
              className="text-xs text-muted underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              See the map →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {hoods.map((hood, i) => (
              <Link
                key={hood.id}
                href="/neighborhoods"
                className="group rounded-2xl border border-edge bg-surface p-4 transition hover:border-[color:var(--muted)]"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: hoodColor(i) }}
                />
                <p className="mt-2 font-semibold leading-snug">{hood.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {hood.memberCount} artists
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured / most played ───────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Most played on air
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((a) => (
            <Link
              key={a.artistId}
              href={`/artist/${a.artistId}`}
              className="group overflow-hidden rounded-2xl border border-edge bg-surface transition hover:border-[color:var(--muted)]"
            >
              {a.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote artist art, no next/image domain config
                <img
                  src={a.imageUrl}
                  alt={a.displayName}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-raised text-3xl font-bold text-muted">
                  {a.displayName.slice(0, 1)}
                </div>
              )}
              <div className="p-3">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  <span className="truncate">{a.displayName}</span>
                  <LiveSoonBadge show={liveSoon.has(a.artistId)} />
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {a.spinCount} spins ·{" "}
                  {a.stations.map(stationLabel).join(", ")}
                </p>
              </div>
            </Link>
          ))}
          {index === undefined &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-2xl border border-edge bg-surface"
              />
            ))}
        </div>
      </section>
    </main>
  );
}
