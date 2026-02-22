import type {
  ISpamDetector,
  SpamAnalysisResult,
  SpamChecks,
} from "../../../domain/antibot";

export class SpamDetector implements ISpamDetector {
  private readonly urlPattern =
    /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/gi;
  private readonly repetitionPattern = /(.)\1{4,}/g;
  private readonly capsPattern = /[A-Z]{5,}/g;
  private readonly emojiPattern = /[\u{1F300}-\u{1F9FF}]{5,}/gu;

  private readonly spamKeywords = new Set([
    "buy now",
    "click here",
    "free money",
    "earn $",
    "работа на дому",
    "заработок",
    "казино",
    "ставки",
    "бесплатно",
    "акция",
    "скидка 90%",
    "только сегодня",
  ]);

  analyze(content: string): SpamAnalysisResult {
    const checks: SpamChecks = {
      urlDensity: this.checkUrlDensity(content),
      repetition: this.checkRepetition(content),
      capsLock: this.checkCapsLock(content),
      emojiSpam: this.checkEmojiSpam(content),
      keywords: this.checkSpamKeywords(content),
      entropy: this.checkEntropy(content),
    };

    const score = this.calculateSpamScore(checks);

    return {
      isSpam: score > 0.7,
      score,
      checks,
    };
  }

  async checkSimilarity(
    content: string,
    recentPosts: string[]
  ): Promise<number> {
    if (recentPosts.length === 0) return 0;

    let maxSimilarity = 0;
    for (const post of recentPosts) {
      const similarity = this.calculateJaccardSimilarity(content, post);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  private checkUrlDensity(content: string): number {
    const urls = content.match(this.urlPattern) || [];
    const words = content.split(/\s+/).length;
    const density = urls.length / Math.max(1, words);

    return Math.min(1, density * 10);
  }

  private checkRepetition(content: string): number {
    const matches = content.match(this.repetitionPattern) || [];
    return Math.min(1, matches.length * 0.3);
  }

  private checkCapsLock(content: string): number {
    const matches = content.match(this.capsPattern) || [];
    const words = content.split(/\s+/).length;
    return Math.min(1, (matches.length / Math.max(1, words)) * 2);
  }

  private checkEmojiSpam(content: string): number {
    const matches = content.match(this.emojiPattern) || [];
    return Math.min(1, matches.length * 0.5);
  }

  private checkSpamKeywords(content: string): number {
    const lowerContent = content.toLowerCase();
    let count = 0;

    for (const keyword of this.spamKeywords) {
      if (lowerContent.includes(keyword)) {
        count++;
      }
    }

    return Math.min(1, count * 0.3);
  }

  private checkEntropy(content: string): number {
    if (content.length === 0) return 0;

    const freq: Record<string, number> = {};
    for (const char of content) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = content.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy < 3 ? (3 - entropy) / 3 : 0;
  }

  private calculateSpamScore(checks: SpamChecks): number {
    const weights = {
      urlDensity: 0.25,
      repetition: 0.15,
      capsLock: 0.1,
      emojiSpam: 0.1,
      keywords: 0.25,
      entropy: 0.15,
    };

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
      score += checks[key as keyof SpamChecks] * weight;
    }

    return score;
  }

  private calculateJaccardSimilarity(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));

    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }
}
