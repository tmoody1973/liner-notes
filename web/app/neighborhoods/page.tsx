"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GraphExplorer } from "@/components/GraphExplorer";
import { hoodColor } from "@/lib/palette";
import { STATION_LABELS } from "@/lib/stations";
import type { ArtistLite, EgoNetwork, Neighborhood } from "@/lib/types";

type MapData = {
  nodes: ArtistLite[];
  edges: { from: string; to: string; type: string; weight: number }[];
  bridges: Record<string, string[]>;
};

export default function NeighborhoodsPage() {
  const router = useRouter();
  const hoods = useQuery(anyApi.app.neighborhoodList) as
    | Neighborhood[]
    | undefined;
  const [map, setMap] = useState<MapData | null>(null);
  const [station, setStation] = useState<string | null>(null);
  const [busySeed, setBusySeed] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/map")
      .then((r) => r.json())
      .then(setMap);
  }, []);

  const hoodIndexOf = useCallback(
    (neighborhoodId: string | undefined) => {
      if (!neighborhoodId || !hoods) return undefined;
      const i = hoods.findIndex((h) => h.id === neighborhoodId);
      return i === -1 ? undefined : i;
    },
    [hoods]
  );

  // Station filter drops nodes the station never aired (and their edges).
  const view = useMemo((): EgoNetwork | null => {
    if (!map) return null;
    const nodes = station
      ? map.nodes.filter((n) => n.stations.includes(station))
      : map.nodes;
    const ids = new Set(nodes.map((n) => n.artistId));
    const edges = map.edges
      .filter((e) => ids.has(e.from) && ids.has(e.to))
      .map((e, i) => ({ id: String(i), ...e, receipt: {} }));
    return { focus: "", nodes, edges };
  }, [map, station]);

  // Label anchors only (top spins per district) until the listener zooms in.
  const labelIds = useMemo(() => {
    if (!map) return new Set<string>();
    const byHood = new Map<string, ArtistLite[]>();
    for (const n of map.nodes) {
      if (!n.neighborhoodId) continue;
      const list = byHood.get(n.neighborhoodId) ?? [];
      list.push(n);
      byHood.set(n.neighborhoodId, list);
    }
    const ids = new Set<string>();
    for (const list of byHood.values()) {
      for (const n of list.sort((a, b) => b.spinCount - a.spinCount).slice(0, 8)) {
        ids.add(n.artistId);
      }
    }
    return ids;
  }, [map]);

  const anchorsFor = useCallback(
    (hoodId: string) =>
      (map?.nodes ?? [])
        .filter((n) => n.neighborhoodId === hoodId)
        .sort((a, b) => b.spinCount - a.spinCount)
        .slice(0, 5),
    [map]
  );

  const startHere = async (seedArtistId: string, targetHood?: string) => {
    setBusySeed(seedArtistId + (targetHood ?? ""));
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedArtistId,
          targetNeighborhoodId: targetHood,
        }),
      });
      if (res.ok) {
        const { playlistId } = (await res.json()) as { playlistId: string };
        router.push(`/playlist/${playlistId}`);
        return;
      }
    } finally {
      setBusySeed(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16">
      <header className="pb-4 pt-8">
        <h1 className="text-3xl font-bold tracking-tight">
          The city map of the station&apos;s taste
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          With zero genre labels as input, the graph organized itself into
          these districts — and the steward agent named them like Milwaukee
          neighborhoods. Bridge artists ⚡ are the doorways between them.
        </p>
      </header>

      {/* ── Map ──────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-edge bg-surface">
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
          <span className="ml-auto flex flex-wrap items-center gap-2.5 text-[11px] text-muted">
            {(hoods ?? []).map((hood, i) => (
              <span key={hood.id} className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: hoodColor(i) }}
                />
                {hood.name}
              </span>
            ))}
          </span>
        </div>
        <div className="relative h-[60vh]">
          {view ? (
            <div className="absolute inset-0">
              <GraphExplorer
                data={view}
                hoodIndexOf={hoodIndexOf}
                onNodeClick={(id) => router.push(`/artist/${id}`)}
                trim={false}
                labelRule={(n, scale) => scale > 2.2 || labelIds.has(n.id)}
                warmupTicks={300}
                cooldownTicks={200}
                mapMode
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Drawing the city map…
            </div>
          )}
          <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[11px] text-muted">
            {map ? `${view?.nodes.length ?? 0} artists · strongest of ${map.edges.length} mapped connections` : ""} · zoom in for names · tap an artist to explore
          </p>
        </div>
      </section>

      {/* ── Neighborhood cards ───────────────────────────────────── */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(hoods ?? []).map((hood, i) => {
          const anchors = anchorsFor(hood.id);
          const seed = anchors[0];
          return (
            <article
              key={hood.id}
              className="flex flex-col rounded-2xl border border-edge bg-surface p-4"
              style={{ borderTopColor: hoodColor(i), borderTopWidth: 3 }}
            >
              <h2 className="font-bold leading-snug">{hood.name}</h2>
              <p className="mt-0.5 text-xs text-muted">
                {hood.memberCount} artists
              </p>
              {hood.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {hood.description}
                </p>
              )}
              <ul className="mt-3 space-y-1 text-sm">
                {anchors.map((a) => (
                  <li key={a.artistId} className="flex items-center gap-1.5">
                    <Link
                      href={`/artist/${a.artistId}`}
                      className="truncate hover:underline"
                    >
                      {a.displayName}
                    </Link>
                    {map?.bridges[a.artistId] && (
                      <span title="Bridge artist">⚡</span>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-muted">
                      {a.spinCount}
                    </span>
                  </li>
                ))}
              </ul>
              {seed && (
                <button
                  onClick={() => startHere(seed.artistId)}
                  disabled={busySeed !== null}
                  className="mt-auto pt-4 text-left text-sm font-semibold disabled:opacity-50"
                  style={{ color: hoodColor(i) }}
                >
                  {busySeed === seed.artistId
                    ? "Building playlist…"
                    : `▶ Start here — a ${hood.name} playlist`}
                </button>
              )}
            </article>
          );
        })}
      </section>

      {/* ── Bridge artists ───────────────────────────────────────── */}
      {map && hoods && Object.keys(map.bridges).length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            ⚡ Bridge artists — the doorways between districts
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(map.bridges)
              .map(([id, pair]) => ({
                node: map.nodes.find((n) => n.artistId === id),
                pair,
              }))
              .filter((b) => b.node)
              .sort((a, b) => (b.node!.bridgeScore ?? 0) - (a.node!.bridgeScore ?? 0))
              .map(({ node, pair }) => {
                const names = pair.map(
                  (hid) => hoods.find((h) => h.id === hid)?.name ?? "?"
                );
                const target = pair.find((hid) => hid !== node!.neighborhoodId);
                return (
                  <div
                    key={node!.artistId}
                    className="flex items-center gap-3 rounded-2xl border border-edge bg-surface p-3"
                  >
                    <Link
                      href={`/artist/${node!.artistId}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate font-semibold hover:underline">
                        {node!.displayName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        bridges {names[0]} ↔ {names[1]}
                      </p>
                    </Link>
                    <button
                      onClick={() => startHere(node!.artistId, target)}
                      disabled={busySeed !== null}
                      className="shrink-0 rounded-full bg-raised px-3 py-1.5 text-xs font-semibold transition hover:bg-(--hood-0) hover:text-background disabled:opacity-50"
                    >
                      {busySeed === node!.artistId + (target ?? "")
                        ? "Crossing…"
                        : "Cross the bridge →"}
                    </button>
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </main>
  );
}
