/**
 * Locale-aware money formatting.
 *
 * House rule: money is rendered through ONE cached `Intl.NumberFormat` per
 * `locale | currency | digits` triple. Building a formatter per amount per
 * render (the CRM board formats every deal card on every drag/hover state
 * change) is the expensive part — the construction, not the `format` call.
 *
 * Two fail-soft guarantees, because both inputs are untrusted:
 * - **currency** comes from imported CRM records (AmoCRM/Bitrix) or user
 *   settings. `new Intl.NumberFormat(..., { currency: 'RU' })` throws
 *   `RangeError: Invalid currency code`, which used to blank the whole deals
 *   board on a malformed import. An unusable code degrades to a plain grouped
 *   number instead of inventing a currency label.
 * - **amount** may be `NaN`/`Infinity` from a bad parse; output is `''`.
 */
const CURRENCY_CACHE = new Map<string, Intl.NumberFormat>();
const DECIMAL_CACHE = new Map<string, Intl.NumberFormat>();

const CURRENCY_CODE = /^[A-Za-z]{3}$/;

function numberFormat(locale: string | undefined, digits: number): Intl.NumberFormat {
  const key = `${locale ?? ''}|${digits}`;
  let fmt = DECIMAL_CACHE.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    } catch {
      fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }
    DECIMAL_CACHE.set(key, fmt);
  }
  return fmt;
}

/**
 * @param amount    Value to render; non-finite input yields `''`.
 * @param currency  ISO-4217 code (`'RUB'`, `'USD'`). Anything else is ignored.
 * @param locale    UI language (`useI18n().lang`); `undefined` = runtime default.
 * @param fractionDigits  Fraction digits to render (CRM cards use 0, wallets 2).
 */
export function formatCurrency(
  amount: number,
  currency: string | undefined | null,
  locale?: string,
  fractionDigits = 0,
): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
  const digits = Number.isInteger(fractionDigits) && fractionDigits >= 0 && fractionDigits <= 20 ? fractionDigits : 0;
  const code = typeof currency === 'string' && CURRENCY_CODE.test(currency.trim())
    ? currency.trim().toUpperCase()
    : '';
  if (!code) return numberFormat(locale, digits).format(amount);

  const key = `${locale ?? ''}|${code}|${digits}`;
  let fmt = CURRENCY_CACHE.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: digits });
    } catch {
      return numberFormat(locale, digits).format(amount);
    }
    CURRENCY_CACHE.set(key, fmt);
  }
  return fmt.format(amount);
}

/** Test-only: drops the memoized formatters so a suite can assert construction counts. */
export function resetCurrencyFormatterCache(): void {
  CURRENCY_CACHE.clear();
  DECIMAL_CACHE.clear();
}
