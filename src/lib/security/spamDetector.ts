// Spam Detector - Detects and blocks spam messages

export interface SpamReport {
  id: string;
  timestamp: number;
  source: string;
  reason: string;
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

const SPAM_THRESHOLD = 0.7;

const spamPatterns = [
  // URL patterns
  { pattern: /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, weight: 0.3 },
  // Repeated characters
  { pattern: /(.)\1{10,}/g, weight: 0.2 },
  // Spam keywords
  { pattern: /(click|buy|win|free|discount|offer|prize|congratulations)/gi, weight: 0.1 },
  // Phone number patterns
  { pattern: /\+?\d{10,}/g, weight: 0.15 },
  // Email patterns
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, weight: 0.1 },
];

export const spamDetector = {
  reports: [] as SpamReport[],

  checkSpam(data: string, options?: {
    thresholds?: {
      url?: number;
      repeated?: number;
      keywords?: number;
      phone?: number;
      email?: number;
    };
  }): { isSpam: boolean; score: number; reasons: string[] } {
    const score = this._calculateSpamScore(data);
    const reasons: string[] = [];

    if (score >= (options?.thresholds?.url || SPAM_THRESHOLD)) {
      reasons.push('High URL content');
    }
    if (score >= (options?.thresholds?.repeated || SPAM_THRESHOLD)) {
      reasons.push('Repeated character patterns');
    }
    if (score >= (options?.thresholds?.keywords || SPAM_THRESHOLD)) {
      reasons.push('Spam keywords detected');
    }
    if (score >= (options?.thresholds?.phone || SPAM_THRESHOLD)) {
      reasons.push('Phone number detected');
    }
    if (score >= (options?.thresholds?.email || SPAM_THRESHOLD)) {
      reasons.push('Email address detected');
    }

    const isSpam = score >= SPAM_THRESHOLD;

    if (isSpam) {
      this.reports.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        source: 'client-spam-detector',
        reason: reasons.join('; '),
        confidence: score,
        metadata: { reasons },
      });
    }

    return { isSpam, score, reasons };
  },

  _calculateSpamScore(data: string): number {
    let score = 0;

    // URL scoring
    const urlMatches = data.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (urlMatches) {
      score += Math.min(urlMatches.length * 0.3, 0.4);
    }

    // Repeated characters scoring
    const repeatedMatches = data.match(/(.)\1{10,}/g);
    if (repeatedMatches) {
      score += Math.min(repeatedMatches.length * 0.2, 0.2);
    }

    // Keyword scoring
    const keywordMatches = data.match(/(click|buy|win|free|discount|offer|prize|congratulations)/gi);
    if (keywordMatches) {
      score += Math.min(keywordMatches.length * 0.1, 0.2);
    }

    // Phone number scoring
    const phoneMatches = data.match(/\+?\d{10,}/g);
    if (phoneMatches) {
      score += Math.min(phoneMatches.length * 0.15, 0.15);
    }

    // Email scoring
    const emailMatches = data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches) {
      score += Math.min(emailMatches.length * 0.1, 0.1);
    }

    return Math.min(score, 1);
  },

  getMetrics(): { totalReports: number; recentReports: number; byReason: Record<string, number> } {
    const totalReports = this.reports.length;
    const recentReports = this.reports.filter((r) => Date.now() - r.timestamp < 3600000).length; // Last hour
    const byReason = {} as Record<string, number>;

    for (const report of this.reports) {
      byReason[report.reason] = (byReason[report.reason] || 0) + 1;
    }

    return { totalReports, recentReports, byReason };
  },

  clearReports(): void {
    this.reports = [];
  },
};
