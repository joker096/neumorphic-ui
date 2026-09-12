import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ErrorSeverity,
  classifyError,
  logError,
  getErrorLog,
  clearErrorLog,
  subscribeToErrors,
  generateErrorId,
} from './errorHandling';

describe('errorHandling', () => {
  beforeEach(() => { clearErrorLog(); });

  it('generateErrorId returns unique ids', () => {
    expect(generateErrorId()).not.toBe(generateErrorId());
  });

  it('classifies network errors as MAJOR and retryable', () => {
    const rec = classifyError(new Error('network timeout'));
    expect(rec.severity).toBe(ErrorSeverity.MAJOR);
    expect(rec.retryable).toBe(true);
  });

  it('classifies crypto errors as CRITICAL and retryable', () => {
    const rec = classifyError(new Error('crypto encrypt failed'));
    expect(rec.severity).toBe(ErrorSeverity.CRITICAL);
    expect(rec.retryable).toBe(true);
  });

  it('classifies storage errors as CRITICAL', () => {
    const rec = classifyError(new Error('indexeddb storage error'));
    expect(rec.severity).toBe(ErrorSeverity.CRITICAL);
  });

  it('classifies render errors as MINOR', () => {
    const rec = classifyError(new Error('react component render failed'));
    expect(rec.severity).toBe(ErrorSeverity.MINOR);
  });

  it('classifies unknown errors as MINOR and non-retryable', () => {
    const rec = classifyError(new Error('something weird'));
    expect(rec.severity).toBe(ErrorSeverity.MINOR);
    expect(rec.retryable).toBe(false);
  });

  it('logError pushes to the log and notifies listeners', () => {
    const listener = vi.fn();
    const unsub = subscribeToErrors(listener);
    const rec = logError(new Error('network fail'));
    expect(getErrorLog()).toHaveLength(1);
    expect(listener).toHaveBeenCalled();
    expect(rec.context).toBeUndefined();
    unsub();
  });

  it('clearErrorLog empties the log', () => {
    logError(new Error('network fail'));
    clearErrorLog();
    expect(getErrorLog()).toHaveLength(0);
  });

  it('truncates long messages', () => {
    const rec = classifyError(new Error('x'.repeat(1000)));
    expect(rec.message.length).toBeLessThanOrEqual(500);
  });
});
