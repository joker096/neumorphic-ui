interface SpamConfig {
  maxRepeatedChars: number;
  maxCapsRatio: number;
  maxLinksPerMessage: number;
  maxMentionsPerMessage: number;
  blockedPatterns: RegExp[];
}

const DEFAULT_CONFIG: SpamConfig = {
  maxRepeatedChars: 8,
  maxCapsRatio: 0.7,
  maxLinksPerMessage: 3,
  maxMentionsPerMessage: 5,
  blockedPatterns: [
    /(buy|sell|cheap|free|click here|limited|offer|promo|win|prize|crypto|bitcoin|eth)\s*(now|today|!!)/i,
    /https?:\/\/(?:bit\.ly|tinyurl|shorturl|shorte)\.[a-z]+\/\w+/i,
  ],
};

export class SpamDetector {
  private config: SpamConfig;

  constructor(config: Partial<SpamConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  analyze(text: string): { isSpam: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (this.hasRepeatedChars(text)) {
      reasons.push('Too many repeated characters');
    }

    if (this.hasHighCapsRatio(text)) {
      reasons.push('Message is mostly uppercase');
    }

    const linkCount = this.countLinks(text);
    if (linkCount > this.config.maxLinksPerMessage) {
      reasons.push(`Too many links (${linkCount})`);
    }

    const mentionCount = this.countMentions(text);
    if (mentionCount > this.config.maxMentionsPerMessage) {
      reasons.push(`Too many mentions (${mentionCount})`);
    }

    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(text)) {
        reasons.push('Matches blocked spam pattern');
        break;
      }
    }

    return {
      isSpam: reasons.length > 0,
      reasons,
    };
  }

  private hasRepeatedChars(text: string): boolean {
    const pattern = new RegExp(`(.)\\1{${this.config.maxRepeatedChars},}`);
    return pattern.test(text);
  }

  private hasHighCapsRatio(text: string): boolean {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 10) return false;
    const caps = letters.replace(/[a-z]/g, '').length;
    return caps / letters.length > this.config.maxCapsRatio;
  }

  private countLinks(text: string): number {
    const matches = text.match(/https?:\/\/[^\s]+/gi);
    return matches ? matches.length : 0;
  }

  private countMentions(text: string): number {
    const matches = text.match(/@\w+/g);
    return matches ? matches.length : 0;
  }
}
