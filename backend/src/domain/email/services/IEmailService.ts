export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailService {
  send(input: SendEmailInput): Promise<void>;
  sendWelcome(email: string, username: string): Promise<void>;
  sendPasswordReset(email: string, resetToken: string): Promise<void>;
  sendNotification(email: string, message: string): Promise<void>;
}
