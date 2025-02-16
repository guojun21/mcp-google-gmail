import { IFormattedOutput, IMailProvider } from "../types/mail.types";
import { MailParserService } from "./mail-parser.service";
import { OutputFormatterService } from "./output-formatter.service";

export class MailProcessingService {
  private mailParser: MailParserService;
  private outputFormatter: OutputFormatterService;

  constructor(private readonly mailProvider: IMailProvider, private readonly platform: string = "gmail") {
    this.mailParser = new MailParserService();
    this.outputFormatter = new OutputFormatterService();
  }

  async initialize(): Promise<void> {
    try {
      await this.mailProvider.connect();
    } catch (error: any) {
      throw new Error(`Failed to initialize mail processing service: ${error.message}`);
    }
  }

  async processEmails(query?: string, maxResults: number = 10): Promise<IFormattedOutput[]> {
    try {
      // Get emails
      const emails = await this.mailProvider.getEmails(query, maxResults);

      // Process each email
      const processedEmails = emails.map((email) => {
        // Parse email
        const parsedEmail = this.mailParser.parseEmail(email, this.platform);

        // Validate output
        const validation = this.outputFormatter.validateOutput(parsedEmail);
        if (!validation.isValid) {
          console.warn(`Validation warnings for email ${email.id}:`, validation.errors);
        }

        return parsedEmail;
      });

      return processedEmails;
    } catch (error: any) {
      throw new Error(`Failed to process emails: ${error.message}`);
    }
  }

  async getFormattedOutput(emails: IFormattedOutput[], format: "json" | "csv" | "txt" = "json"): Promise<string> {
    try {
      if (format === "json") {
        // For JSON format, return the complete array
        return JSON.stringify(emails, null, 2);
      } else {
        // For other formats, concatenate each email's output
        const outputs = await Promise.all(emails.map((email) => this.outputFormatter.exportToFormat(email, format)));
        return outputs.join("\n\n");
      }
    } catch (error: any) {
      throw new Error(`Failed to format output: ${error.message}`);
    }
  }

  async getLLMReadyOutput(emails: IFormattedOutput[]): Promise<string> {
    try {
      return emails.map((email) => this.outputFormatter.formatForLLM(email)).join("\n\n");
    } catch (error: any) {
      throw new Error(`Failed to prepare output for LLM: ${error.message}`);
    }
  }

  generateSummaries(emails: IFormattedOutput[]): string[] {
    return emails.map((email) => this.outputFormatter.generateSummary(email));
  }
}
