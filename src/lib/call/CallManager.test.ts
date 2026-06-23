import { describe, it, expect } from 'vitest';
import { registerRiskSession, getLastActionDebugId } from '../../utils/riskShell';

describe('utils/riskShell', () => {
  it('registers debug session and rejects duplicates', () => {
    registerRiskSession('contact-1', 'debug-abc');
    expect(getLastActionDebugId('contact-1')).toBe('debug-abc');
  });

  it('tracks last session per contactId', () => {
    registerRiskSession('contact-2', 'debug-first');
    registerRiskSession('contact-1', 'debug-2nd');
    expect(getLastActionDebugId('contact-1')).toBe('debug-2nd');
    expect(getLastActionDebugId('contact-2')).toBe('debug-first');
  });
});
