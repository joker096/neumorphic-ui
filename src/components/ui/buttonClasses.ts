/**
 * Class strings shared by the generic UI action buttons.
 *
 * Class strings rather than components: every call site keeps its own
 * element and only the button treatment is common.
 */

/** Primary action button used by the empty, error and offline states. */
export const PRIMARY_ACTION_BTN_CLASS = 'flex items-center justify-center gap-2 min-h-11 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground active:scale-95 transition-transform';
