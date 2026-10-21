/**
 * Class strings shared by the landing page sections.
 *
 * The landing CTA buttons (hero, mid-page band and the two closing calls to
 * action) wrap their chevron in the same circular pill, so the size and the
 * hover travel live here instead of being retyped per section.
 */

/** Circular pill that carries the CTA chevron and slides on parent hover. */
export const CTA_ARROW_CLASS = 'w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5';

/** Heading of a feature card on the landing page. */
export const FEATURE_TITLE_CLASS = 'text-base font-bold mb-2 text-[var(--text-primary)]';

/** Gradient-filled text used for the accent words in the hero and section titles. */
export const GRADIENT_TEXT_CLASS = 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400';
