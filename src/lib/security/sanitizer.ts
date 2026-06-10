// Sanitizer - Protects against XSS and injection attacks

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

export function sanitizeText(text: string, maxLength = 10000): string {
  const stripped = stripHtml(text);
  return stripped.substring(0, maxLength);
}

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const safeProtocols = ['https:', 'http:'];
    return safeProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function toPlainText(text: string): string {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || '';
}

export function sanitizeInput(input: string): {
  sanitized: string;
  isSafe: boolean;
  isTrusted: boolean;
} {
  const sanitized = sanitizeText(input);
  const isSafe = !/[&<>"'\\]/.test(input);
  const isTrusted = true; // In production, this would be based on origin verification

  return { sanitized, isSafe, isTrusted };
}

export function validateLink(link: string): { isValid: boolean; url?: string } {
  if (isSafeUrl(link)) {
    return { isValid: true, url: link };
  }
  return { isValid: false };
}

export function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeText(data);
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const key of Object.keys(data)) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }
  return data;
}
