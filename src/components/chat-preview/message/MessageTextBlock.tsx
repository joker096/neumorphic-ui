/**
 * Text body of a chat bubble.
 *
 * Telegram and WhatsApp float the clock onto the last text line instead of
 * reserving a strip under every message, so a plain text bubble is one line
 * shorter than a photo or poll bubble. `floatsTimestamp` owns that decision;
 * every other bubble type keeps the block clock that `MessageTimestamp` paints
 * on its own row.
 */
import React from "react";
import { FormattedText } from "../FormattedText";
import { isSingleEmojiText } from "../../../utils/emoji";

interface MessageTextBlockProps {
  /** Message whose body is rendered. */
  msg: any;
  /** Text exactly as the reader should see it (morse already decoded). */
  text: string;
  /** Highlighted search term inside the body. */
  searchTerm?: string;
  /** Localized `edited` marker, omitted when the message was never edited. */
  editedLabel?: string;
  /** Clock floated onto the last text line; omitted for block-clock bubbles. */
  meta?: React.ReactNode;
}

/**
 * Rendered bubble body: highlighted text, the edited marker and the clock that
 * wraps around the last line when `meta` is supplied.
 */
export function MessageTextBlock({
  msg,
  text,
  searchTerm,
  editedLabel,
  meta,
}: MessageTextBlockProps) {
  // A lone emoji is drawn as a large glyph instead of text.
  const giant = !meta && isSingleEmojiText(text);
  return (
    <div
      className={`block ${meta ? "flow-root pb-0" : "pb-0.5"} ${msg.type ? "font-medium" : ""} ${giant ? "text-6xl leading-none -my-1" : ""}`}
    >
      <FormattedText text={text} searchTerm={searchTerm} />
      {editedLabel && (
        <span className="ml-1 align-middle text-xs uppercase tracking-wide text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]">
          {editedLabel}
        </span>
      )}
      {meta}
    </div>
  );
}

interface TimestampFloatArgs {
  /** Message under consideration. */
  msg: any;
  /** Body text as displayed, used to detect the giant-emoji case. */
  text: string;
  /** Inline editor is open — the clock would land on top of it. */
  editing: boolean;
  /** Body is morse code and keeps its decode chip under the text. */
  isMorse: boolean;
  /** A thread replies chip is rendered under the body. */
  hasThreads: boolean;
}

/**
 * Whether the clock can float onto the last text line of this bubble.
 *
 * Media, polls, payments, articles, stickers and locations lay out their own
 * content, so they keep the block clock; so do morse bodies, bubbles with an
 * inline keyboard or a thread chip, and a lone emoji drawn at `text-6xl`.
 */
export function floatsTimestamp({
  msg,
  text,
  editing,
  isMorse,
  hasThreads,
}: TimestampFloatArgs): boolean {
  if (msg.type) return false;
  if (editing || isMorse || hasThreads) return false;
  if (msg.keyboard && msg.keyboard.length > 0) return false;
  if (!text.trim()) return false;
  return !isSingleEmojiText(text);
}
