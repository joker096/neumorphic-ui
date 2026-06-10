// Ad Engine - Manage ads and ad placements

export interface Ad {
  id: string;
  placement: string;
  creative: string;
  targetAudience?: string;
  impressionUrl?: string;
}

export class AdEngine {
  private ads: Map<string, Ad> = new Map();
  private impressions: Map<string, number> = new Map();

  addAd(ad: Ad): void {
    this.ads.set(ad.id, ad);
  }

  removeAd(id: string): void {
    this.ads.delete(id);
  }

  selectAd(placement: string): Ad | null {
    const matchingAds = Array.from(this.ads.values()).filter((ad) => ad.placement === placement);
    if (matchingAds.length === 0) {
      return null;
    }
    return matchingAds[Math.floor(Math.random() * matchingAds.length)];
  }

  recordImpression(adId: string): void {
    this.impressions.set(adId, (this.impressions.get(adId) || 0) + 1);
  }

  getImpressions(adId: string): number {
    return this.impressions.get(adId) || 0;
  }

  getStats(): { totalAds: number; totalImpressions: number } {
    return {
      totalAds: this.ads.size,
      totalImpressions: Array.from(this.impressions.values()).reduce((a, b) => a + b, 0),
    };
  }
}

export const adEngine = new AdEngine();
