"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import { EDGE_COLORS } from "@/lib/palette";
import { stationLabel } from "@/lib/stations";
import { formatDate, type EdgeReceipt } from "@/lib/types";

type Hop = { from: string; to: string; weight: number; type: string };
type Edge = { type: string; weight: number; receipt: EdgeReceipt };

// The connector between two path cards: the edge's receipt, spelled out.
// Pulls the full receipt from graph.edgeBetween (the hop only carries
// weight + type across the API).
export function HopReceipt({ hop }: { hop: Hop }) {
  const edges = useQuery(anyApi.graph.edgeBetween, {
    a: hop.from,
    b: hop.to,
  }) as Edge[] | undefined;
  const edge =
    edges?.find((e) => e.type === hop.type && e.weight === hop.weight) ??
    edges?.[0];
  const receipt = edge?.receipt;
  return (
    <div className="flex items-stretch gap-3 py-1 pl-9 text-xs text-muted">
      <span
        className="w-0.5 shrink-0 rounded"
        style={{ background: EDGE_COLORS[hop.type] ?? EDGE_COLORS.curation }}
      />
      <span className="py-1.5">
        {receipt === undefined && edges === undefined ? (
          "…"
        ) : hop.type === "canonical" ? (
          <>
            MusicBrainz: <span className="text-foreground">{receipt?.mbRelationType ?? "related"}</span>
          </>
        ) : (
          <>
            co-played{" "}
            <span className="font-semibold text-foreground">{hop.weight}×</span>
            {receipt?.stations && receipt.stations.length > 0 && (
              <> on {receipt.stations.map(stationLabel).join(", ")}</>
            )}
            {receipt?.exampleShowDate && (
              <> · e.g. {formatDate(receipt.exampleShowDate)}</>
            )}
          </>
        )}
      </span>
    </div>
  );
}
