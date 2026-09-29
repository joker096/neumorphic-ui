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
    filter: "saturate(0.8)",
  };
}
