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

/**
 * Base class of a text control that sits directly in a form field: input,
 * select or textarea. Call sites append their own type scale (` text-sm`,
 * ` text-xs`) so the sizing stays explicit instead of inherited.
 */
export const FORM_FIELD_CONTROL_CLASS = 'w-full min-h-11 px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)]';

const ICON_BTN_BASE =
  'w-9 h-9 min-w-11 min-h-11 rounded-xl flex items-center justify-center';
const ICON_BTN_PRIMARY_LOOK =
  'text-xs font-bold cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110';
const ICON_BTN_DANGER_LOOK =
  'font-bold text-sm cursor-pointer transition-all bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-110';

/** Square primary button that adds a row in the company lists. */
export const FORM_ICON_ADD_BTN_CLASS = `${ICON_BTN_BASE} ${ICON_BTN_PRIMARY_LOOK}`;

/** Same button with the inline icon gap used by the list headers. */
export const FORM_ICON_ADD_BTN_GAPPED_CLASS = `${ICON_BTN_BASE} gap-1.5 ${ICON_BTN_PRIMARY_LOOK}`;

/** Square destructive button of the row-level remove actions. */
export const FORM_ICON_DANGER_BTN_CLASS = `${ICON_BTN_BASE} gap-2 ${ICON_BTN_DANGER_LOOK}`;

/** Uppercase caption above a control, using the muted theme token. */
export const FORM_CAPS_LABEL_CLASS = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';

/** Borderless field used by inline chat inputs (thread panel, channel comments). */
export const FORM_TRANSPARENT_INPUT_CLASS = 'flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]';

/** Inset card that holds a QR code and its caption. */
export const FORM_CARD_CLASS = 'w-full p-4 rounded-md flex flex-col items-center gap-3 neu-card-inset';
