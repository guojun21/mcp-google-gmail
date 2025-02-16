import { IFormattedOutput } from "../types/mail.types";

export class OutputFormatterService {
  formatForLLM(output: IFormattedOutput): string {
    try {
      return JSON.stringify(this.preprocessForLLM(output), null, 2);
    } catch (error: any) {
      throw new Error(`Failed to format output for LLM: ${error.message}`);
    }
  }

  private preprocessForLLM(output: IFormattedOutput): any {
    const { metadata, participants, content, processingMetadata } = output;

    // Remove unnecessary HTML content (if plain text exists)
    if (content.bodyText && content.bodyHtml) {
      delete content.bodyHtml;
    }

    // Format timestamp
    const timestamp = new Date(metadata.timestamp);
    const formattedDate = timestamp.toLocaleString();

    return {
      ...output,
      metadata: {
        ...metadata,
        timestamp: formattedDate,
      },
      participants: {
        ...participants,
        // Remove empty recipient lists
        ...(participants.cc?.length ? { cc: participants.cc } : {}),
        ...(participants.bcc?.length ? { bcc: participants.bcc } : {}),
      },
      content: {
        ...content,
        // Remove attachment field if empty
        ...(content.attachments.length ? { attachments: content.attachments } : {}),
      },
    };
  }

  validateOutput(output: IFormattedOutput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!output.metadata.id) errors.push("Missing email ID");
    if (!output.metadata.timestamp) errors.push("Missing timestamp");
    if (!output.participants.from) errors.push("Missing sender information");
    if (!output.participants.to || output.participants.to.length === 0) {
      errors.push("Missing recipient information");
    }
    if (!output.content.subject) errors.push("Missing subject");
    if (!output.content.bodyText && !output.content.bodyHtml) {
      errors.push("Missing email content");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  generateSummary(output: IFormattedOutput): string {
    const { metadata, participants, content } = output;
    const timestamp = new Date(metadata.timestamp);

    return `
Email Summary:
-------------
Date: ${timestamp.toLocaleString()}
From: ${participants.from}
To: ${participants.to.join(", ")}
${participants.cc?.length ? `CC: ${participants.cc.join(", ")}\n` : ""}
Subject: ${content.subject}

Attachments: ${content.attachments.length ? content.attachments.map((a) => a.name).join(", ") : "None"}

Labels: ${metadata.labels.join(", ") || "None"}
        `.trim();
  }

  async exportToFormat(output: IFormattedOutput, format: "json" | "csv" | "txt"): Promise<string> {
    switch (format) {
      case "json":
        return JSON.stringify(output, null, 2);

      case "csv":
        return this.convertToCSV(output);

      case "txt":
        return this.generateSummary(output);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private convertToCSV(output: IFormattedOutput): string {
    const headers = ["ID", "Timestamp", "From", "To", "Subject", "Content", "Attachments", "Labels"];

    const row = [output.metadata.id, output.metadata.timestamp, output.participants.from, output.participants.to.join(";"), output.content.subject, (output.content.bodyText || "").replace(/[\n\r,]/g, " "), output.content.attachments.map((a) => a.name).join(";"), output.metadata.labels.join(";")];

    return [headers.join(","), row.map((field) => `"${field}"`).join(",")].join("\n");
  }
}
