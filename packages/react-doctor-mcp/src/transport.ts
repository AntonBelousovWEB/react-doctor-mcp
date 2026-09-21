import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { isReactDoctorError } from "react-doctor/api";
import { MAX_ERROR_MESSAGE_CHARS, MCP_SERVER_NAME } from "./constants.js";
import { ReactDoctorMcpError } from "./errors.js";
import { TOOL_SCHEMAS } from "./presentation/schemas.js";
import { shutdownTelemetry, startTelemetry } from "./telemetry/runtime.js";
import type { AppContext } from "./tools/contracts.js";
import { TOOL_DISPATCH } from "./tools/registry.js";

const serverVersion = process.env.VERSION ?? "0.0.0";

const buildToolList = (): Tool[] =>
  Object.entries(TOOL_SCHEMAS).map(([name, schema]) => ({
    name,
    description: schema.description,
    inputSchema: schema.inputSchema,
  }));

const okResult = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data) }],
});

const errResult = (message: string) => ({
  content: [{ type: "text" as const, text: message.slice(0, MAX_ERROR_MESSAGE_CHARS) }],
  isError: true,
});

export const buildServer = (ctx: AppContext): Server => {
  const server = new Server(
    { name: MCP_SERVER_NAME, version: serverVersion },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: buildToolList() }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const handler = TOOL_DISPATCH[name];
    if (handler === undefined) {
      return errResult(`Unknown tool: ${name}`);
    }
    try {
      return okResult(await handler(ctx, request.params.arguments ?? {}));
    } catch (error) {
      if (error instanceof ReactDoctorMcpError || isReactDoctorError(error)) {
        return errResult(error.message);
      }
      console.error(`react-doctor-mcp: unexpected error in tool "${name}"`, error);
      return errResult(`Internal error in ${name}`);
    }
  });

  return server;
};

export const run = async (ctx: AppContext): Promise<void> => {
  startTelemetry();
  const server = buildServer(ctx);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  await shutdownTelemetry();
};
