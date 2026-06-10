// Premium Manager - Manage premium features

export interface PremiumConfig {
  plan: 'free' | 'basic' | 'premium' | 'ultimate';
  expiresAt?: number;
  features: string[];
}

export class PremiumManager {
  private config: PremiumConfig = {
    plan: 'free',
    expiresAt: undefined,
    features: [],
  };

  constructor(config?: Partial<PremiumConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  activate(config: Omit<PremiumConfig, 'plan'>): void {
    this.config = { ...this.config, plan: 'premium', ...config };
  }

  deactivate(): void {
    this.config = {
      plan: 'free',
      expiresAt: undefined,
      features: [],
    };
  }

  checkStatus(): PremiumConfig {
    // Check expiration
    if (this.config.expiresAt && Date.now() > this.config.expiresAt) {
      this.config.plan = 'free';
      this.config.expiresAt = undefined;
      this.config.features = [];
    }

    return this.config;
  }

  hasFeature(feature: string): boolean {
    return this.config.features.includes(feature) || this.config.plan === 'free';
  }

  getPlan(): string {
    return this.config.plan;
  }
}

export const premiumManager = new PremiumManager();
