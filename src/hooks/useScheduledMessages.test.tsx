import { describe, it, expect } from 'vitest';

describe('useScheduledMessages hook', () => {
  it('should be importable', async () => {
    const { useScheduledMessages } = await import('./useScheduledMessages');
    expect(typeof useScheduledMessages).toBe('function');
  });
});