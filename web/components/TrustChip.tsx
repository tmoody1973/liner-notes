"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { formatDate, type Resolution } from "@/lib/types";

const METHOD_LABELS: Record<string, string> = {
  exact: "Exact match",
  fuzzy: "Fuzzy match",
  llm: "Claude-adjudicated",
  human: "Human-approved",
  "judge-exact": "Exact match (judge mode)",
};

// The artist-level trust story: how the steward resolved this identity,
// with what confidence, on what evidence, and when.
export function TrustChip({
  resolution,
  mbid,
  lastRunAt,
}: {
  resolution: Resolution | null;
  mbid?: string;
  lastRunAt: number | null;
}) {
  const [open, setOpen] = useState(false);
  if (!resolution) return null;
  const pct = Math.round(resolution.confidence * 100);
  const tone =
    resolution.method === "human"
      ? "text-emerald-300"
      : pct >= 90
        ? "text-emerald-300"
        : pct >= 70
          ? "text-amber-300"
          : "text-red-300";
  return (
    <div className="rounded-2xl border border-edge bg-surface p-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Why trust this artist?
        </span>
        <span className="text-xs text-muted">{open ? "▴" : "▾"}</span>
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-raised px-2.5 py-0.5 font-medium">
          {METHOD_LABELS[resolution.method] ?? resolution.method}
        </span>
        <span className={`font-semibold ${tone}`}>{pct}% confidence</span>
        {mbid && (
          <a
            href={`https://musicbrainz.org/artist/${mbid}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            MusicBrainz ↗
          </a>
        )}
      </div>
      {open && (
        <div className="mt-3 space-y-2 border-t border-edge pt-3 text-xs text-muted">
          <p className="font-mono leading-relaxed">{resolution.evidence}</p>
          <p>
            Resolved {formatDate(resolution.resolvedAt)}
            {lastRunAt && <> · steward session of {formatDate(lastRunAt)}</>}
          </p>
          <p className="leading-relaxed">
            The steward agent matched this artist&apos;s raw playout spellings
            against MusicBrainz with Discogs and Deezer cross-checks; anything
            uncertain went to a human review queue. Full provenance lives in
            DataHub.
          </p>
        </div>
      )}
    </div>
  );
}
