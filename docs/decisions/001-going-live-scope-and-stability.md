# 001 — Going live: nightly loop, three-station scope, pinned neighborhood names

**Decision** — Turn on the nightly steward loop with intake scoped to 88Nine, HYFIN,
and Rhythm Lab (414 Music excluded from new intake), and make graph rebuilds keep
existing neighborhood names instead of renaming them.

**Why this came up** — After the hackathon, the app showed a frozen snapshot while
the stations kept playing music. Tarik wanted Liner Notes to bring in live artists
and songs. Turning the loop on carelessly had two failure modes: the nightly scan
was capped at ~20k plays and would have re-read the same oldest chunk forever
(never reaching yesterday's plays), and every graph rebuild renamed the musical
neighborhoods — so a district a listener bookmarked as "Bronzeville Beat Loop"
could silently become something else.

**Options**

1. *Full live loop, all four stations.* Most complete, but 414 Music is direct
   local uploads — mostly absent from MusicBrainz — so its new strings would
   mostly pile up in the human review queue. Cost: a growing chore with little
   resolved payoff.
2. *Three stations now, 414 later* (chosen). New intake from 88Nine, HYFIN,
   Rhythm Lab only. Existing 414 artists (WebsterX, Lex Allen, etc.) stay in the
   catalog and graph. Cost: new 414-only artists won't appear until re-included.
3. *Stay manual.* No risk, but the product stays frozen and the "live loop" story
   the demo told stops being true.

**What we chose and why** — Option 2 (Tarik's call, 2026-08-26). The scope is one
environment variable (`STEWARD_STATIONS`), so re-including 414 Music later is a
one-line change. Name stability was non-negotiable ("I don't want it to rename
neighborhoods"): rebuilds now match new clusters to old districts by member
overlap (a quarter overlap keeps the name) and only genuinely new clusters get
named by Claude, with existing names off-limits.

**What we gave up** — New Milwaukee-local artists from 414 Music won't enter the
catalog while the scope holds — the station most about local discovery is the one
paused. And pinned names mean a district whose membership drifts a lot over months
could eventually wear a name that fits it loosely.

**How we'll know if this was right** — After a few weeks live: the review queue
stays small (a handful a week, not dozens); nightly runs show new plays being
scanned (plays-scanned count grows night over night); a manual graph rebuild keeps
all existing neighborhood names; and no listener-facing district rename happens.

**What actually happened** — *(Tarik fills this in later.)*
