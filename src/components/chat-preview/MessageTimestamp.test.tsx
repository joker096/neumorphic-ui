import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageTimestamp } from './MessageTimestamp';

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string, fallback?: string) => fallback ?? k }) }));

const DAY_MS = 24 * 60 * 60 * 1000;

function renderAt(ts: number, overrides: Record<string, unknown> = {}, stealthMode = false) {
  return render(
    <MessageTimestamp
      msg={{ id: 1, time: '14:05', ts, type: '', silent: false, status: 'sent', ...overrides } as any}
      isMe={false}
      isDark={true}
      stealthMode={stealthMode}
      deliveryReceipts={false}
      readReceipts={false}
    />
  );
}

describe('MessageTimestamp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only the clock time for messages sent today', () => {
    renderAt(Date.now());
    expect(screen.getByText('14:05')).toBeInTheDocument();
    expect(screen.queryByText('Yesterday')).not.toBeInTheDocument();
  });

  it('prefixes a Yesterday label for messages sent the previous day', () => {
    renderAt(Date.now() - DAY_MS);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('14:05')).toBeInTheDocument();
  });

  it('prefixes the short date for older messages', () => {
    const ts = new Date();
    ts.setDate(ts.getDate() - 5);
    const { container } = renderAt(ts.getTime());
    const text = (container.textContent || '').trim();
    expect(text.endsWith('14:05')).toBe(true);
    expect(text).toBeTruthy();
    expect(text).not.toContain('Yesterday');
  });

  it('fuzzes the clock time in stealth mode', () => {
    renderAt(Date.now(), {}, true);
    expect(screen.getByText('14:01')).toBeInTheDocument();
  });

  it('renders delivery status icons for own messages', () => {
    const { container } = render(
      <MessageTimestamp
        msg={{ id: 1, time: '14:05', ts: Date.now(), type: '', silent: false, status: 'delivered' } as any}
        isMe={true}
        isDark={true}
        stealthMode={false}
        deliveryReceipts={true}
        readReceipts={true}
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});