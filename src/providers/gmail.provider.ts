import { OAuth2Client } from "google-auth-library";
import { gmail_v1, google } from "googleapis";
import { IAttachment, IEmail, IEmailToSend, IMailProvider } from "../types/mail.types";

export class GmailProvider implements IMailProvider {
  private auth: OAuth2Client;
  private gmail: gmail_v1.Gmail;

  constructor(credentials: { clientId: string; clientSecret: string; refreshToken: string }) {
    this.auth = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret);
    this.auth.setCredentials({
      refresh_token: credentials.refreshToken,
    });
    this.gmail = google.gmail({ version: "v1", auth: this.auth });
  }

  async connect(): Promise<void> {
    try {
      // Test connection
      await this.gmail.users.getProfile({ userId: "me" });
    } catch (error: any) {
      throw new Error(`Failed to connect to Gmail: ${error.message}`);
    }
  }

  async getEmails(query = "", maxResults = 10): Promise<IEmail[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: maxResults,
      });

      const emails: IEmail[] = [];
      for (const message of response.data.messages || []) {
        if (!message.id) continue;

        const fullMessage = await this.gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });

        if (!fullMessage.data) continue;

        const email = await this.parseGmailMessage(fullMessage.data);
        emails.push(email);
      }

      return emails;
    } catch (error: any) {
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }
  }

  async sendEmail(email: IEmailToSend): Promise<void> {
    try {
      const message = await this.createMimeMessage(email);
      await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: message,
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  private async parseGmailMessage(message: gmail_v1.Schema$Message): Promise<IEmail> {
    if (!message.id || !message.threadId || !message.payload) {
      throw new Error("Invalid message format");
    }

    const headers = message.payload.headers || [];
    const getHeader = (name: string) => {
      const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
      return header?.value || "";
    };

    const parts = this.flattenParts(message.payload);
    const attachments: IAttachment[] = [];
    let textContent = "";
    let htmlContent = "";

    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        try {
          const attachment = await this.getAttachment(message.id, part.body.attachmentId);
          if (attachment.data) {
            attachments.push({
              filename: part.filename,
              content: Buffer.from(attachment.data, "base64"),
              contentType: part.mimeType || "application/octet-stream",
            });
          }
        } catch (error) {
          console.warn(`Failed to get attachment ${part.filename}: ${error}`);
        }
      } else if (part.mimeType === "text/plain" && part.body?.data) {
        textContent = Buffer.from(part.body.data, "base64").toString();
      } else if (part.mimeType === "text/html" && part.body?.data) {
        htmlContent = Buffer.from(part.body.data, "base64").toString();
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader("subject"),
      from: getHeader("from"),
      to: getHeader("to")
        .split(",")
        .map((email: string) => email.trim()),
      cc: getHeader("cc")
        ? getHeader("cc")
            .split(",")
            .map((email: string) => email.trim())
        : [],
      bcc: [],
      content: {
        text: textContent,
        html: htmlContent,
      },
      attachments,
      date: new Date(parseInt(message.internalDate || "0")),
      labels: message.labelIds || [],
    };
  }

  private flattenParts(part?: gmail_v1.Schema$MessagePart): gmail_v1.Schema$MessagePart[] {
    if (!part) return [];

    const parts: gmail_v1.Schema$MessagePart[] = [];
    if (part.parts) {
      part.parts.forEach((p) => parts.push(...this.flattenParts(p)));
    }
    parts.push(part);
    return parts;
  }

  private async getAttachment(messageId: string, attachmentId: string): Promise<gmail_v1.Schema$MessagePartBody> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: attachmentId,
      });

      if (!response.data) {
        throw new Error("Failed to get attachment data");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get attachment: ${error.message}`);
    }
  }

  private async createMimeMessage(email: IEmailToSend): Promise<string> {
    const boundary = "boundary_" + Date.now().toString(16);
    const mimeContent: string[] = [];

    // Headers
    mimeContent.push("MIME-Version: 1.0");
    mimeContent.push(`To: ${email.to.join(", ")}`);
    if (email.cc?.length) mimeContent.push(`Cc: ${email.cc.join(", ")}`);
    if (email.bcc?.length) mimeContent.push(`Bcc: ${email.bcc.join(", ")}`);
    mimeContent.push(`Subject: ${email.subject}`);
    mimeContent.push(`Content-Type: multipart/mixed; boundary=${boundary}`);
    mimeContent.push("");

    // Text content
    if (email.content.text) {
      mimeContent.push(`--${boundary}`);
      mimeContent.push("Content-Type: text/plain; charset=UTF-8");
      mimeContent.push("");
      mimeContent.push(email.content.text);
    }

    // HTML content
    if (email.content.html) {
      mimeContent.push(`--${boundary}`);
      mimeContent.push("Content-Type: text/html; charset=UTF-8");
      mimeContent.push("");
      mimeContent.push(email.content.html);
    }

    // Attachments
    if (email.attachments) {
      for (const attachment of email.attachments) {
        mimeContent.push(`--${boundary}`);
        mimeContent.push(`Content-Type: ${attachment.contentType}`);
        mimeContent.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        mimeContent.push("Content-Transfer-Encoding: base64");
        mimeContent.push("");
        mimeContent.push(attachment.content.toString("base64"));
      }
    }

    mimeContent.push(`--${boundary}--`);

    return Buffer.from(mimeContent.join("\r\n")).toString("base64url");
  }
}
