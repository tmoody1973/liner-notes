// Copyright 2026 Radio Milwaukee / Liner Notes contributors
// SPDX-License-Identifier: Apache-2.0
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// The agent's window into DataHub: the official DataHub MCP Server
// (`uvx mcp-server-datahub`, stdio transport). The Orient phase reads the
// context graph through the same interface any MCP-capable agent would use.

export interface DataHubOrientation {
  toolNames: string[];
  datasets: { name: string; urn: string }[];
  playsEntity: Record<string, unknown> | null;
  assertionSummary: string;
}

export class DataHubMcp {
  private client: Client | null = null;

  async connect(): Promise<void> {
    const transport = new StdioClientTransport({
      command: "uvx",
      args: ["mcp-server-datahub"],
      env: {
        ...(process.env as Record<string, string>),
        DATAHUB_GMS_URL: process.env.DATAHUB_GMS_URL ?? "http://localhost:8080",
      },
      stderr: "ignore",
    });
    this.client = new Client({ name: "liner-notes-steward", version: "0.1.0" });
    await this.client.connect(transport);
  }

  async close(): Promise<void> {
    await this.client?.close();
    this.client = null;
  }

  private async call(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.client) throw new Error("MCP client not connected");
    const result = await this.client.callTool({ name, arguments: args });
    const blocks = (result.content ?? []) as { type: string; text?: string }[];
    const text = blocks
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n");
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async listToolNames(): Promise<string[]> {
    if (!this.client) throw new Error("MCP client not connected");
    const { tools } = await this.client.listTools();
    return tools.map((t) => t.name);
  }

  // Search the context graph for the Convex datasets the connector ingested.
  async searchConvexDatasets(): Promise<{ name: string; urn: string }[]> {
    const result = (await this.call("search", {
      query: "/q platform:convex",
      num_results: 40,
    })) as any;
    const entities: any[] =
      result?.searchResults ?? result?.entities ?? result?.results ?? [];
    return entities
      .map((e: any) => {
        const entity = e.entity ?? e;
        const urn: string = entity.urn ?? "";
        const name: string =
          entity.name ?? entity.properties?.name ?? urn.split(",")[1] ?? urn;
        return { name, urn };
      })
      .filter((d) => d.urn.includes("dataPlatform:convex"));
  }

  async getEntity(urn: string): Promise<Record<string, unknown> | null> {
    try {
      const result = (await this.call("get_entities", { urns: [urn] })) as any;
      const list = result?.entities ?? result;
      return Array.isArray(list) ? list[0] ?? null : (list as Record<string, unknown>);
    } catch {
      return null;
    }
  }
}

export function summarizeAssertions(entity: Record<string, unknown> | null): string {
  if (!entity) return "entity not readable via MCP";
  const text = JSON.stringify(entity);
  const match = text.match(/"assertions?"\s*:\s*(\[[^\]]*\]|\{[^}]*\})/);
  if (!match || match[1] === "[]" || match[1] === "{}") {
    return "no assertions recorded yet (first stewardship pass; write-back lands in MOO-464)";
  }
  return `assertions present: ${match[1].slice(0, 200)}`;
}
