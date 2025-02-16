import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EMAIL_FORMATTER_TOOL: Tool = {
  name: "email_formatter",
  description: "Format email content with various output formats and cleaning options",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "csv", "txt"],
        description: "Output format",
      },
      cleanHtml: {
        type: "boolean",
        description: "Clean HTML content",
      },
      removeUrls: {
        type: "boolean",
        description: "Remove URLs",
      },
      removeImages: {
        type: "boolean",
        description: "Remove image tags",
      },
      maxLength: {
        type: "number",
        description: "Maximum content length",
      },
    },
    required: ["format"],
  },
};

export interface EmailFormatterArgs {
  format: "json" | "csv" | "txt";
  cleanHtml?: boolean;
  removeUrls?: boolean;
  removeImages?: boolean;
  maxLength?: number;
}

export function isEmailFormatterArgs(args: unknown): args is EmailFormatterArgs {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const formatterArgs = args as EmailFormatterArgs;

  if (!["json", "csv", "txt"].includes(formatterArgs.format)) {
    return false;
  }

  if (formatterArgs.cleanHtml !== undefined && typeof formatterArgs.cleanHtml !== "boolean") {
    return false;
  }

  if (formatterArgs.removeUrls !== undefined && typeof formatterArgs.removeUrls !== "boolean") {
    return false;
  }

  if (formatterArgs.removeImages !== undefined && typeof formatterArgs.removeImages !== "boolean") {
    return false;
  }

  if (formatterArgs.maxLength !== undefined && typeof formatterArgs.maxLength !== "number") {
    return false;
  }

  return true;
}
