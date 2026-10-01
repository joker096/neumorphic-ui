/**
 * Input mechanics shared by the channel and DM composers.
 *
 * Both render a `<textarea>` that grows with its content and both colour the
 * glyphs amber in Morse mode, so the behaviour lives here rather than being
 * copied per composer.
 */

import type React from 'react';

/** Grow-to-content cap; the composer's `max-h` is 120px. */
const MAX_TEXTAREA_HEIGHT = 120;

/**
 * Resize a textarea to fit its content.
 *
 * `scrollHeight` must be measured with the height reset first, otherwise the
 * element can only ever grow.
 */
export function growTextarea(el: HTMLTextAreaElement): void {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
}

/** Inline style for the composer textarea: monospace amber glyphs in Morse mode. */
export function composerInputStyle(morseMode: boolean, isDark: boolean): React.CSSProperties | undefined {
  if (!morseMode) return undefined;
  return {
    fontFamily: "monospace",
    color: isDark ? "#fbbf24" : "#d97706",
    filter: "saturate(0.7)",
  };
}

/**
 * Delimiters the bubble renderer actually parses, in `FormattedText`'s split
 * regex. Italic is `__` and NOT `*` — a single asterisk is never captured, so
 * wrapping in it would send literal asterisks to the receiver.
 */
export const FORMAT_WRAPS = {
  bold: "**",
  italic: "__",
  strike: "~~",
  spoiler: "||",
  code: "`",
} as const;

export type FormatWrapKey = keyof typeof FORMAT_WRAPS;

export interface WrapResult {
  text: string;
  /** Where the caret should land once the new text is in the textarea. */
  caret: number;
}

/**
 * Wrap the current selection in a formatting delimiter, or unwrap it when the
 * selection is already wrapped.
 *
 * Toggling matters: pressing "bold" twice must return the original text, not
 * `****`. Unwrapping is only attempted on a selection that begins and ends with
 * the delimiter, so ordinary text that happens to contain `**` mid-sentence is
 * left alone.
 *
 * With an empty selection the delimiters are inserted and the caret is placed
 * between them, so the user can keep typing inside the new span.
 */
export function wrapSelection(
  text: string,
  start: number,
  end: number,
  key: FormatWrapKey,
): WrapResult {
  const delim = FORMAT_WRAPS[key];
  const from = Math.max(0, Math.min(start, text.length));
  const to = Math.max(from, Math.min(end, text.length));
  const selected = text.slice(from, to);

  // Already wrapped → unwrap. A bare `****` is handled here too, since the
  // length/prefix/suffix test admits it and `slice` yields an empty inner span.
  if (selected.length >= delim.length * 2 && selected.startsWith(delim) && selected.endsWith(delim)) {
    const inner = selected.slice(delim.length, -delim.length);
    return {
      text: text.slice(0, from) + inner + text.slice(to),
      caret: from + inner.length,
    };
  }

  const wrapped = delim + selected + delim;
  return {
    text: text.slice(0, from) + wrapped + text.slice(to),
    // Empty selection: land between the delimiters instead of after them.
    caret: from + (selected.length === 0 ? delim.length : wrapped.length),
  };
}
