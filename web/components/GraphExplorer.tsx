"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphLink, GraphNode } from "@/components/ForceGraphInner";
import { hoodColor } from "@/lib/palette";
import type { EgoEdge, EgoNetwork } from "@/lib/types";

// Canvas + window territory — client-only. The ref-dependent bits live in
// ForceGraphInner (next/dynamic doesn't forward refs).
const ForceGraphInner = dynamic(() => import("@/components/ForceGraphInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Warming up the graph…
    </div>
  ),
});

// Interlinks beyond this count turn the view into a hairball; keep the
// strongest and let the receipts panel carry the completeness.
const MAX_INTER_EDGES = 60;

export function GraphExplorer({
  data,
  hoodIndexOf,
  onNodeClick,
  onEdgeClick,
  trim = true,
  labelRule,
  warmupTicks,
  cooldownTicks,
  mapMode,
  liveIds,
}: {
  data: EgoNetwork;
  hoodIndexOf: (neighborhoodId: string | undefined) => number | undefined;
  onNodeClick: (artistId: string) => void;
  onEdgeClick?: (edge: EgoEdge) => void;
  // Ego views trim non-focus edges; the city map pre-trims server-side.
  trim?: boolean;
  labelRule?: (node: GraphNode, globalScale: number) => boolean;
  warmupTicks?: number;
  cooldownTicks?: number;
  mapMode?: boolean;
  liveIds?: Set<string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The lib mutates node objects (layout x/y), so hand it fresh copies.
  const { nodes, links, maxSpins } = useMemo(() => {
    const nodes: GraphNode[] = data.nodes.map((n) => ({
      id: n.artistId,
      name: n.displayName,
      spins: n.spinCount,
      color: hoodColor(hoodIndexOf(n.neighborhoodId)),
      isFocus: n.artistId === data.focus,
      isLive: liveIds?.has(n.artistId) ?? false,
    }));
    const focusEdges = data.edges.filter(
      (e) => e.from === data.focus || e.to === data.focus
    );
    const interEdges = data.edges
      .filter((e) => e.from !== data.focus && e.to !== data.focus)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, trim ? MAX_INTER_EDGES : Infinity);
    const links: GraphLink[] = [...focusEdges, ...interEdges].map((e) => ({
      source: e.from,
      target: e.to,
      type: e.type,
      weight: e.weight,
      edge: e,
    }));
    const maxSpins = Math.max(1, ...data.nodes.map((n) => n.spinCount));
    return { nodes, links, maxSpins };
  }, [data, hoodIndexOf, trim, liveIds]);

  return (
    <div ref={containerRef} className="h-full w-full touch-none">
      {size.width > 0 && (
        <ForceGraphInner
          width={size.width}
          height={size.height}
          nodes={nodes}
          links={links}
          maxSpins={maxSpins}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          labelRule={labelRule}
          warmupTicks={warmupTicks}
          cooldownTicks={cooldownTicks}
          mapMode={mapMode}
        />
      )}
    </div>
  );
}
