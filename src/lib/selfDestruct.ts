/**
 * Self-destruct message expiry — pure helpers.
 *
 * A message sent with `selfDestructAt` set is *only* hidden by the bubble
 * component; the plaintext stays in the zustand store, in the persisted
 * `chats_all` snapshot, in the saved-messages list and — for media — in
 * IndexedDB blobs. These helpers return the filtered data plus everything that
 * has to be erased from storage, so the caller can actually delete it.
 */
import { FTR_MAGIC } from "./fileTransfer/frames";
import { SELF_DESTRUCT_MS } from "../constants/time";

/**
 * Timer options. `Off` first so a fresh picker starts on "no timer".
 * The full list is premium-gated, mirroring `PrivacySection`, so a per-chat
 * override cannot buy a longer duration than the account is entitled to.
 */
export const SELF_DESTRUCT_OPTIONS_ALL = ["Off", "1 min", "5 min", "1 hour", "1 day"] as const;
export const SELF_DESTRUCT_OPTIONS_FREE = ["Off", "1 min", "5 min"] as const;

/** Options the account may pick from. */
export function selfDestructOptions(premium: boolean): readonly string[] {
  return premium ? SELF_DESTRUCT_OPTIONS_ALL : SELF_DESTRUCT_OPTIONS_FREE;
}

/**
 * Localised label for a stored timer value. The values are English identifiers
 * persisted in the store, so translation happens at render time — shared with
 * `PrivacySection` so the option labels have a single source of truth.
 */
export function selfDestructLabel(t: (key: string, fallback?: string) => string, v: string): string {
  return v === "Off" ? t("settings.selfDestruct.off", "Off")
    : v === "1 min" ? t("settings.selfDestruct.1min", "1 min")
    : v === "5 min" ? t("settings.selfDestruct.5min", "5 min")
    : v === "1 hour" ? t("settings.selfDestruct.1hour", "1 hour")
    : v === "1 day" ? t("settings.selfDestruct.1day", "1 day")
    : v;
}

/**
 * Effective timer for an outgoing message: the per-chat override wins over the
 * global default, and both are re-checked against the entitlement.
 *
 * Returns `"Off"` (never `undefined`) for a non-entitled duration, because
 * dropping the override would silently re-expose the *global* default — a
 * downgrade that the user never asked for. A value of `undefined` therefore
 * means "no override at all", and only then does the global default apply.
 *
 * `chatId` is stringified: chat ids are `string | number` across the app
 * (legacy numeric ids) and `Record` keys are always strings.
 */
export function resolveSelfDestructTimer(
  chatId: string | number | null | undefined,
  globalDefault: string | undefined,
  overrides: Record<string, string> | undefined,
  premium: boolean,
): string | undefined {
  const key = chatId === null || chatId === undefined ? null : String(chatId);
  const override = key === null ? undefined : overrides?.[key];
  const timer = override ?? globalDefault;
  if (timer === undefined) return undefined;
  if (timer === "Off") return "Off";
  return selfDestructOptions(premium).includes(timer) ? timer : "Off";
}

/** A message is expired once its deadline is reached. Missing/invalid = never. */
export function isSelfDestructExpired(msg: any, now: number): boolean {
  return typeof msg?.selfDestructAt === "number" && now >= msg.selfDestructAt;
}

/**
 * Wire TTL — a self-destruct timer must not die at the sender's border, so
 * frames carry the *remaining duration* (never the sender's absolute deadline:
 * clock skew would either delete the message instantly or make it immortal).
 *
 * Inbounds are clamped: below the floor a hostile sender could destroy content
 * the receiver never got to see, above the ceiling a "self-destruct" message
 * would silently become permanent.
 */
export const SELF_DESTRUCT_WIRE_MIN_MS = 1000;
export const SELF_DESTRUCT_WIRE_MAX_MS = 24 * 60 * 60 * 1000;

/** Duration to put on the wire; undefined when the message never expires. */
export function wireSelfDestructTtl(selfDestructAt: unknown, now: number = Date.now()): number | undefined {
  if (typeof selfDestructAt !== "number" || !Number.isFinite(selfDestructAt)) return undefined;
  const remaining = selfDestructAt - now;
  return Math.min(Math.max(remaining, SELF_DESTRUCT_WIRE_MIN_MS), SELF_DESTRUCT_WIRE_MAX_MS);
}

/**
 * Receiver deadline for a wire TTL; undefined when absent/invalid (never expires).
 *
 * A sub-floor value (including `0`) is clamped rather than discarded: the sender
 * claimed a self-destruct, and turning that into "no timer" would silently
 * promote a burn-after-reading message to a permanent one.
 */
export function resolveInboundSelfDestruct(ttlMs: unknown, now: number = Date.now()): number | undefined {
  if (typeof ttlMs !== "number" || !Number.isSafeInteger(ttlMs) || ttlMs < 0) return undefined;
  return now + Math.min(Math.max(ttlMs, SELF_DESTRUCT_WIRE_MIN_MS), SELF_DESTRUCT_WIRE_MAX_MS);
}

/** Earliest pending deadline in a message list, or null when nothing expires. */
export function nextSelfDestructDeadline(messages: any[] | undefined, now: number): number | null {
  if (!messages) return null;
  let next: number | null = null;
  for (const msg of messages) {
    const at = msg?.selfDestructAt;
    if (typeof at !== "number") continue;
    if (at <= now) return at; // already overdue — sweep on the next tick
    if (next === null || at < next) next = at;
  }
  return next;
}

/**
 * Same scan as `nextSelfDestructDeadline` for a list of chats/channels, without
 * materialising the flattened message array. The sweep re-arms on *every* store
 * change (i.e. every message sent or received), so allocating a copy of the
 * whole history twice per event is the difference between a cheap property read
 * per message and a full array allocation.
 */
export function nextSelfDestructDeadlineInLists<T extends { history?: any[] }>(
  lists: T[] | undefined,
  now: number,
): number | null {
  if (!lists?.length) return null;
  let next: number | null = null;
  for (const item of lists) {
    const history = item?.history;
    if (!history?.length) continue;
    const at = nextSelfDestructDeadline(history, now);
    if (at === null) continue;
    if (at <= now) return at; // overdue wins over any later deadline
    if (next === null || at < next) next = at;
  }
  return next;
}

/**
 * Stamp the user's default self-destruct timer onto an outgoing message.
 * Every send path (text, geo, article, voice, file) goes through this, so the
 * timer covers every message type instead of text only.
 *
 * Mutates and returns `msg` — callers build the object literal right before
 * `appendMessage`/the wire frame, so an extra return value would be noise.
 */
export function applyDefaultSelfDestruct<T extends { selfDestructAt?: number }>(
  msg: T,
  selfDestructDefault: string | undefined,
  now: number = Date.now(),
): T {
  const ttl = selfDestructDefault ? SELF_DESTRUCT_MS[selfDestructDefault] : undefined;
  if (ttl) msg.selfDestructAt = now + ttl;
  return msg;
}

export interface ExpiredMedia {
  /** `voiceId`/message id of voice blobs to drop from the voice store. */
  voiceIds: (string | number)[];
  /** File-transfer ids whose chunks/metas live in the file-transfer store. */
  transferIds: string[];
}

/** `replyTo.type` marker for a quote whose original message self-destructed. */
export const EXPIRED_QUOTE_TYPE = "expired";

function transferIdOf(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith(FTR_MAGIC)) return null;
  const id = value.slice(FTR_MAGIC.length);
  return id || null;
}

/**
 * Record the storage ids a message owns: the voice blob key and every
 * file-transfer id (direct field, inline `ftr1:` attachment, album entries).
 *
 * Pure — no storage access — so both the expiry sweep and the manual delete
 * path can collect ids first and erase them through `messageMedia`.
 */
export function collectMessageMedia(msg: any, media: ExpiredMedia): void {
  const voiceId = msg?.voiceId ?? (msg?.type === "audio" ? msg?.id : undefined);
  if (voiceId !== undefined && voiceId !== null && !media.voiceIds.includes(voiceId)) {
    media.voiceIds.push(voiceId);
  }
  const transfers: (string | null | undefined)[] = [
    msg?.fileTransferId,
    transferIdOf(msg?.attachment),
  ];
  if (Array.isArray(msg?.album)) {
    for (const entry of msg.album) transfers.push(transferIdOf(entry?.url));
  }
  for (const id of transfers) {
    if (id && !media.transferIds.includes(id)) media.transferIds.push(id);
  }
}

export interface PurgeResult<T> {
  /** New value with expired messages removed; identical reference when none. */
  value: T;
  purged: any[];
  media: ExpiredMedia;
}

function emptyMedia(): ExpiredMedia {
  return { voiceIds: [], transferIds: [] };
}

/**
 * A reply embeds a copy of the quoted text (`replyTo.text`), so an expired
 * message would survive as a quote. Keep the attribution, drop the content.
 */
function scrubQuotes(messages: any[], purged: any[]): any[] {
  const purgedIds = new Set(purged.map((m) => m?.id));
  let changed = false;
  const next = messages.map((msg) => {
    const quote = msg?.replyTo;
    if (!quote || quote.type === EXPIRED_QUOTE_TYPE || !purgedIds.has(quote.id)) return msg;
    changed = true;
    return { ...msg, replyTo: { ...quote, text: undefined, type: EXPIRED_QUOTE_TYPE } };
  });
  return changed ? next : messages;
}

/** Drop expired messages from a single history array. */
export function purgeExpiredHistory(history: any[] | undefined, now: number): PurgeResult<any[] | undefined> {
  if (!history?.length) return { value: history, purged: [], media: emptyMedia() };
  const kept: any[] = [];
  const purged: any[] = [];
  const media = emptyMedia();
  for (const msg of history) {
    if (isSelfDestructExpired(msg, now)) {
      purged.push(msg);
      collectMessageMedia(msg, media);
    } else {
      kept.push(msg);
    }
  }
  if (!purged.length) return { value: history, purged, media };
  return { value: scrubQuotes(kept, purged), purged, media };
}

/** Union two media buckets in place (same de-dup contract for both id lists). */
export function mergeExpiredMedia(target: ExpiredMedia, extra: ExpiredMedia): ExpiredMedia {
  for (const id of extra.voiceIds) if (!target.voiceIds.includes(id)) target.voiceIds.push(id);
  for (const id of extra.transferIds) if (!target.transferIds.includes(id)) target.transferIds.push(id);
  return target;
}

/** Drop expired messages from every `history` in a chat/channel list. */
export function purgeExpiredLists<T extends { history?: any[] }>(lists: T[] | undefined, now: number): PurgeResult<T[]> {
  const media = emptyMedia();
  if (!lists?.length) return { value: lists ?? [], purged: [], media };
  let changed = false;
  const purged: any[] = [];
  const next = lists.map((item) => {
    const result = purgeExpiredHistory(item?.history, now);
    if (!result.purged.length) return item;
    changed = true;
    purged.push(...result.purged);
    mergeExpiredMedia(media, result.media);
    return { ...item, history: result.value };
  });
  if (!changed) return { value: lists, purged, media };
  return { value: next, purged, media };
}

/** Saved-message entries keep a copy of the bubble (localStorage) — drop them too. */
export function purgeExpiredSaved(saved: any[] | undefined, purgedIds: Set<string | number>): any[] {
  if (!saved?.length || !purgedIds.size) return saved ?? [];
  const next = saved.filter((entry: any) => !purgedIds.has(entry?.messageId));
  return next.length === saved.length ? saved : next;
}
