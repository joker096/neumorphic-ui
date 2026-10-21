/**
 * Spinner class strings shared by loading indicators.
 *
 * Class strings rather than components: each call site keeps its own element
 * (a `span` or `div`) and only the indicator geometry is common.
 */

/** Small inline spinner shown while a file or attachment is loading. */
export const SMALL_SPINNER_CLASS = 'shrink-0 w-5 h-5 border-2 rounded-full animate-spin border-t-transparent border-[var(--text-tertiary)]';

/** Larger spinner used inside the QR and sharing panels. */
export const QR_SPINNER_CLASS = 'w-10 h-10 rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent animate-spin';
