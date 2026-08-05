"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { EDGE_COLORS } from "@/lib/palette";
import { stationLabel } from "@/lib/stations";
import { formatDate, type EgoEdge } from "@/lib/types";

// The signature feature: tap a connection, see exactly why it exists.
// Handles all three edge types — editorial arrives in M5 but renders today.
export function ReceiptSheet({
  edge,
  fromName,
  toName,
  onClose,
}: {
  edge: EgoEdge;
  fromName: string;
  toName: string;
  onClose: () => void;
}) {
  const color = EDGE_COLORS[edge.type] ?? EDGE_COLORS.curation;
  const receipt = edge.receipt;
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-edge bg-raised p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Connection receipt
            </p>
            <h2 className="mt-1 text-lg font-bold leading-snug">
              {fromName} ↔ {toName}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close receipt"
            className="rounded-full bg-surface px-3 py-1 text-sm text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <span
          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: `${color}22`, color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {edge.type === "curation"
            ? "Curation — heard back-to-back on air"
            : edge.type === "canonical"
              ? "Canonical — MusicBrainz relationship"
              : "Editorial — music journalism"}
        </span>

        <dl className="mt-4 space-y-3 text-sm">
          {edge.type === "curation" && (
            <>
              <div>
                <dt className="text-xs text-muted">Co-plays within 60 minutes</dt>
                <dd className="text-xl font-bold">
                  {receipt.coPlayCount ?? edge.weight}×
                </dd>
              </div>
              {receipt.stations && receipt.stations.length > 0 && (
                <div>
                  <dt className="text-xs text-muted">Stations</dt>
                  <dd>{receipt.stations.map(stationLabel).join(", ")}</dd>
                </div>
              )}
              {receipt.exampleShowDate && (
                <div>
                  <dt className="text-xs text-muted">Example on-air moment</dt>
                  <dd>{formatDate(receipt.exampleShowDate)}</dd>
                </div>
              )}
              <p className="border-t border-edge pt-3 text-xs leading-relaxed text-muted">
                A DJ chose to play these artists in the same hour, on the same
                station, {receipt.coPlayCount ?? edge.weight} separate times.
                That&apos;s human curation — no listener data involved.
              </p>
            </>
          )}
          {edge.type === "canonical" && (
            <>
              <div>
                <dt className="text-xs text-muted">Relationship</dt>
                <dd className="font-semibold">
                  {receipt.mbRelationType ?? "related"}
                </dd>
              </div>
              <p className="border-t border-edge pt-3 text-xs leading-relaxed text-muted">
                Documented in{" "}
                <a
                  href="https://musicbrainz.org"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-dotted underline-offset-2"
                >
                  MusicBrainz
                </a>
                , the open music encyclopedia — a real-world link between these
                artists, independent of airplay.
              </p>
            </>
          )}
          {edge.type === "editorial" && (
            <>
              {receipt.quote && (
                <blockquote className="border-l-2 pl-3 italic" style={{ borderColor: color }}>
                  “{receipt.quote}”
                </blockquote>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  {receipt.relationType}
                  {receipt.confidence !== undefined &&
                    ` · confidence ${Math.round(receipt.confidence * 100)}%`}
                </span>
                {receipt.citationUrl && (
                  <a
                    href={receipt.citationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline decoration-dotted underline-offset-2"
                  >
                    Read the source ↗
                  </a>
                )}
              </div>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
