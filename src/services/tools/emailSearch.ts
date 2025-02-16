import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EMAIL_SEARCH_TOOL: Tool = {
  name: "email_search",
  description: "Search emails using advanced search conditions",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Gmail advanced search syntax",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results",
      },
      includeAttachments: {
        type: "boolean",
        description: "Include attachment information",
      },
      format: {
        type: "string",
        enum: ["json", "csv", "txt"],
        description: "Output format",
      },
    },
    required: ["query"],
  },
};

export interface EmailSearchArgs {
  query: string;
  maxResults?: number;
  includeAttachments?: boolean;
  format?: "json" | "csv" | "txt";
}

export function isEmailSearchArgs(args: unknown): args is EmailSearchArgs {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const searchArgs = args as EmailSearchArgs;

  if (typeof searchArgs.query !== "string") {
    return false;
  }

  if (searchArgs.maxResults !== undefined && typeof searchArgs.maxResults !== "number") {
    return false;
  }

  if (searchArgs.includeAttachments !== undefined && typeof searchArgs.includeAttachments !== "boolean") {
    return false;
  }

  if (searchArgs.format !== undefined && !["json", "csv", "txt"].includes(searchArgs.format)) {
    return false;
  }

  return true;
}
