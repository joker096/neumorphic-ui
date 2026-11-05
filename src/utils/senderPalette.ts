/**
 * Derives a deterministic sender palette index (0-13) from a
 * display-name string. Matches Telegram's 14-color cycle order.
 */
const PALETTE = [
  "blue", "teal", "violet", "amber", "orange", "coral",
  "lime", "cyan", "purple", "pink", "red", "emerald", "indigo", "slate",
] as const;

type PaletteKey = (typeof PALETTE)[number];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h) + name.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

export function getSenderPaletteIndex(name: string): number {
  return hashName(String(name || "")) % PALETTE.length;
}

export function getSenderPaletteClass(
  name: string,
  kind: "label" | "dot" = "label",
): string {
  const key = PALETTE[getSenderPaletteIndex(name)];
  if (kind === "dot") return `bg-[var(--msg-sender-${key})]`;
  return `text-[var(--msg-sender-${key})]`;
}
