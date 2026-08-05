// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0

// DataHub GMS GraphQL client — the write half of the steward (MOO-464).
// The MCP server the Orient phase uses is read-only (search/lineage/entities),
// so documenting the agent's work back into DataHub — custom assertions,
// lineage, run-report docs, ownership — goes through GMS GraphQL directly.
// The same client reads assertion state back, which is what closes the loop:
// session N+1's Orient consumes the assertions session N wrote.

const PLATFORM_URN = "urn:li:dataPlatform:convex";
const STEWARD_USER_URN = "urn:li:corpuser:liner-notes-steward";
const TECHNICAL_OWNER_URN = "urn:li:ownershipType:__system__technical_owner";

export const datasetUrn = (name: string): string =>
  `urn:li:dataset:(${PLATFORM_URN},${name},PROD)`;

export interface StewardStats {
  workItems: { total: number } & Record<string, number>;
  duplicateReviewRows: number;
  artists: { total: number; resolved: number; enriched: number };
}

// The datasets the steward documents each session, with the stable half of
// their Documentation tab (the run report is appended below it).
const DATASET_DESCRIPTIONS: Record<string, string> = {
  "rm-playlist-v2.plays":
    "Raw airplay log from Radio Milwaukee's playlist system — one row per spin across " +
    "88Nine, HYFIN, and 414 Music. This is the steward agent's backlog: every distinct " +
    "raw artist string here is resolved to a canonical artist in liner-notes.artists.",
  "liner-notes.artists":
    "Canonical artists resolved from raw airplay strings by the steward agent — " +
    "MusicBrainz-backed identities with field-level provenance, genres, and relations.",
  "liner-notes.tracks":
    "Tracks tied to resolved artists, with ISRCs, release years, and streaming links " +
    "where the steward's enrichment found them.",
  "liner-notes.workItems":
    "The steward agent's work queue — one row per distinct raw artist string, with " +
    "status (pending/resolved/review/ignored) and attempt provenance.",
};

export interface AssertionOutcome {
  urn: string;
  label: string;
  pass: boolean;
  detail: string;
}

// The three quality contracts the steward maintains on the source backlog
// dataset. Thresholds are deliberate: coverage starts red on a fresh backlog
// and turns green as sessions drain it — that movement is the story.
const RESOLUTION_COVERAGE_THRESHOLD = 0.5;
const ENRICHMENT_COVERAGE_THRESHOLD = 0.8;

interface AssertionSpec {
  id: string;
  type: string;
  description: string;
  pass: boolean;
  properties: Record<string, string>;
}

function assertionSpecs(stats: StewardStats): AssertionSpec[] {
  const { workItems, duplicateReviewRows, artists } = stats;
  const resolved = workItems.resolved ?? 0;
  const coverage = workItems.total > 0 ? resolved / workItems.total : 0;
  const enrichment = artists.resolved > 0 ? artists.enriched / artists.resolved : 0;
  return [
    {
      id: "liner-notes-resolution-coverage",
      type: "Resolution coverage",
      description:
        `At least ${RESOLUTION_COVERAGE_THRESHOLD * 100}% of distinct raw artist strings in the ` +
        `airplay backlog are resolved to canonical MusicBrainz artists.`,
      pass: coverage >= RESOLUTION_COVERAGE_THRESHOLD,
      properties: {
        resolvedWorkItems: String(resolved),
        totalWorkItems: String(workItems.total),
        coveragePct: (coverage * 100).toFixed(1),
        thresholdPct: String(RESOLUTION_COVERAGE_THRESHOLD * 100),
      },
    },
    {
      id: "liner-notes-duplicate-reviews",
      type: "Duplicate review rows",
      description:
        "The human review queue contains no duplicate pending rows per raw artist string.",
      pass: duplicateReviewRows === 0,
      properties: { duplicatePendingReviewRows: String(duplicateReviewRows) },
    },
    {
      id: "liner-notes-enrichment-coverage",
      type: "Enrichment coverage",
      description:
        `At least ${ENRICHMENT_COVERAGE_THRESHOLD * 100}% of resolved artists carry enrichment ` +
        `(genres/relations/links) from MusicBrainz and streaming sources.`,
      pass: enrichment >= ENRICHMENT_COVERAGE_THRESHOLD,
      properties: {
        enrichedArtists: String(artists.enriched),
        resolvedArtists: String(artists.resolved),
        coveragePct: (enrichment * 100).toFixed(1),
        thresholdPct: String(ENRICHMENT_COVERAGE_THRESHOLD * 100),
      },
    },
  ];
}

export class DataHubGms {
  private readonly gmsUrl: string;
  private readonly token: string | undefined;

  constructor() {
    this.gmsUrl = process.env.DATAHUB_GMS_URL ?? "http://localhost:8080";
    this.token = process.env.DATAHUB_GMS_TOKEN;
  }

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.gmsUrl}/api/graphql`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
      throw new Error(`GMS GraphQL HTTP ${response.status} for ${this.gmsUrl}`);
    }
    const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
    if (body.errors && body.errors.length > 0) {
      throw new Error(`GMS GraphQL: ${body.errors.map((e) => e.message).join("; ")}`);
    }
    if (!body.data) throw new Error("GMS GraphQL: empty response");
    return body.data;
  }

  // ── Assertions (write) ────────────────────────────────────────────────

  // Upsert the three steward assertions on the given dataset and report this
  // session's pass/fail results. Stable assertion URNs make re-runs update in
  // place rather than pile up.
  async upsertSessionAssertions(
    entityUrn: string,
    stats: StewardStats
  ): Promise<AssertionOutcome[]> {
    const outcomes: AssertionOutcome[] = [];
    for (const spec of assertionSpecs(stats)) {
      const assertionUrn = `urn:li:assertion:${spec.id}`;
      await this.graphql(
        `mutation upsertCustomAssertion($urn: String, $input: UpsertCustomAssertionInput!) {
          upsertCustomAssertion(urn: $urn, input: $input) { urn }
        }`,
        {
          urn: assertionUrn,
          input: {
            entityUrn,
            type: spec.type,
            description: spec.description,
            platform: { urn: PLATFORM_URN },
          },
        }
      );
      await this.graphql(
        `mutation reportAssertionResult($urn: String!, $result: AssertionResultInput!) {
          reportAssertionResult(urn: $urn, result: $result)
        }`,
        {
          urn: assertionUrn,
          result: {
            timestampMillis: Date.now(),
            type: spec.pass ? "SUCCESS" : "FAILURE",
            properties: Object.entries(spec.properties).map(([key, value]) => ({ key, value })),
          },
        }
      );
      const detail = Object.entries(spec.properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ");
      outcomes.push({ urn: assertionUrn, label: spec.type, pass: spec.pass, detail });
    }
    return outcomes;
  }

  // ── Assertions (read — the closed loop) ───────────────────────────────

  // Plain-English summary of the assertion state a previous session wrote.
  // Orient narrates this, proving the agent consumes its own documentation.
  async readAssertionState(entityUrn: string): Promise<string> {
    const data = await this.graphql<{
      dataset: {
        assertions: {
          total: number;
          assertions: {
            info: {
              type: string;
              description: string | null;
              customAssertion: { type: string | null } | null;
            } | null;
            runEvents: {
              runEvents: {
                timestampMillis: number;
                result: { type: string; nativeResults: { key: string; value: string }[] } | null;
              }[];
            } | null;
          }[];
        } | null;
      } | null;
    }>(
      `query assertionState($urn: String!) {
        dataset(urn: $urn) {
          assertions(start: 0, count: 20) {
            total
            assertions {
              info { type description customAssertion { type } }
              runEvents(limit: 1) {
                runEvents { timestampMillis result { type nativeResults { key value } } }
              }
            }
          }
        }
      }`,
      { urn: entityUrn }
    );
    const assertions = data.dataset?.assertions?.assertions ?? [];
    if (assertions.length === 0) {
      return "no assertions recorded yet (first stewardship pass; write-back lands after this session)";
    }
    const parts = assertions.map((a) => {
      const label = a.info?.customAssertion?.type ?? a.info?.type ?? "assertion";
      const run = a.runEvents?.runEvents?.[0];
      if (!run?.result) return `${label}: no runs yet`;
      const numbers = (run.result.nativeResults ?? [])
        .map((r) => `${r.key}=${r.value}`)
        .join(" ");
      const age = Math.round((Date.now() - run.timestampMillis) / 60000);
      return `${label}: ${run.result.type}${numbers ? ` (${numbers})` : ""} as of ${age}m ago`;
    });
    return `${assertions.length} assertions from the previous session — ${parts.join("; ")}`;
  }

  // ── Lineage ───────────────────────────────────────────────────────────

  async upsertLineage(upstreamUrn: string, downstreamUrns: string[]): Promise<void> {
    await this.graphql(
      `mutation updateLineage($input: UpdateLineageInput!) { updateLineage(input: $input) }`,
      {
        input: {
          edgesToAdd: downstreamUrns.map((downstreamUrn) => ({ upstreamUrn, downstreamUrn })),
          edgesToRemove: [],
        },
      }
    );
  }

  // ── Documentation & ownership ─────────────────────────────────────────

  // Each documented dataset keeps a stable plain-English description with the
  // latest run report appended below it — one Documentation tab, both halves.
  async writeDocumentation(report: string, runId: string): Promise<string[]> {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const reportSection =
      `\n\n---\n\n**Latest steward run report — ${stamp} UTC (run \`${runId}\`)**\n\n${report}\n\n` +
      `_Written by the Liner Notes steward agent after each stewardship session._`;
    const documented: string[] = [];
    for (const [name, staticDescription] of Object.entries(DATASET_DESCRIPTIONS)) {
      await this.graphql(
        `mutation updateDescription($input: DescriptionUpdateInput!) {
          updateDescription(input: $input)
        }`,
        {
          input: {
            description: staticDescription + reportSection,
            resourceUrn: datasetUrn(name),
          },
        }
      );
      documented.push(name);
    }
    return documented;
  }

  // Idempotent: registers the steward as a corpuser (so the owner chip resolves
  // in the UI) and adds it as technical owner on every dataset it stewards.
  async ensureOwnership(entityUrns: string[]): Promise<void> {
    await this.ensureStewardUser();
    await this.graphql(
      `mutation batchAddOwners($input: BatchAddOwnersInput!) { batchAddOwners(input: $input) }`,
      {
        input: {
          owners: [
            {
              ownerUrn: STEWARD_USER_URN,
              ownerEntityType: "CORP_USER",
              ownershipTypeUrn: TECHNICAL_OWNER_URN,
            },
          ],
          resources: entityUrns.map((resourceUrn) => ({ resourceUrn })),
        },
      }
    );
  }

  private async ensureStewardUser(): Promise<void> {
    const response = await fetch(`${this.gmsUrl}/openapi/v3/entity/corpuser?async=false`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify([
        {
          urn: STEWARD_USER_URN,
          corpUserInfo: {
            value: {
              active: true,
              displayName: "Liner Notes Steward (agent)",
              title: "Autonomous metadata steward",
            },
          },
        },
      ]),
    });
    if (!response.ok) {
      throw new Error(`corpuser upsert HTTP ${response.status}`);
    }
  }
}
