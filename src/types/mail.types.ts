export interface IMailProvider {
  connect(): Promise<void>;
  getEmails(query?: string, maxResults?: number): Promise<IEmail[]>;
  sendEmail(email: IEmailToSend): Promise<void>;
}

export interface IEmail {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  content: {
    text?: string;
    html?: string;
  };
  attachments: IAttachment[];
  date: Date;
  labels: string[];
  threadId?: string;
}

export interface IEmailToSend {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: {
    text?: string;
    html?: string;
  };
  attachments?: IAttachment[];
}

export interface IAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface IFormattedOutput {
  metadata: {
    id: string;
    threadId?: string;
    timestamp: string;
    labels: string[];
  };
  participants: {
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
  };
  content: {
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    attachments: {
      name: string;
      type: string;
      size: number;
    }[];
  };
  processingMetadata: {
    platform: string;
    processingTime: string;
    version: string;
  };
}
