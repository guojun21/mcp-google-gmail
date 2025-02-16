#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { config } from "dotenv";
import { GmailProvider } from "./providers/gmail.provider";
import { MailProcessingService } from "./services/mail-processing.service";
import { isEmailFormatterArgs, isEmailReaderArgs, isEmailSearchArgs, tools } from "./services/tools/_index";

// Load environment variables
config();

// Initialize mail processing service
const gmailProvider = new GmailProvider({
  clientId: process.env.GMAIL_CLIENT_ID!,
  clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
});

const mailProcessor = new MailProcessingService(gmailProvider);

// Initialize MCP Server
const server = new Server(
  {
    name: "map-mail",
    version: "1.0.0",
  },
  {
    capabilities: {
      description: "A MCP server providing Gmail integration with LLM processing capabilities",
      resources: {},
      tools: {},
    },
  }
);

// Handle tool list request
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool invocation
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    if (name === "email_reader") {
      if (!isEmailReaderArgs(args)) {
        throw new Error("Invalid arguments for email_reader");
      }

      const emails = await mailProcessor.processEmails(args.query as string, args.maxResults as number);
      const output = await mailProcessor.getFormattedOutput(emails, args.format as "json" | "csv" | "txt");

      return {
        content: [{ type: "text", text: output }],
        isError: false,
      };
    }

    if (name === "email_search") {
      if (!isEmailSearchArgs(args)) {
        throw new Error("Invalid arguments for email_search");
      }

      const emails = await mailProcessor.processEmails(args.query, args.maxResults);
      const output = await mailProcessor.getFormattedOutput(emails, args.format || "json");

      return {
        content: [{ type: "text", text: output }],
        isError: false,
      };
    }

    if (name === "email_formatter") {
      if (!isEmailFormatterArgs(args)) {
        throw new Error("Invalid arguments for email_formatter");
      }

      const emails = await mailProcessor.processEmails();
      let output = await mailProcessor.getFormattedOutput(emails, args.format);

      if (args.maxLength) {
        output = output.slice(0, args.maxLength);
      }

      return {
        content: [{ type: "text", text: output }],
        isError: false,
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Handle resource list request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  await mailProcessor.initialize();

  return {
    resources: [
      {
        uri: "gmail://recent",
        name: "Recent Emails",
        description: "Recent emails (default 10)",
        mimeType: "application/json",
      },
      {
        uri: "gmail://unread",
        name: "Unread Emails",
        description: "Unread emails",
        mimeType: "application/json",
      },
      {
        uri: "gmail://important",
        name: "Important Emails",
        description: "Important emails",
        mimeType: "application/json",
      },
    ],
  };
});

// Handle resource read request
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  try {
    let query = "";
    let maxResults = 10;

    switch (request.params.uri) {
      case "gmail://recent":
        query = "newer_than:2d";
        break;
      case "gmail://unread":
        query = "is:unread";
        break;
      case "gmail://important":
        query = "is:important";
        break;
      default:
        throw new Error("Resource not found");
    }

    const emails = await mailProcessor.processEmails(query, maxResults);
    const llmOutput = await mailProcessor.getLLMReadyOutput(emails);

    return {
      contents: [
        {
          uri: request.params.uri,
          text: llmOutput,
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to read resource: ${error.message}`);
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('{"jsonrpc": "2.0", "method": "log", "params": { "message": "Map-Mail MCP Server is running..." }}');
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
