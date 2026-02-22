export interface SpamChecks {
  urlDensity: number;
  repetition: number;
  capsLock: number;
  emojiSpam: number;
  keywords: number;
  entropy: number;
}

export interface SpamAnalysisResult {
  isSpam: boolean;
  score: number;
  checks: SpamChecks;
}

export interface ISpamDetector {
  analyze(content: string): SpamAnalysisResult;
  checkSimilarity(content: string, recentPosts: string[]): Promise<number>;
}
