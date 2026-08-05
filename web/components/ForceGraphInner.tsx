"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-2d";
import { EDGE_COLORS } from "@/lib/palette";
import type { EgoEdge } from "@/lib/types";

// Inner client-only module: loaded via next/dynamic (which doesn't forward
// refs), so the ForceGraph ref for force tuning + zoomToFit lives here.

export type GraphNode = {
  id: string;
  name: string;
  spins: number;
  color: string;
  isFocus: boolean;
  x?: number;
  y?: number;
};
export type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  weight: number;
  edge: EgoEdge;
};

// Canvas edge colors carry alpha so a dense ego network reads as a web, not a wall.
const LINK_COLORS: Record<string, string> = {
  curation: "rgba(125, 135, 158, 0.35)",
  canonical: "rgba(52, 211, 153, 0.8)",
  editorial: "rgba(96, 165, 250, 0.7)",
};

export default function ForceGraphInner({
  width,
  height,
  nodes,
  links,
  maxSpins,
  onNodeClick,
  onEdgeClick,
  labelRule,
  warmupTicks = 0,
  cooldownTicks = 90,
  mapMode = false,
}: {
  width: number;
  height: number;
  nodes: GraphNode[];
  links: GraphLink[];
  maxSpins: number;
  onNodeClick: (artistId: string) => void;
  onEdgeClick?: (edge: EgoEdge) => void;
  // Which labels to draw at a given zoom (default: all — fine for ego views;
  // the 604-node city map labels only anchors until you zoom in).
  labelRule?: (node: GraphNode, globalScale: number) => boolean;
  // Big graphs need more simulation: warmup runs before first paint,
  // cooldown after. Ego defaults suit ~30-node views.
  warmupTicks?: number;
  cooldownTicks?: number;
  // City-map physics: weak link pull + gentler charge so districts spread
  // into a readable cloud instead of a hub filament.
  mapMode?: boolean;
}) {
  const fgRef = useRef<
    ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>> | undefined
  >(undefined);
  // Auto-fit until the user takes over (drag/zoom/tap).
  const userTookOverRef = useRef(false);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge")?.strength(mapMode ? -60 : -160);
    const linkForce = fg.d3Force("link") as
      | {
          distance: (fn: (l: GraphLink) => number) => void;
          strength: (s: number) => void;
        }
      | undefined;
    linkForce?.distance((l: GraphLink) => 30 + 50 / Math.sqrt(l.weight));
    if (mapMode) linkForce?.strength(0.05);
  }, [nodes, links, mapMode]);

  // Fit to the 92nd-percentile radius around the layout's centroid — a few
  // weakly-linked outliers otherwise inflate the bounding box until the real
  // map is a speck. (The lib mutates our node objects with live x/y.)
  const fit = (ms: number) => {
    const placed = nodes.filter((n) => n.x !== undefined && n.y !== undefined);
    if (placed.length === 0) return;
    const cx = placed.reduce((s, n) => s + n.x!, 0) / placed.length;
    const cy = placed.reduce((s, n) => s + n.y!, 0) / placed.length;
    const dist = (n: GraphNode) => Math.hypot(n.x! - cx, n.y! - cy);
    const sorted = placed.map(dist).sort((a, b) => a - b);
    const r = sorted[Math.floor(sorted.length * 0.92)] ?? Infinity;
    fgRef.current?.zoomToFit(ms, 40, (n) => dist(n as GraphNode) <= r);
  };

  // Layouts keep contracting for a while (especially the 604-node map) and
  // containers settle late on mobile — re-fit on a staged schedule until the
  // user interacts, then never fight their viewport again.
  useEffect(() => {
    userTookOverRef.current = false;
    const timers = [150, 1200, 4000, 9000, 16000].map((ms) =>
      setTimeout(() => {
        if (!userTookOverRef.current) fit(300);
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, nodes]);

  const radius = (n: GraphNode) => 3 + 9 * Math.sqrt(n.spins / maxSpins);

  return (
    <div
      className="h-full w-full"
      onPointerDownCapture={() => {
        userTookOverRef.current = true;
      }}
      onWheelCapture={() => {
        userTookOverRef.current = true;
      }}
    >
    <ForceGraph2D
      ref={fgRef}
      width={width}
      height={height}
      graphData={{ nodes, links }}
      backgroundColor="rgba(0,0,0,0)"
      nodeCanvasObjectMode={() => "replace"}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const n = node as GraphNode;
        const r = radius(n);
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI);
        ctx.fillStyle = n.color;
        ctx.fill();
        if (n.isFocus) {
          ctx.lineWidth = 2 / globalScale;
          ctx.strokeStyle = "#e8eaf0";
          ctx.stroke();
        }
        if (!labelRule || labelRule(n, globalScale)) {
          const fontSize = Math.max(11 / globalScale, 2.2);
          ctx.font = `${n.isFocus ? "700" : "400"} ${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = n.isFocus ? "#e8eaf0" : "#aeb6c8";
          ctx.fillText(n.name, n.x!, n.y! + r + 1.5);
        }
      }}
      nodePointerAreaPaint={(node, color, ctx) => {
        const n = node as GraphNode;
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, radius(n) + 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      linkColor={(link) =>
        LINK_COLORS[(link as GraphLink).type] ?? LINK_COLORS.curation
      }
      linkWidth={(link) =>
        Math.min(4, 0.5 + Math.sqrt((link as GraphLink).weight) / 3)
      }
      linkHoverPrecision={8}
      onNodeClick={(node) => onNodeClick((node as GraphNode).id)}
      onLinkClick={
        onEdgeClick ? (link) => onEdgeClick((link as GraphLink).edge) : undefined
      }
      onEngineStop={() => {
        if (!userTookOverRef.current) fit(400);
      }}
      warmupTicks={warmupTicks}
      cooldownTicks={cooldownTicks}
      d3VelocityDecay={0.3}
      minZoom={0.05}
      maxZoom={8}
    />
    </div>
  );
}
