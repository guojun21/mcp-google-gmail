import { IEmail, IFormattedOutput } from "../types/mail.types";

export class MailParserService {
  parseEmail(email: IEmail, platform: string = "gmail"): IFormattedOutput {
    try {
      // Clean email content
      const cleanedText = email.content.text ? this.sanitizeContent(email.content.text) : undefined;
      const cleanedHtml = email.content.html ? this.sanitizeHtmlContent(email.content.html) : undefined;

      return {
        metadata: {
          id: email.id,
          threadId: email.threadId,
          timestamp: email.date.toISOString(),
          labels: email.labels,
        },
        participants: {
          from: email.from,
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
        },
        content: {
          subject: email.subject,
          bodyText: cleanedText,
          bodyHtml: cleanedHtml,
          attachments: email.attachments.map((attachment) => ({
            name: attachment.filename,
            type: attachment.contentType,
            size: attachment.content.length,
          })),
        },
        processingMetadata: {
          platform,
          processingTime: new Date().toISOString(),
          version: "1.0.0",
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to parse email: ${error.message}`);
    }
  }

  sanitizeContent(content: string): string {
    return content
      .replace(/\s+/g, " ") // Merge multiple whitespaces
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/\[image:.*?\]/g, "") // Remove image tags
      .replace(/\[cid:.*?\]/g, "") // Remove content ID tags
      .replace(/\b(https?:\/\/[^\s]+)/g, "") // Remove URLs
      .replace(/\s+/g, " ") // Merge possible extra whitespaces again
      .trim();
  }

  sanitizeHtmlContent(htmlContent: string): string {
    // Remove HTML tags, keep text only
    let text = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove style tags and content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove script tags and content
      .replace(/<[^>]+>/g, " ") // Remove all HTML tags
      .replace(/&nbsp;/g, " ") // Convert HTML entities
      .replace(/&[a-z]+;/g, "") // Remove other HTML entities
      .replace(/\s+/g, " "); // Merge multiple whitespaces

    // Use normal text cleaning
    return this.sanitizeContent(text);
  }

  extractNameFromEmail(email: string): string {
    const match = email.match(/^"?([^"<]+)"?\s*<?[^>]*>?$/);
    return match ? match[1].trim() : email;
  }

  categorizeAttachments(attachments: IFormattedOutput["content"]["attachments"]): {
    documents: typeof attachments;
    images: typeof attachments;
    others: typeof attachments;
  } {
    return {
      documents: attachments.filter((att) => att.type.includes("pdf") || att.type.includes("document") || att.type.includes("spreadsheet")),
      images: attachments.filter((att) => att.type.includes("image")),
      others: attachments.filter((att) => !att.type.includes("pdf") && !att.type.includes("document") && !att.type.includes("spreadsheet") && !att.type.includes("image")),
    };
  }
}
