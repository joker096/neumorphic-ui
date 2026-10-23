/**
 * Telegram renders a message whose entire body is a single emoji as one big
 * glyph instead of a line of small text. This is the pure predicate behind
 * that style choice.
 *
 * It must be conservative: only a *whole* message that is exactly one emoji
 * grapheme qualifies. ZWJ sequences (family/flag glyphs), skin tones and
 * variation selectors are all part of the same grapheme, so they are allowed
 * as long as the message stays one glyph.
 */

/**
 * A single codepoint that can participate in an emoji glyph: an extended
 * pictographic (the core art), an emoji component (ZWJ, variation selectors,
 * skin-tone modifiers) or a regional indicator (flag pairs).
 */
const EMOJI_GLYPH_PART = "\\p{Extended_Pictographic}|\\p{Emoji_Component}|\\p{Regional_Indicator}";
const EMOJI_GLYPH_ONLY = new RegExp(`^(?:${EMOJI_GLYPH_PART})+$`, "u");

function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

export function isSingleEmojiText(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Exactly one grapheme in the raw string.
  if (segmentGraphemes(trimmed).length !== 1) return false;

  // Every remaining codepoint must be part of that emoji glyph — no letters,
  // digits or punctuation. This also rejects a lone regional indicator pair
  // mismatch by construction (it still matches, which is fine).
  return EMOJI_GLYPH_ONLY.test(trimmed);
}
