import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GeoMessageCard } from './GeoMessageCard';
import { formatCountdown } from '../../constants/liveLocation';

const t = (key: string, fallback?: string | Record<string, string | number>) => {
  if (typeof fallback === 'string') return fallback;
  const f = String(fallback ?? key);
  return f.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    String((fallback as Record<string, string | number>)?.[k] ?? ''),
  );
};

const liveMsg = (over: Record<string, unknown> = {}) => ({
  type: 'location',
  lat: 55.7558,
  lng: 37.6173,
  isLive: true,
  expiresAt: Date.now() + 5 * 60_000,
  approximate: false,
  ...over,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('formatCountdown', () => {
  it('renders M:SS and widens to H:MM:SS past an hour', () => {
    expect(formatCountdown(5 * 60_000)).toBe('5:00');
    expect(formatCountdown(65_000)).toBe('1:05');
    expect(formatCountdown(60 * 60_000)).toBe('1:00:00');
    expect(formatCountdown(8 * 60 * 60_000)).toBe('8:00:00');
  });

  it('never renders a negative or non-finite remaining time', () => {
    expect(formatCountdown(-1)).toBe('0:00');
    expect(formatCountdown(NaN)).toBe('0:00');
    expect(formatCountdown(Infinity)).toBe('0:00');
  });
});

describe('GeoMessageCard', () => {
  it('shows a live badge and countdown while the share is running', () => {
    render(<GeoMessageCard msg={liveMsg()} t={t} />);
    expect(screen.getByText(/Live location/)).toBeTruthy();
    expect(screen.getByText(/4:5\d|5:00/)).toBeTruthy();
  });

  // The sender can vanish without a stop frame. A card that trusted the flag
  // would claim to be live forever, so the deadline is the only authority.
  it('demotes to a plain pin once the deadline passes, with no stop frame', () => {
    vi.useFakeTimers();
    render(<GeoMessageCard msg={liveMsg({ expiresAt: Date.now() + 2_000 })} t={t} />);
    expect(screen.getByText(/Live location/)).toBeTruthy();

    act(() => { vi.advanceTimersByTime(3_000); });

    expect(screen.queryByText(/Live location ·/)).toBeNull();
    expect(screen.getByText('Live location ended')).toBeTruthy();
  });

  it('treats a live flag without a usable deadline as expired', () => {
    render(<GeoMessageCard msg={liveMsg({ expiresAt: undefined })} t={t} />);
    expect(screen.getByText('Live location ended')).toBeTruthy();
  });

  it('renders a one-off pin with no live or expiry wording', () => {
    render(<GeoMessageCard msg={{ type: 'location', lat: 1, lng: 2 }} t={t} />);
    expect(screen.getByText('1.00000, 2.00000')).toBeTruthy();
    expect(screen.queryByText('Live location ended')).toBeNull();
  });

  it('marks an approximate share so the reduced precision is not implied exact', () => {
    render(<GeoMessageCard msg={liveMsg({ approximate: true })} t={t} />);
    expect(screen.getByText('Approximate location')).toBeTruthy();
  });

  it('renders nothing for non-finite coordinates', () => {
    const { container } = render(<GeoMessageCard msg={{ type: 'location', lat: NaN, lng: 1 }} t={t} />);
    expect(container.firstChild).toBeNull();
  });
});
