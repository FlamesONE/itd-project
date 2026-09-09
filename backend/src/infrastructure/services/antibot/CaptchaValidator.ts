import type { ICaptchaValidator, CaptchaResult } from "../../../domain/antibot";

interface HCaptchaConfig {
  secretKey: string;
  siteKey: string;
  enabled: boolean;
}

export class CaptchaValidator implements ICaptchaValidator {
  private readonly config: HCaptchaConfig;

  constructor(config?: Partial<HCaptchaConfig>) {
    this.config = {
      secretKey: config?.secretKey || process.env.HCAPTCHA_SECRET_KEY || "",
      siteKey: config?.siteKey || process.env.HCAPTCHA_SITE_KEY || "",
      enabled: config?.enabled ?? process.env.HCAPTCHA_ENABLED === "true",
    };
  }

  async validate(token: string, remoteIp: string): Promise<CaptchaResult> {

    if (!this.config.enabled || !this.config.secretKey) {
      return {
        success: true,
        score: 1,
      };
    }

    try {
      const response = await fetch("https://api.hcaptcha.com/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: this.config.secretKey,
          response: token,
          remoteip: remoteIp,
        }),
      });

      const data = await response.json();

      return {
        success: data.success,
        score: data.score || (data.success ? 1 : 0),
        challengeTimestamp: data.challenge_ts,
        errorCodes: data["error-codes"],
      };
    } catch (error) {
      console.error("CAPTCHA validation error:", error);

      return {
        success: true,
        score: 0.5,
        errorCodes: ["validation-error"],
      };
    }
  }
}
