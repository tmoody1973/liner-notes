// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import Link from "next/link";

export const metadata = { title: "About this data — Liner Notes" };

// Plain-language provenance story (MOO-469). Server component, no data.
export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16">
      <header className="pb-8 pt-10">
        <h1 className="text-3xl font-bold tracking-tight">About this data</h1>
        <p className="mt-3 text-lg text-muted">
          Liner Notes is Radio Milwaukee&apos;s airplay history, turned into an
          explorable map — with a receipt behind every connection.
        </p>
      </header>

      <div className="space-y-8 leading-relaxed">
        <section>
          <h2 className="font-semibold">Where the data comes from</h2>
          <p className="mt-2 text-muted">
            Four stations — 88Nine, HYFIN, 414 Music, and Rhythm Lab — log
            every song they air, with real timestamps. That playout log is
            messy by nature: the same artist arrives spelled five ways, with
            no IDs attached. We never touch the source data; we read it and
            build something new next to it.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">The steward agent cleans it</h2>
          <p className="mt-2 text-muted">
            An autonomous agent works through that backlog in narrated
            sessions: it matches each raw artist name against{" "}
            <a
              href="https://musicbrainz.org"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2"
            >
              MusicBrainz
            </a>{" "}
            (with Discogs and Deezer cross-checks), applies confident matches
            automatically, asks Claude to adjudicate ambiguous ones — saving
            its reasoning — and routes anything still uncertain to a human
            review queue. Every artist you see here carries a record of how it
            was matched, with what confidence, on what evidence. That record
            is the trust chip on every artist page.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">DataHub governs the whole pipeline</h2>
          <p className="mt-2 text-muted">
            Every dataset, every cleaning session, and every quality check is
            documented in{" "}
            <a
              href="https://datahub.com"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2"
            >
              DataHub
            </a>
            , an open-source data catalog. The agent reads its worklist from
            DataHub, then writes back what it did: quality assertions
            (resolution coverage, duplicates, enrichment coverage), lineage
            from raw plays to resolved artists to this graph, and a
            plain-English report of every session. Nothing here is a black
            box — a data steward can audit every step.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">The graph is built from co-play</h2>
          <p className="mt-2 text-muted">
            When a DJ plays two artists within the same hour on the same
            station, that&apos;s a curatorial judgment — these sounds belong
            together. Count those moments across ~170,000 plays and a graph
            appears: 600+ artists, ~40,000 weighted connections. Add
            documented MusicBrainz relationships (collaborations, band
            memberships) and the picture deepens. Communities emerge on their
            own — no genre labels as input — and Claude names them like city
            districts. The method follows the{" "}
            <a
              href="https://hdsr.mitpress.mit.edu/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2"
            >
              Stell-R artist-influence research
            </a>
            , applied to a corpus its authors didn&apos;t have: human radio
            curation.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">No listener data. None.</h2>
          <p className="mt-2 text-muted">
            Recommendations here come from what DJs chose to play, documented
            journalism, and open music encyclopedias — not from tracking you.
            No accounts, no profiles, no behavioral data. That&apos;s the
            thesis: human curation is enough.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Read the receipts</h2>
          <p className="mt-2 text-muted">
            Tap any connection in the{" "}
            <Link
              href="/"
              className="underline decoration-dotted underline-offset-2"
            >
              explorer
            </Link>
            , any hop in the{" "}
            <Link
              href="/pathfinder"
              className="underline decoration-dotted underline-offset-2"
            >
              pathfinder
            </Link>
            , or any track in a generated playlist, and it will tell you
            exactly why it&apos;s there — down to the timestamped plays.
          </p>
        </section>
      </div>
    </main>
  );
}
