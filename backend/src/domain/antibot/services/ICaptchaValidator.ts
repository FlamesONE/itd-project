export interface CaptchaResult {
  success: boolean;
  score: number;
  challengeTimestamp?: string;
  errorCodes?: string[];
}

export interface ICaptchaValidator {
  validate(token: string, remoteIp: string): Promise<CaptchaResult>;
}
