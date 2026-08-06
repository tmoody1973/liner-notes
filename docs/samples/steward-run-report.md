# Sample steward run reports

Two real, unedited run records from the `stewardRuns` table of the production
Liner Notes deployment. The agent writes one of these in its **document** phase
at the end of every session — the same text is pushed to DataHub as dataset
documentation, so the catalog carries the agent's paper trail.

---

## Live stewardship session (resolution + enrichment)

- **Run id:** `kh71p88pj9weccryvj53zjay2s8bwv8p`
- **Started:** 2026-08-05 04:51 CDT · **Finished:** 2026-08-05 05:11 CDT
- **Counts:** `{ autoApplied: 4, llmApplied: 2, enriched: 69, review: 19, skippedLocal: 30 }`

> This was a live (non-test) stewardship run that worked through 20,480 logged
> plays covering 975 distinct artists; the scan did not reach the end of the
> backlog, so some plays remain unread and will need another pass. No new work
> items were opened this time, but the session did move existing ones along:
> 4 matches were confident enough to apply automatically, 2 more were applied
> after an language-model review, 69 artist records picked up additional
> enrichment detail, and 30 candidates were skipped because local rules said to
> leave them alone. Nineteen items were set aside for a human to look at, which
> is where a librarian's attention would be most useful next. On the health
> checks carried over from the previous session, the duplicate-review test came
> back clean with zero pending duplicate rows, but two checks are still
> failing: only 15 percent of work items are resolved against a 50 percent
> target (158 of 1,055), and only 25 percent of resolved artists have been
> enriched against an 80 percent target. In short, the catalog is moving in the
> right direction but both coverage gaps are wide, and the 31 datasets
> published to DataHub reflect that partial state rather than a finished one.

Note the honesty: the agent reports its own failing assertions. Those two red
checks are visible in DataHub as failed assertions, and the resolution-coverage
one carries a real ACTIVE incident (see `screenshots/`).

---

## Editorial extraction session (cited influence edges)

- **Run id:** `kh765xrgxxvtq4735d8vvkqw998bwcks`
- **Started:** 2026-08-05 16:48 CDT · **Finished:** 2026-08-05 16:52 CDT
- **Counts:** `{ editorialScanned: 50, editorialEdges: 60, duplicates: 9, externalDropped: 253, requests: 50 }`

> Editorial extraction session: scanned 50 of the station's most-played artists
> against 5 music journalism sources via Perplexity (sonar-pro). Found 322
> candidate connections; 60 became typed editorial edges (quote + citation as
> receipt), 9 were already known, 253 mentioned artists outside the catalog and
> were dropped, 0 fell under the 0.5 confidence floor, and 0 cited pages
> outside the source registry. Spend: 50 requests, ~35416 tokens, estimated
> $0.74 (cap: 50 artists/session). No article text stored.

The full narrated session (every artist, every accept/drop decision) is in
[`editorial-session.log`](./editorial-session.log).
