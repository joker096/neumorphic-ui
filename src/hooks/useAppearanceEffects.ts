import { useEffect } from 'react';
import { useAppStore } from '../store';

type Rgb = { r: number; g: number; b: number };

/** Convert a #rrggbb hex color into the "r,g,b" channel triplet used by CSS. */
function hexToRgbChannels(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return `${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}`;
}

function rgbFromHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** WCAG relative luminance for a #rrggbb color (0 = black … 1 = white). */
function relativeLuminance(hex: string): number | null {
  const rgb = rgbFromHex(hex);
  if (!rgb) return null;
  const linearized = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearized(rgb.r) + 0.7152 * linearized(rgb.g) + 0.0722 * linearized(rgb.b);
}

/** Darken a #rrggbb color by `factor` (per-channel multiplier in 0 … 1). */
function darkenHex(hex: string, factor: number): string | null {
  const rgb = rgbFromHex(hex);
  if (!rgb) return null;
  return toHex({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor });
}

/** Accent-2 companions for the tones offered in the Appearance swatches. */
const PAIRED_ACCENT2: Record<string, string> = {
  '#4ede63': '#10b981',
  '#3b82f6': '#1d4ed8',
  '#8b5cf6': '#6d28d9',
  '#ec4899': '#be185d',
  '#f59e0b': '#b45309',
  '#ef4444': '#b91c1c',
  '#14b8a6': '#0f766e',
  '#6366f1': '#4338ca',
};

/** Readable foreground for a saturated accent fill (dark ink on bright tones). */
function textOnAccent(hex: string): string {
  const luminance = relativeLuminance(hex);
  return luminance !== null && luminance > 0.4 ? '#0d1017' : '#ffffff';
}

/**
 * Applies the persisted appearance settings (accent, chat background, density,
 * message radius, animation intensity) to `document.documentElement` so their
 * consumers resolve on boot — not only after the Appearance settings pane is
 * opened. Re-runs whenever one of the values changes.
 *
 * The accent write also mirrors its derived tokens (accent-2, primary-button
 * fill/text, toggle, waveform, player progress) so a custom pick never leaves
 * sibling controls on a stale CSS default.
 */
export function useAppearanceEffects() {
  const accentColor = useAppStore((s) => s.accentColor);
  const chatBackground = useAppStore((s) => s.chatBackground);
  const customChatBackground = useAppStore((s) => s.customChatBackground);
  const density = useAppStore((s) => s.density);
  const messageRadius = useAppStore((s) => s.messageRadius);
  const animationIntensity = useAppStore((s) => s.animationIntensity);

  useEffect(() => {
    const root = document.documentElement;

    if (accentColor) {
      root.style.setProperty('--accent', accentColor);
      root.style.setProperty('--accent-bg', accentColor + '22');
      root.style.setProperty('--accent-soft', accentColor + '24');
      const rgb = hexToRgbChannels(accentColor);
      if (rgb) root.style.setProperty('--accent-rgb', rgb);

      const accent2 = PAIRED_ACCENT2[accentColor.toLowerCase()] ?? darkenHex(accentColor, 0.78) ?? accentColor;
      root.style.setProperty('--accent2', accent2);
      const accent2rgb = hexToRgbChannels(accent2);
      if (accent2rgb) root.style.setProperty('--accent2-rgb', accent2rgb);

      root.style.setProperty('--button-primary-bg', accentColor);
      root.style.setProperty('--toggle-active-bg', accentColor);
      root.style.setProperty('--player-progress-orange', accentColor);
      root.style.setProperty('--waveform-played-other', accentColor);
      root.style.setProperty('--button-primary-text', textOnAccent(accentColor));
    }

    if (chatBackground) root.setAttribute('data-chat-bg', chatBackground);
    if (chatBackground === 'custom' && customChatBackground) {
      root.style.setProperty('--chat-bg-image', `url("${customChatBackground}")`);
    } else {
      root.style.removeProperty('--chat-bg-image');
    }
    if (density) root.setAttribute('data-density', density);

    if (typeof messageRadius === 'number') {
      root.style.setProperty('--message-radius', `${messageRadius}px`);
      root.style.setProperty(
        '--message-radius-sm',
        `${Math.max(2, Math.min(6, Math.round(messageRadius / 4)))}px`,
      );
    }

    if (animationIntensity) root.setAttribute('data-anim-intensity', animationIntensity);
  }, [accentColor, chatBackground, customChatBackground, density, messageRadius, animationIntensity]);
}