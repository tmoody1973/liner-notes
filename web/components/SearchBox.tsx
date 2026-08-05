"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { anyApi } from "convex/server";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { ArtistLite } from "@/lib/types";

// Instant client-side search over the whole catalog (~600 artists) — one
// reactive query, no per-keystroke server round-trips.
export function SearchBox({
  placeholder = "Search any artist the stations have played…",
  autoFocus = false,
  onPick,
}: {
  placeholder?: string;
  autoFocus?: boolean;
  // Default behavior navigates to the artist page; pickers override this.
  onPick?: (artist: ArtistLite) => void;
}) {
  const router = useRouter();
  const index = useQuery(anyApi.app.artistIndex) as ArtistLite[] | undefined;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    if (!index || q.trim().length < 1) return [];
    const needle = q.trim().toLowerCase();
    return index
      .filter((a) => a.displayName.toLowerCase().includes(needle))
      .sort((a, b) => {
        const aStarts = a.displayName.toLowerCase().startsWith(needle) ? 0 : 1;
        const bStarts = b.displayName.toLowerCase().startsWith(needle) ? 0 : 1;
        return aStarts - bStarts || b.spinCount - a.spinCount;
      })
      .slice(0, 8);
  }, [index, q]);

  const pick = (artist: ArtistLite) => {
    setQ("");
    setOpen(false);
    if (onPick) onPick(artist);
    else router.push(`/artist/${artist.artistId}`);
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && matches[highlight]) {
            e.preventDefault();
            pick(matches[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={index === undefined ? "Loading catalog…" : placeholder}
        className="w-full rounded-2xl border border-edge bg-surface px-4 py-3 text-base outline-none transition placeholder:text-muted focus:border-(--hood-0) focus:ring-2 focus:ring-(--hood-0)/20"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-edge bg-raised shadow-2xl">
          {matches.map((a, i) => (
            <li key={a.artistId}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(a);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                  i === highlight ? "bg-surface" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {a.displayName}
                  </span>
                  {a.genres.length > 0 && (
                    <span className="block truncate text-xs text-muted">
                      {a.genres.join(" · ")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {a.spinCount} spins
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
