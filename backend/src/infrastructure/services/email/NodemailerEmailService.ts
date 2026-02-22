import type { IEmailService, SendEmailInput } from "../../../domain/email";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class NodemailerEmailService implements IEmailService {
  private config: EmailConfig;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === "true";
    this.config = {
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
      },
      from: process.env.SMTP_FROM ?? "noreply@example.com",
    };
  }

  async send(input: SendEmailInput): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    });

    await transporter.sendMail({
      from: this.config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html.replace(/<[^>]*>/g, ""),
    });
  }

  async sendWelcome(email: string, username: string): Promise<void> {
    const subject = "Welcome to Twitter Clone!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1da1f2;">Welcome, @${username}!</h1>
        <p>Thank you for joining Twitter Clone. We're excited to have you!</p>
        <p>Here are some things you can do to get started:</p>
        <ul>
          <li>Complete your profile by adding a bio and profile picture</li>
          <li>Follow other users to see their posts in your feed</li>
          <li>Create your first post and share your thoughts</li>
        </ul>
        <p>Happy posting!</p>
        <p style="color: #657786; font-size: 12px;">
          This email was sent from Twitter Clone. If you didn't create an account, please ignore this email.
        </p>
      </div>
    `;

    await this.send({ to: email, subject, html });
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/reset-password?token=${resetToken}`;
    const subject = "Password Reset Request";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1da1f2;">Password Reset</h1>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #1da1f2; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 25px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #1da1f2;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p style="color: #657786; font-size: 12px;">
          If you didn't request a password reset, please ignore this email or contact support.
        </p>
      </div>
    `;

    await this.send({ to: email, subject, html });
  }

  async sendNotification(email: string, message: string): Promise<void> {
    const subject = "New Activity on Twitter Clone";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1da1f2;">New Activity</h1>
        <p>${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL ?? "http://localhost:3000"}"
             style="background-color: #1da1f2; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 25px; font-weight: bold;">
            View on Twitter Clone
          </a>
        </div>
        <p style="color: #657786; font-size: 12px;">
          You received this because you have notifications enabled.
          Update your notification settings to change this.
        </p>
      </div>
    `;

    await this.send({ to: email, subject, html });
  }
}
