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

/** Large gradient call-to-action pill. */
export const CTA_PRIMARY_CLASS =
  'group relative overflow-hidden rounded-full px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]';

/** Compact gradient call-to-action pill used in the hero. */
export const CTA_SECONDARY_CLASS =
  'group relative overflow-hidden rounded-full px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]';

/** Small outlined pill used as a section label. */
export const LANDING_PILL_CLASS =
  'mx-auto mb-4 w-fit px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-medium border border-[var(--border-color)] text-[var(--text-secondary)]';

/** Hero headline of the landing page. */
export const HERO_TITLE_CLASS = 'text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] mb-6 text-[var(--text-primary)]';

/** Headline of the closing call-to-action band. */
export const CTA_SECTION_TITLE_CLASS = 'text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-[-0.02em] mb-4 text-[var(--text-primary)]';

/** Layout row of the landing footer. */
export const FOOTER_WRAP_CLASS = 'max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4';

/** Lead paragraph under the hero heading. */
export const HERO_LEAD_CLASS = 'text-lg max-w-xl leading-relaxed mb-10 text-[var(--text-secondary)]';

/** Footer column block. */
export const FOOTER_SECTION_CLASS = 'relative z-10 border-t px-6 py-8 border-[var(--border-color)]';

/** Small bold footer meta line. */
export const FOOTER_META_CLASS = 'text-xs font-bold tracking-tight text-[var(--text-secondary)]';

/** Centred hero column of the landing page. */
export const HERO_COLUMN_CLASS = 'flex flex-col items-center text-center max-w-3xl';

/** Lead paragraph of the closing call-to-action section. */
export const CTA_SECTION_LEAD_CLASS = 'text-lg mb-10 text-[var(--text-secondary)]';
