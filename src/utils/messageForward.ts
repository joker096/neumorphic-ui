import { formatClockTime } from "./chatUtils";

/**
 * Fields that only describe where a message sat in its original render pass.
 * A forwarded copy lands in a different list, so they must not travel with it.
 */
const RENDER_ONLY_FIELDS = [
  "_groupPosition",
  "_isLastInGroup",
  "_isDateSeparator",
  "_dateLabel",
] as const;

/** Per-message state that must not be inherited by a new outgoing copy. */
const DROPPED_FIELDS = [
  "reactions",
  "replyTo",
  "selfDestructAt",
  "linkPreview",
  "edited",
  "forwarded",
  "forwardedFrom",
  "forwardedFromChat",
] as const;

export interface ForwardedCopyOptions {
  /** Base timestamp; ids are derived as `now + index` so a batch stays ordered. */
  now?: number;
  index?: number;
  /** Delivery status of the new copy, same contract as a regular send. */
  status?: string;
  /** Display label of the chat the message was forwarded out of. */
  sourceChatName?: string;
}

/**
 * Build the outgoing copy of a message that is being forwarded to another
 * chat. Media payloads (attachment, album, voiceId, location, article) are
 * carried over as-is so the receiving bubble renders the original content.
 */
export function buildForwardedMessage(msg: any, options: ForwardedCopyOptions = {}): any {
  const now = options.now ?? Date.now();
  const index = options.index ?? 0;
  const copy: any = { ...msg };

  for (const field of RENDER_ONLY_FIELDS) delete copy[field];
  for (const field of DROPPED_FIELDS) delete copy[field];

  const forwardedFrom = msg?.sender && msg.sender !== "me" ? String(msg.sender) : undefined;

  return {
    ...copy,
    id: now + index,
    sender: "me",
    ts: now,
    time: formatClockTime(now),
    status: options.status ?? "sent",
    silent: false,
    forwarded: true,
    forwardedFrom,
    forwardedFromChat: options.sourceChatName || undefined,
  };
}

/**
 * True when the message has a wire frame in the send pipeline. Attachments
 * keep the local-only media sync path, so they are appended but not sent.
 */
export function isWireForwardable(msg: any): boolean {
  return Boolean(msg) && !msg.type;
}
