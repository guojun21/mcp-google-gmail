import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EMAIL_READER_TOOL: Tool = {
  name: "email_reader",
  description: "Read specified number of emails with various filter conditions",
  inputSchema: {
    type: "object",
    properties: {
      maxResults: {
        type: "number",
        description: "Number of emails to read (default: 10)",
      },
      query: {
        type: "string",
        description: "Gmail query syntax, e.g., 'is:unread', 'newer_than:2d'",
      },
      format: {
        type: "string",
        enum: ["json", "csv", "txt"],
        description: "Output format",
      },
    },
    required: [],
  },
};

export interface EmailReaderArgs {
  maxResults?: number;
  query?: string;
  format?: "json" | "csv" | "txt";
}

export function isEmailReaderArgs(args: unknown): args is EmailReaderArgs {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const emailArgs = args as EmailReaderArgs;

  if (emailArgs.maxResults !== undefined && typeof emailArgs.maxResults !== "number") {
    return false;
  }

  if (emailArgs.query !== undefined && typeof emailArgs.query !== "string") {
    return false;
  }

  if (emailArgs.format !== undefined && !["json", "csv", "txt"].includes(emailArgs.format)) {
    return false;
  }

  return true;
}
