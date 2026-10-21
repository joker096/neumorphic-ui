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
