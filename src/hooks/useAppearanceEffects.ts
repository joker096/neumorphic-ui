import { useEffect } from 'react';
import { useAppStore } from '../store';

/** Convert a #rrggbb hex color into the "r,g,b" channel triplet used by CSS. */
function hexToRgbChannels(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return `${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}`;
}

/**
 * Applies the persisted appearance settings (accent, chat background, density,
 * message radius, animation intensity) to `document.documentElement` so their
 * consumers resolve on boot — not only after the Appearance settings pane is
 * opened. Re-runs whenever one of the values changes.
 */
export function useAppearanceEffects() {
  const accentColor = useAppStore((s) => s.accentColor);
  const chatBackground = useAppStore((s) => s.chatBackground);
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
    }

    if (chatBackground) root.setAttribute('data-chat-bg', chatBackground);
    if (density) root.setAttribute('data-density', density);

    if (typeof messageRadius === 'number') {
      root.style.setProperty('--message-radius', `${messageRadius}px`);
      root.style.setProperty(
        '--message-radius-sm',
        `${Math.max(2, Math.min(6, Math.round(messageRadius / 4)))}px`,
      );
    }

    if (animationIntensity) root.setAttribute('data-anim-intensity', animationIntensity);
  }, [accentColor, chatBackground, density, messageRadius, animationIntensity]);
}
