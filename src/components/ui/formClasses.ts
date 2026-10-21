/**
 * Class strings shared by the modal form field groups.
 *
 * The company and CRM modals draw fields as an inset card with an uppercase
 * label above the control. The two strings used to be retyped at every field,
 * so a spacing or colour tweak meant a sweep across eight files.
 */

/** Inset card that wraps one labelled control. */
export const FORM_FIELD_GROUP_CLASS = 'p-4 rounded-md neu-card-inset';

/** Uppercase caption above a control inside {@link FORM_FIELD_GROUP_CLASS}. */
export const FORM_FIELD_LABEL_CLASS =
  'text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block';

/** Full-width primary submit button of a form dialog. */
export const FORM_PRIMARY_BTN_CLASS =
  'w-full min-h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50';
