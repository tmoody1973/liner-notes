# DataHub feedback — Liner Notes (hackathon survey)

## Which parts of DataHub felt polished or useful during your build?

The MCP Server was the standout. `uvx mcp-server-datahub` over stdio worked on the first try, and my steward agent's whole orientation phase is built on it: every session it searches the catalog, reads schemas and assertion state, and pulls its own prior run reports before deciding what to work on. I never had to think about that integration again after the first afternoon.

The ingestion framework's plugin model is the other one. I wrote a new Convex source and it slotted in like an official connector: register an entry point under `datahub.ingestion.source.plugins`, follow the config conventions (`EnvConfigMixin`, `SecretStr`, `AllowDenyPattern`), and the recipe just runs. The conventions doc in `metadata-ingestion` told me exactly what a source is supposed to look like, which is why the same code could go straight into an upstream PR.

Also worth saying: the GraphQL API covers a lot. Assertions with custom run results, incidents, domains, glossary, ownership, lineage. Everything my agent writes back goes through that one endpoint.

## Where did you get stuck or lose time?

Environment stuff, mostly at the start. My machine had Python 3.14 as the default and `acryl-datahub` wouldn't install on it, so I lost time before pinning a 3.11 venv. A clearer supported-version statement up front in the install docs would have saved that hour.

The quickstart's first boot hit a MySQL healthcheck race and needed one re-run. Harmless once you know, confusing the first time.

The bigger cost was resource footprint. Running the quickstart stack next to my dev environment was too heavy for my laptop, so mid-hackathon I moved DataHub to an 8 GB cloud VM. Even there, OpenSearch got OOM-killed under indexing load during a connector re-ingest. `docker start` brings it back, but a single-node deployment that can't survive its own ingest indexing on 8 GB is a rough fit for a team my size.

And one API mismatch, described in the bug section below, cost a debugging session because it only fired on a code path that needed a threshold to flip.

## If you had unlimited engineering time on DataHub, what would you build or fix first?

Write tools in the MCP Server. Reading through MCP was so good that the asymmetry became the main gap: my agent orients through MCP, but everything it contributes back (run reports, assertion results, incidents, lineage, ownership) needed a hand-rolled GraphQL client, where I hit schema drift between docs and my GMS version. If an agent could document its work through the same server it reads from, the "agent lives in the catalog" loop would be one integration instead of two, and the typed tool schemas would absorb exactly the version-drift problems I hit.

That matters for teams like mine because a four-person radio station is never going to staff a data platform team. The realistic model is one engineer plus an agent, and the agent needs a stable, boring write path as much as a read path.

Second on the list: a lighter small-team deployment profile, per the OOM story above.

## Any bugs, errors, or unexpected behavior?

One real bug. My agent resolves incidents when resolution coverage crosses its threshold. I wrote the `updateIncidentStatus` mutation with `UpdateIncidentStatusInput!` as the variable type, matching the examples I'd found. I expected the incident to resolve. Instead GMS (v1.7.0 quickstart) rejected the request with a validation error naming a different expected type: `IncidentStatusInput!`. The sneaky part was that this path only executes when coverage crosses 80%, which my judge-mode sample data did and production hadn't, so it sat latent until a demo run. One-line fix on my side once the error surfaced, but the input-type naming between docs, examples, and the deployed schema is worth an audit.

Two smaller ones, both mentioned above: the MySQL healthcheck race on the quickstart's first boot (a re-run fixes it), and OpenSearch getting OOM-killed on an 8 GB single-node VM under connector re-ingest indexing (restarting the container recovers it).
