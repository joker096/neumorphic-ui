import { describe, it, expect } from 'vitest';
import { FREE_REACTION_EMOJIS, PREMIUM_REACTION_EMOJIS, getAvailableReactionEmojis } from './reactions';

describe('reaction gating', () => {
  it('free tier gets 6 base emojis', () => {
    expect(getAvailableReactionEmojis(false)).toHaveLength(6);
  });

  it('premium tier gets 18 emojis', () => {
    expect(getAvailableReactionEmojis(true)).toHaveLength(18);
  });

  it('premium adds 12 extended emojis on top of the free set', () => {
    expect(PREMIUM_REACTION_EMOJIS).toHaveLength(12);
    const all = getAvailableReactionEmojis(true);
    for (const emoji of FREE_REACTION_EMOJIS) {
      expect(all).toContain(emoji);
    }
  });

  it('free set and premium-only set do not overlap', () => {
    expect(FREE_REACTION_EMOJIS.filter(e => PREMIUM_REACTION_EMOJIS.includes(e))).toHaveLength(0);
  });
});
