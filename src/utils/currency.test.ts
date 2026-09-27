import { describe, it, expect, beforeEach } from 'vitest';
import { formatCurrency, resetCurrencyFormatterCache } from './currency';

describe('formatCurrency', () => {
  beforeEach(() => resetCurrencyFormatterCache());

  it('matches the plain Intl call it replaces', () => {
    expect(formatCurrency(100, 'RUB', 'en-US', 0)).toBe(
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(100),
    );
    expect(formatCurrency(1234.5, 'USD', 'en-US', 2)).toBe(
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(1234.5),
    );
  });

  it('follows the UI locale instead of a hardcoded one', () => {
    const en = formatCurrency(1000, 'RUB', 'en-US', 0);
    const ru = formatCurrency(1000, 'RUB', 'ru-RU', 0);
    expect(en).not.toBe(ru);
    expect(ru).toContain('1\u00a0000');
  });

  it('degrades instead of throwing on an imported garbage currency code', () => {
    // `new Intl.NumberFormat('en', { style: 'currency', currency: 'RU' })` throws RangeError.
    expect(() => formatCurrency(100, 'RU', 'en-US')).not.toThrow();
    expect(() => formatCurrency(100, '', 'en-US')).not.toThrow();
    expect(() => formatCurrency(100, undefined, 'en-US')).not.toThrow();
    expect(formatCurrency(100, 'RU', 'en-US', 0)).toBe('100');
    expect(formatCurrency(100, '', 'en-US', 0)).toBe('100');
  });

  it('renders nothing for a non-finite amount', () => {
    expect(formatCurrency(Number.NaN, 'RUB', 'en-US')).toBe('');
    expect(formatCurrency(Number.POSITIVE_INFINITY, 'RUB', 'en-US')).toBe('');
    expect(formatCurrency('100' as unknown as number, 'RUB', 'en-US')).toBe('');
  });

  it('reuses one formatter per locale/currency/digits triple', () => {
    const Original = Intl.NumberFormat;
    const built: Intl.NumberFormatOptions[] = [];
    // Constructor wrapper (not `vi.spyOn`, which strips the prototype under `new`).
    (Intl as unknown as { NumberFormat: unknown }).NumberFormat = function patched(locales?: unknown, opts?: unknown) {
      built.push((opts ?? {}) as Intl.NumberFormatOptions);
      return new Original(locales as string | undefined, opts as Intl.NumberFormatOptions);
    } as unknown as typeof Intl.NumberFormat;
    try {
      formatCurrency(1, 'RUB', 'en-US', 0);
      formatCurrency(2, 'RUB', 'en-US', 0);
      formatCurrency(3, 'RUB', 'en-US', 2);
      formatCurrency(4, 'USD', 'en-US', 0);
    } finally {
      (Intl as unknown as { NumberFormat: unknown }).NumberFormat = Original;
    }
    // 4 renders → 3 distinct triples (RUB/0 twice, RUB/2, USD/0).
    expect(built.filter((o) => o.style === 'currency')).toHaveLength(3);
  });
});
