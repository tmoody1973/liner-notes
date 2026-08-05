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
}: {
  width: number;
  height: number;
  nodes: GraphNode[];
  links: GraphLink[];
  maxSpins: number;
  onNodeClick: (artistId: string) => void;
  onEdgeClick?: (edge: EgoEdge) => void;
}) {
  const fgRef = useRef<
    ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>> | undefined
  >(undefined);
  // Auto-fit once per data change, not after every user drag.
  const fittedRef = useRef(false);

  useEffect(() => {
    fittedRef.current = false;
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge")?.strength(-160);
    const linkForce = fg.d3Force("link") as
      | { distance: (fn: (l: GraphLink) => number) => void }
      | undefined;
    linkForce?.distance((l: GraphLink) => 30 + 50 / Math.sqrt(l.weight));
  }, [nodes, links]);

  // Containers settle late on mobile (flex layout after data load) — re-fit
  // whenever the canvas dimensions change.
  useEffect(() => {
    const t = setTimeout(() => fgRef.current?.zoomToFit(300, 40), 150);
    return () => clearTimeout(t);
  }, [width, height]);

  const radius = (n: GraphNode) => 3 + 9 * Math.sqrt(n.spins / maxSpins);

  return (
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
        const fontSize = Math.max(11 / globalScale, 2.2);
        ctx.font = `${n.isFocus ? "700" : "400"} ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = n.isFocus ? "#e8eaf0" : "#aeb6c8";
        ctx.fillText(n.name, n.x!, n.y! + r + 1.5);
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
        if (!fittedRef.current) {
          fittedRef.current = true;
          fgRef.current?.zoomToFit(400, 40);
        }
      }}
      cooldownTicks={90}
      d3VelocityDecay={0.3}
      minZoom={0.5}
      maxZoom={8}
    />
  );
}
