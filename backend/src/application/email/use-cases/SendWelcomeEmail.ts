import { Result } from "../../../domain/shared/Result";
import type { IEmailService } from "../../../domain/email";

export interface SendWelcomeEmailInput {
  email: string;
  username: string;
}

export class SendWelcomeEmail {
  constructor(private readonly emailService: IEmailService) {}

  async execute(input: SendWelcomeEmailInput): Promise<Result<void>> {
    try {
      await this.emailService.sendWelcome(input.email, input.username);
      return Result.ok(undefined);
    } catch (error) {
      console.error("Failed to send welcome email:", error);

      return Result.ok(undefined);
    }
  }
}
