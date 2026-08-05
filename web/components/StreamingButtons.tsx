"use client";
// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";

// One tap out to the listener's own streaming service (MOO-471). Real link
// when the track carries one (SonoVault/Deezer backfill); otherwise a search
// link on that service — never a dead button. The device remembers the
// preferred service (localStorage only, no accounts) and leads with it.

const PREF_KEY = "liner-notes-preferred-service";

type Service = {
  key: string;
  label: string;
  short: string;
  search: (q: string) => string;
};

const SERVICES: Service[] = [
  {
    key: "spotify",
    label: "Spotify",
    short: "Sp",
    search: (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
  },
  {
    key: "applemusic",
    label: "Apple Music",
    short: "Ap",
    search: (q) =>
      `https://music.apple.com/us/search?term=${encodeURIComponent(q)}`,
  },
  {
    key: "deezer",
    label: "Deezer",
    short: "Dz",
    search: (q) => `https://www.deezer.com/search/${encodeURIComponent(q)}`,
  },
  {
    key: "youtube",
    label: "YouTube",
    short: "Yt",
    search: (q) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  },
];

export function getPreferredService(): string | null {
  try {
    return localStorage.getItem(PREF_KEY);
  } catch {
    return null;
  }
}

export function StreamingButtons({
  links,
  artistName,
  title,
  compact = false,
}: {
  links: Record<string, string>;
  artistName: string;
  title: string;
  compact?: boolean;
}) {
  const [preferred, setPreferred] = useState<string | null>(null);
  useEffect(() => setPreferred(getPreferredService()), []);

  const query = `${artistName} ${title}`;
  const ordered = [...SERVICES].sort((a, b) =>
    a.key === preferred ? -1 : b.key === preferred ? 1 : 0
  );

  const open = (service: Service) => {
    try {
      localStorage.setItem(PREF_KEY, service.key);
    } catch {
      // private mode — preference just won't stick
    }
    setPreferred(service.key);
  };

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {ordered.map((service) => {
        const real = links[service.key];
        return (
          <a
            key={service.key}
            href={real ?? service.search(query)}
            target="_blank"
            rel="noreferrer"
            onClick={() => open(service)}
            title={
              real
                ? `Open in ${service.label}`
                : `Search on ${service.label} (no direct link for this track)`
            }
            className={`rounded-full border text-xs font-medium transition ${
              compact ? "px-2 py-0.5" : "px-2.5 py-1"
            } ${
              service.key === preferred
                ? "border-(--hood-0) text-(--hood-0)"
                : real
                  ? "border-edge text-foreground hover:border-[color:var(--muted)]"
                  : "border-edge text-muted hover:text-foreground"
            }`}
          >
            {compact ? service.short : service.label}
            {!real && "⌕"}
          </a>
        );
      })}
    </span>
  );
}
