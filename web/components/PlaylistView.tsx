"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PreviewButton } from "@/components/PreviewButton";
import { previewSrc } from "@/lib/preview";
import { LiveSoonBadge, useLiveSoonIds } from "@/components/LiveSoon";
import { StreamingButtons } from "@/components/StreamingButtons";

type PlaylistTrack = {
  trackId: string;
  title: string;
  isrc?: string;
  previewUrl?: string;
  streamingLinks: Record<string, string>;
  artistId: string;
  artistName: string;
  artistImageUrl?: string;
  neighborhood: { id: string; name: string } | null;
  why: {
    viaArtistId?: string;
    viaName?: string;
    weight?: number;
    type?: string;
  } | null;
};

type Playlist = {
  playlistId: string;
  traversal: string;
  createdAt: number;
  seeds: { artistId: string; displayName: string }[];
  tracks: PlaylistTrack[];
};

const TRAVERSAL_LABELS: Record<string, string> = {
  "coherent-kbfs": "coherence-filtered walk",
  "cross-bridge-kbfs": "cross-the-bridge walk",
};

export function PlaylistView({ playlistId }: { playlistId: string }) {
  const router = useRouter();
  const playlist = useQuery(anyApi.playlists.get, { playlistId }) as
    | Playlist
    | null
    | undefined;
  const [busy, setBusy] = useState(false);
  const liveSoon = useLiveSoonIds();

  const regenerate = async () => {
    if (!playlist?.seeds[0]) return;
    setBusy(true);
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedArtistId: playlist.seeds[0].artistId }),
      });
      if (res.ok) {
        const { playlistId: next } = (await res.json()) as {
          playlistId: string;
        };
        router.push(`/playlist/${next}`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (playlist === null) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center text-muted">
        Playlist not found.
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16">
      <header className="pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Generated playlist ·{" "}
          {playlist ? (TRAVERSAL_LABELS[playlist.traversal] ?? playlist.traversal) : "…"}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {playlist ? (
            <>
              Starting from{" "}
              {playlist.seeds.map((s, i) => (
                <span key={s.artistId}>
                  {i > 0 && " + "}
                  <Link
                    href={`/artist/${s.artistId}`}
                    className="underline decoration-dotted underline-offset-4"
                  >
                    {s.displayName}
                  </Link>
                </span>
              ))}
            </>
          ) : (
            "Loading…"
          )}
        </h1>
        {playlist && (
          <p className="mt-2 text-sm text-muted">
            {playlist.tracks.length} tracks, one per artist on the walk — every
            track carries the hop that put it here. This URL is stable; share
            it and it replays identically.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={regenerate}
            disabled={busy || !playlist}
            className="rounded-full bg-(--hood-0) px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Walking again…" : "↻ Regenerate (new walk, same seed)"}
          </button>
        </div>
      </header>

      <ol className="space-y-2.5">
        {(playlist?.tracks ?? []).map((track, i) => (
          <li
            key={track.trackId}
            className="rounded-2xl border border-edge bg-surface p-3"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-right font-mono text-xs text-muted">
                {i + 1}
              </span>
              {track.artistImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote artist art
                <img
                  src={track.artistImageUrl}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-raised font-bold text-muted">
                  {track.artistName.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{track.title}</p>
                <p className="truncate text-sm text-muted">
                  <Link
                    href={`/artist/${track.artistId}`}
                    className="hover:underline"
                  >
                    {track.artistName}
                  </Link>
                  {track.neighborhood && <> · {track.neighborhood.name}</>}{" "}
                  <LiveSoonBadge show={liveSoon.has(track.artistId)} />
                </p>
              </div>
              {previewSrc(track.previewUrl, track.streamingLinks) && (
                <PreviewButton url={previewSrc(track.previewUrl, track.streamingLinks)!} />
              )}
            </div>
            <div className="mt-2 border-t border-edge pt-2">
              <StreamingButtons
                links={track.streamingLinks}
                artistName={track.artistName}
                title={track.title}
                compact
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {track.why?.viaName ? (
                <>
                  Why this track: reached via{" "}
                  <span className="text-foreground">{track.why.viaName}</span>
                  {track.why.weight !== undefined && (
                    <>
                      {" "}
                      — {track.why.type === "canonical"
                        ? "MusicBrainz relation"
                        : `co-played ${track.why.weight}× on air`}
                    </>
                  )}
                </>
              ) : (
                <>Why this track: the seed artist — where the walk began.</>
              )}
            </p>
          </li>
        ))}
      </ol>

      {/* ── Take it with you ───────────────────────────────────────── */}
      {playlist && playlist.tracks.length > 0 && (
        <section className="mt-10 rounded-2xl border border-edge bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Take it with you
          </h2>
          <p className="mt-1 text-sm text-muted">
            Every track, on your service. Buttons marked ⌕ open a search there
            instead of a direct link.
          </p>
          <ul className="mt-4 space-y-3">
            {playlist.tracks.map((track) => (
              <li
                key={track.trackId}
                className="flex flex-col gap-1.5 border-t border-edge pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 truncate text-sm">
                  <span className="font-medium">{track.title}</span>{" "}
                  <span className="text-muted">— {track.artistName}</span>
                </span>
                <StreamingButtons
                  links={track.streamingLinks}
                  artistName={track.artistName}
                  title={track.title}
                  compact
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
