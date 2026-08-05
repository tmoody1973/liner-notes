"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

// Steward review queue: low-confidence matches wait here for a human call.
// Approve applies the resolution with "human" provenance; reject excludes the
// raw string from future steward worklists. anyApi keeps this page decoupled
// from convex codegen across workspaces (same pattern as agent/src/convex.ts).

type ReviewItem = {
  _id: string;
  rawArtist: string;
  candidates: { mbid: string; name: string; evidence: string; score: number }[];
  adjudicatorNote?: string;
  playCount: number;
  stationSlugs: string[];
  topTitle?: string;
};

const STATION_LABELS: Record<string, string> = {
  "88nine": "88Nine",
  hyfin: "HYFIN",
  "414music": "414 Music",
  rhythmlab: "Rhythm Lab",
};

export default function ReviewPage() {
  const items = useQuery(anyApi.steward.pendingReviews) as ReviewItem[] | undefined;
  const approve = useMutation(anyApi.steward.approveReview);
  const reject = useMutation(anyApi.steward.rejectReview);
  // Ids with an in-flight mutation: disables the card's buttons until the
  // reactive query removes it from the list.
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy((prev) => new Set(prev).add(id));
    try {
      await fn();
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Review queue</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {items === undefined
            ? "Loading…"
            : `${items.length} low-confidence ${items.length === 1 ? "match waits" : "matches wait"} for your call. Approve applies with human provenance; reject drops the string from future steward sessions.`}
        </p>
      </header>

      {items !== undefined && items.length === 0 && (
        <div className="rounded-xl border border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Queue is empty — the steward has nothing waiting on you. 🎉
        </div>
      )}

      <ul className="space-y-4">
        {(items ?? []).map((item) => {
          const disabled = busy.has(item._id);
          return (
            <li
              key={item._id}
              className="rounded-xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold break-words">
                  “{item.rawArtist}”
                </h2>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.playCount} {item.playCount === 1 ? "play" : "plays"}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap gap-1.5">
                {item.stationSlugs.map((slug) => (
                  <span
                    key={slug}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {STATION_LABELS[slug] ?? slug}
                  </span>
                ))}
              </div>

              {item.topTitle && (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  airs as: <span className="italic">“{item.topTitle}”</span>
                </p>
              )}

              {item.adjudicatorNote && (
                <blockquote className="mt-3 border-l-2 border-amber-400 pl-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    Claude:
                  </span>{" "}
                  {item.adjudicatorNote}
                </blockquote>
              )}

              {item.candidates.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  No MusicBrainz candidates — likely a local artist not in the
                  catalog yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {item.candidates.map((c) => (
                    <li
                      key={c.mbid}
                      className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <a
                          href={`https://musicbrainz.org/artist/${c.mbid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium underline decoration-dotted underline-offset-2"
                        >
                          {c.name} ↗
                        </a>
                        <button
                          onClick={() =>
                            act(item._id, () =>
                              approve({ reviewItemId: item._id, mbid: c.mbid })
                            )
                          }
                          disabled={disabled}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
                      <p className="mt-1 font-mono text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {c.evidence}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => act(item._id, () => reject({ reviewItemId: item._id }))}
                  disabled={disabled}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  Reject — not a match
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
