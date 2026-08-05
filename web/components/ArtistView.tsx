"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { GraphExplorer } from "@/components/GraphExplorer";
import { PreviewButton } from "@/components/PreviewButton";
import { EDGE_COLORS, hoodColor } from "@/lib/palette";
import { STATION_LABELS, stationLabel } from "@/lib/stations";
import {
  formatDate,
  type ArtistPanel,
  type EgoNetwork,
  type Neighborhood,
} from "@/lib/types";

export function ArtistView({ artistId }: { artistId: string }) {
  const router = useRouter();
  const [station, setStation] = useState<string | null>(null);

  const panel = useQuery(anyApi.app.artistPanel, { artistId }) as
    | ArtistPanel
    | null
    | undefined;
  const ego = useQuery(anyApi.app.egoNetwork, {
    artistId,
    station: station ?? undefined,
  }) as EgoNetwork | undefined;
  const hoods = useQuery(anyApi.app.neighborhoodList) as
    | Neighborhood[]
    | undefined;

  const hoodIndexOf = useCallback(
    (neighborhoodId: string | undefined) => {
      if (!neighborhoodId || !hoods) return undefined;
      const i = hoods.findIndex((h) => h.id === neighborhoodId);
      return i === -1 ? undefined : i;
    },
    [hoods]
  );

  const hoodIndex = useMemo(
    () => hoodIndexOf(panel?.neighborhood?.id),
    [hoodIndexOf, panel]
  );

  if (panel === null) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center text-muted">
        Artist not found.
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 lg:flex-row">
      {/* ── Explorer ─────────────────────────────────────────────── */}
      <section className="order-1 flex min-h-[55vh] flex-1 flex-col overflow-hidden rounded-2xl border border-edge bg-surface lg:order-2 lg:min-h-0">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-edge px-3 py-2">
          <button
            onClick={() => setStation(null)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              station === null
                ? "bg-foreground text-background"
                : "bg-raised text-muted hover:text-foreground"
            }`}
          >
            All stations
          </button>
          {Object.entries(STATION_LABELS).map(([slug, label]) => (
            <button
              key={slug}
              onClick={() => setStation(station === slug ? null : slug)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                station === slug
                  ? "bg-foreground text-background"
                  : "bg-raised text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto hidden items-center gap-3 text-[11px] text-muted sm:flex">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-0.5 w-4 rounded"
                style={{ background: EDGE_COLORS.curation }}
              />
              co-play
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-0.5 w-4 rounded"
                style={{ background: EDGE_COLORS.canonical }}
              />
              MusicBrainz
            </span>
          </span>
        </div>
        <div className="relative flex-1">
          {ego === undefined ? (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Loading the neighborhood…
            </div>
          ) : ego.edges.length === 0 ? (
            <div className="flex h-full items-center justify-center px-8 text-center text-sm text-muted">
              No connections
              {station ? ` on ${stationLabel(station)}` : ""} — try another
              station.
            </div>
          ) : (
            <div className="absolute inset-0">
              <GraphExplorer
                data={ego}
                hoodIndexOf={hoodIndexOf}
                onNodeClick={(id) => {
                  if (id !== artistId) router.push(`/artist/${id}`);
                }}
              />
            </div>
          )}
          <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[11px] text-muted">
            tap an artist to re-center · pinch or scroll to zoom
          </p>
        </div>
      </section>

      {/* ── Artist panel ─────────────────────────────────────────── */}
      <aside className="order-2 w-full shrink-0 space-y-4 lg:order-1 lg:w-[340px]">
        <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
          {panel?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote artist art, no next/image domain config
            <img
              src={panel.imageUrl}
              alt={panel.displayName}
              className="aspect-square w-full object-cover"
            />
          )}
          <div className="space-y-3 p-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {panel?.displayName ?? "Loading…"}
              </h1>
              {panel?.neighborhood && (
                <span
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background: `${hoodColor(hoodIndex)}22`,
                    color: hoodColor(hoodIndex),
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: hoodColor(hoodIndex) }}
                  />
                  {panel.neighborhood.name}
                </span>
              )}
            </div>

            {panel && panel.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {panel.genres.slice(0, 6).map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-raised px-2.5 py-0.5 text-xs text-muted"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {panel && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-edge pt-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Spins on air</dt>
                  <dd className="font-semibold">{panel.spinCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Stations</dt>
                  <dd className="font-semibold">
                    {panel.stations.map(stationLabel).join(", ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">First aired</dt>
                  <dd>{formatDate(panel.firstAired)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Last aired</dt>
                  <dd>{formatDate(panel.lastAired)}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        {panel && panel.tracks.length > 0 && (
          <div className="rounded-2xl border border-edge bg-surface p-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              On rotation
            </h2>
            <ul className="mt-3 space-y-2.5">
              {panel.tracks.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  {t.previewUrl && <PreviewButton url={t.previewUrl} />}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.title}</p>
                    <p className="text-xs text-muted">
                      {t.releaseYear ?? ""}
                      {t.previewUrl ? " · 30s preview" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </main>
  );
}
