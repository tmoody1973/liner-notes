"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { HopReceipt } from "@/components/HopReceipt";
import type { ArtistLite } from "@/lib/types";

type PathArtist = {
  artistId: string;
  displayName: string;
  imageUrl?: string;
  genres: string[];
  spinCount: number;
};
type Hop = { from: string; to: string; weight: number; type: string };
type PathResult = {
  path: PathArtist[] | null;
  hops?: Hop[];
  flow?: { value: number; atLeast: boolean };
};
type IntersectionResult = {
  artists: (PathArtist & { strength: number })[];
};

export default function PathfinderPage() {
  const router = useRouter();
  const [picks, setPicks] = useState<ArtistLite[]>([]);
  const [result, setResult] = useState<PathResult | null>(null);
  const [crossroads, setCrossroads] = useState<IntersectionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (artists: ArtistLite[]) => {
    setBusy(true);
    setError(null);
    setResult(null);
    setCrossroads(null);
    try {
      if (artists.length === 2) {
        const res = await fetch(
          `/api/path?from=${artists[0].artistId}&to=${artists[1].artistId}`
        );
        if (!res.ok) throw new Error((await res.json()).error ?? "failed");
        setResult((await res.json()) as PathResult);
      } else if (artists.length > 2) {
        const res = await fetch(
          `/api/intersection?ids=${artists.map((a) => a.artistId).join(",")}`
        );
        if (!res.ok) throw new Error((await res.json()).error ?? "failed");
        setCrossroads((await res.json()) as IntersectionResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const addPick = (artist: ArtistLite) => {
    if (picks.some((p) => p.artistId === artist.artistId)) return;
    const next = [...picks, artist];
    setPicks(next);
    void run(next);
  };

  const removePick = (artistId: string) => {
    const next = picks.filter((p) => p.artistId !== artistId);
    setPicks(next);
    setResult(null);
    setCrossroads(null);
    if (next.length >= 2) void run(next);
  };

  const makePlaylist = async (seedArtistId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedArtistId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed");
      const { playlistId } = (await res.json()) as { playlistId: string };
      router.push(`/playlist/${playlistId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playlist failed");
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16">
      <header className="pb-6 pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Pathfinder</h1>
        <p className="mt-2 text-muted">
          Pick two artists to walk the influence path between them — or add a
          third to find the artists at the crossroads of all their networks.
        </p>
      </header>

      <SearchBox
        placeholder={
          picks.length === 0
            ? "Start with any artist…"
            : picks.length === 1
              ? "…and a second artist"
              : "Add another for crossroads mode"
        }
        onPick={addPick}
      />

      {picks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {picks.map((p) => (
            <button
              key={p.artistId}
              onClick={() => removePick(p.artistId)}
              className="group flex items-center gap-1.5 rounded-full bg-raised px-3 py-1.5 text-sm"
            >
              {p.displayName}
              <span className="text-muted transition group-hover:text-foreground">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {busy && <p className="mt-8 text-center text-muted">Walking the graph…</p>}
      {error && <p className="mt-8 text-center text-red-400">{error}</p>}

      {/* ── Path result ──────────────────────────────────────────── */}
      {result &&
        (result.path === null ? (
          <p className="mt-8 text-center text-muted">
            No path — these artists live in disconnected corners of the dial.
          </p>
        ) : (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {result.path.length - 1} hops
              </h2>
              {result.flow && (
                <span className="text-xs text-muted">
                  influence flow {result.flow.atLeast ? "≥" : ""}
                  {result.flow.value} co-plays
                </span>
              )}
            </div>
            <ol className="mt-3 space-y-0">
              {result.path.map((artist, i) => (
                <li key={artist.artistId}>
                  <button
                    onClick={() => router.push(`/artist/${artist.artistId}`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-edge bg-surface p-3 text-left transition hover:border-[color:var(--muted)]"
                  >
                    {artist.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote artist art
                      <img
                        src={artist.imageUrl}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-raised font-bold text-muted">
                        {artist.displayName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {artist.displayName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {artist.genres.join(" · ") || `${artist.spinCount} spins`}
                      </p>
                    </div>
                  </button>
                  {i < (result.hops?.length ?? 0) && (
                    <HopReceipt hop={result.hops![i]} />
                  )}
                </li>
              ))}
            </ol>
            <button
              onClick={() => makePlaylist(picks[0].artistId)}
              disabled={busy}
              className="mt-6 w-full rounded-2xl bg-(--hood-0) py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-50"
            >
              Generate a playlist from {picks[0]?.displayName}
            </button>
          </section>
        ))}

      {/* ── Crossroads result ───────────────────────────────────── */}
      {crossroads && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            At the crossroads of {picks.map((p) => p.displayName).join(" + ")}
          </h2>
          {crossroads.artists.length === 0 ? (
            <p className="mt-4 text-muted">
              No shared neighbors found — these networks don&apos;t meet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {crossroads.artists.map((artist) => (
                <li key={artist.artistId}>
                  <button
                    onClick={() => router.push(`/artist/${artist.artistId}`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-edge bg-surface p-3 text-left transition hover:border-[color:var(--muted)]"
                  >
                    {artist.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote artist art
                      <img
                        src={artist.imageUrl}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-raised font-bold text-muted">
                        {artist.displayName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {artist.displayName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {artist.genres.join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {artist.strength} shared co-plays
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
