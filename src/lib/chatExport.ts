import { sendTimeOf } from '../utils/chatUtils';
import { downloadFile } from './backupIO';

/**
 * Plain-text transcript of a single chat, the way Telegram's "Export chat
 * history" produces a readable `.txt` next to its machine-readable copy.
 *
 * Kept pure: every user-visible word (attachment kinds, "exported" header) is
 * injected by the caller, so the module stays free of i18n and can be tested
 * without a locale provider.
 */

export interface ChatExportLabels {
  /** Name shown for the local user's own messages. */
  selfName: string;
  /** Header line: `Chat: <name>`. */
  title: string;
  /** `Exported: <date>`; omitted when the caller has no localized wording. */
  exported?: string;
  /** `Messages: <count>`; omitted for the same reason. */
  messages?: string;
  photo: string;
  video: string;
  voice: string;
  file: string;
  article: string;
  location: string;
  sticker: string;
  poll: string;
  /** `Forwarded from <name>`; falls back to the raw sender when absent. */
  forwardedFrom?: string;
}

export interface ChatExportOptions {
  labels: ChatExportLabels;
  /** Rendered export date; defaults to today in the local time zone. */
  exportedAt?: Date;
}

interface ExportableMessage {
  id?: string | number;
  sender?: string;
  text?: string;
  time?: string;
  ts?: number;
  type?: string;
  attachment?: { type?: string; url?: string } | null;
  voiceId?: string;
  poll?: { question?: string; options?: { text?: string; voters?: string[] }[] } | null;
  forwardedFrom?: string;
  forwardedFromChat?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function senderOf(msg: ExportableMessage, selfName: string): string {
  const sender = String(msg.sender ?? '').trim();
  if (!sender) return selfName;
  return sender === 'me' ? selfName : sender;
}

/** Type-independent body line: what the bubble shows, minus the layout. */
function bodyOf(msg: ExportableMessage, labels: ChatExportLabels): string[] {
  if (msg.poll) {
    const question = String(msg.poll.question ?? msg.text ?? '').trim();
    const options = (msg.poll.options ?? []).map((option) => {
      const text = String(option.text ?? '').trim();
      const votes = (option.voters ?? []).length;
      return `  • ${text} (${votes})`;
    });
    return [`[${labels.poll}] ${question}`, ...options];
  }
  const text = String(msg.text ?? '').trim();
  if (msg.attachment) {
    const kind = String(msg.attachment.type ?? '');
    const label = kind === 'image' ? labels.photo
      : kind === 'video' ? labels.video
        : kind === 'audio' ? labels.voice
          : labels.file;
    return text ? [`[${label}] ${text}`] : [`[${label}]`];
  }
  if (msg.voiceId || msg.type === 'audio') return text ? [`[${labels.voice}] ${text}`] : [`[${labels.voice}]`];
  if (msg.type === 'location') return [`[${labels.location}] ${text}`.trim()];
  if (msg.type === 'sticker') return [`[${labels.sticker}] ${text}`.trim()];
  if (msg.type === 'article') return [`[${labels.article}] ${text}`.trim()];
  return text ? [text] : [];
}

function dayKey(ts?: number): string {
  const value = Number(ts);
  if (!Number.isFinite(value) || value <= 0) return '';
  return new Date(value).toDateString();
}

function formatDate(ts: number): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * Renders the chat as a text transcript: header, day separators, one line of
 * metadata per message and its body. Media that only lives on the device is
 * described by kind instead of being embedded, so the file stays small and
 * never claims to be a full backup.
 */
export function buildChatExport(
  chat: { name?: string; history?: unknown[]; messages?: unknown[] } | null | undefined,
  options: ChatExportOptions,
): string {
  const labels = options.labels;
  const history = (Array.isArray(chat?.history) ? chat?.history : chat?.messages) ?? [];
  const messages = (history as ExportableMessage[]).filter(Boolean);
  const exportedAt = options.exportedAt ?? new Date();
  const lines: string[] = [`${labels.title}: ${String(chat?.name ?? '').trim()}`];
  if (labels.exported) lines.push(`${labels.exported}: ${formatDate(exportedAt.getTime())}`);
  if (labels.messages) lines.push(`${labels.messages}: ${messages.length}`);
  lines.push('');

  let previousDay = '';
  for (const msg of messages) {
    const ts = sendTimeOf(msg);
    const day = dayKey(ts);
    if (day && day !== previousDay) {
      previousDay = day;
      lines.push('', `— ${formatDate(ts)} —`, '');
    }
    const sender = senderOf(msg, labels.selfName);
    const stamp = String(msg.time ?? '').trim();
    const forwarded = msg.forwardedFrom || msg.forwardedFromChat;
    const meta = [stamp ? `${sender}, ${stamp}` : sender];
    if (forwarded && labels.forwardedFrom) meta.push(`[${labels.forwardedFrom}: ${forwarded}]`);
    lines.push(meta.join(' '));
    lines.push(...bodyOf(msg, labels), '');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** Filesystem-safe name so a chat called `Work / 2026` still exports. */
export function buildChatExportFileName(chatName: string, now: Date = new Date()): string {
  const slug = String(chatName ?? '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'chat';
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${slug}-${stamp}.txt`;
}

export { DAY_MS };

/** Builds the transcript and hands it to the browser as a `.txt` download. */
export function downloadChatExport(
  chat: { name?: string; history?: unknown[]; messages?: unknown[] } | null | undefined,
  options: ChatExportOptions,
): void {
  const text = buildChatExport(chat, options);
  downloadFile(buildChatExportFileName(String(chat?.name ?? '')), new TextEncoder().encode(text));
}
