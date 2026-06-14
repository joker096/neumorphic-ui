const SCRIPT_PATTERN = /<script[\s>]/gi;
const ON_EVENT_PATTERN = /\son\w+\s*=/gi;
const JS_PROTOCOL = /javascript\s*:/gi;
const DATA_PROTOCOL = /data\s*:\s*text\/html/gi;

export function sanitizeText(input: string): string {
  return input
    .replace(SCRIPT_PATTERN, '&lt;script&gt;')
    .replace(ON_EVENT_PATTERN, ' data-safe="')
    .replace(JS_PROTOCOL, 'javascript-blocked:')
    .replace(DATA_PROTOCOL, 'data-blocked:')
    .trim();
}

export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return input.replace(/[&<>"']/g, (ch) => map[ch] || ch);
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}
