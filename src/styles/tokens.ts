// ============================================================
// DESIGN TOKENS — TypeScript Design System
// ============================================================
// This file exports all design tokens for use in components.
// These values mirror the CSS custom properties in tokens.css.
// ============================================================

export type ThemeMode = 'light' | 'dark';
export type FontSizeOption = 'Small' | 'Medium' | 'Large';

// ── Colors ──────────────────────────────────────────────────

export const Colors = {
  dark: {
    bg: {
      primary: '#0d1017',
      secondary: '#13151b',
      tertiary: '#1a1d24',
      elevated: '#1e2128',
    },
    text: {
      primary: '#f0f2f5',
      secondary: '#9ca3af',
      tertiary: '#6b7280',
    },
    border: 'rgba(255,255,255,0.06)',
    accent: '#f97316',
    accentSoft: 'rgba(249,115,22,0.12)',
    separator: 'rgba(255,255,255,0.06)',
    bgSystem: '#0d1017',
    card: {
      raised: '#1a1d24',
      flat: '#13151b',
      inset: '#13151b',
    },
    inputBg: '#1a1d24',
    inputText: '#f0f2f5',
    inputPlaceholder: '#6b7280',
    glassBg: 'rgba(19,21,27,0.6)',
    glassBorder: 'rgba(255,255,255,0.08)',
    glassShadow: '0 8px 32px rgba(0,0,0,0.4)',
    glassBlur: '12px',
    doppelrandOuterBg: '#1e2128',
    doppelrandPadding: '6px',
    doppelrandOuterBorder: 'rgba(255,255,255,0.08)',
    doppelrandInnerShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
    toggleActiveBg: '#f97316',
    toggleInactiveBg: 'rgba(255,255,255,0.1)',
    toggleInactiveBorder: 'rgba(255,255,255,0.2)',
    toggleThumbBg: '#ffffff',
    success: '#22c372',
    successSoft: 'rgba(34,195,114,0.15)',
    warning: '#f59f19',
    danger: '#ef4424',
    listHoverBg: 'rgba(255,255,255,0.04)',
    neuRaised: '3px 3px 6px #0a0c10, -3px -3px 6px #14171e',
    neuInset: 'inset 3px 3px 6px #0a0c10, inset -3px -3px 6px #14171e',
  } as const,
  light: {
    bg: {
      primary: '#f8fafc',
      secondary: '#f1f5f9',
      tertiary: '#e2e8f0',
      elevated: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#94a3b8',
    },
    border: 'rgba(0,0,0,0.08)',
    accent: '#ea580c',
    accentSoft: 'rgba(234,88,12,0.1)',
    separator: 'rgba(0,0,0,0.08)',
    bgSystem: '#f8fafc',
    card: {
      raised: '#ffffff',
      flat: '#f1f5f9',
      inset: '#f1f5f9',
    },
    inputBg: '#ffffff',
    inputText: '#0f172a',
    inputPlaceholder: '#94a3b8',
    glassBg: 'rgba(255,255,255,0.7)',
    glassBorder: 'rgba(0,0,0,0.08)',
    glassShadow: '0 8px 32px rgba(0,0,0,0.08)',
    glassBlur: '12px',
    doppelrandOuterBg: '#ffffff',
    doppelrandPadding: '6px',
    doppelrandOuterBorder: 'rgba(0,0,0,0.08)',
    doppelrandInnerShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
    toggleActiveBg: '#ea580c',
    toggleInactiveBg: 'rgba(0,0,0,0.12)',
    toggleInactiveBorder: 'rgba(0,0,0,0.2)',
    toggleThumbBg: '#ffffff',
    success: '#16a04a',
    successSoft: 'rgba(22,160,74,0.12)',
    warning: '#d97c0f',
    danger: '#dc2023',
    listHoverBg: 'rgba(0,0,0,0.03)',
    neuRaised: '3px 3px 6px #c2c8d4, -3px -3px 6px #ffffff',
    neuInset: 'inset 3px 3px 6px #c2c8d4, inset -3px -3px 6px #ffffff',
  } as const,
} as const;

// ── Spacing ────────────────────────────────────────────────

export const Spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  base: '1rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem',
} as const;

// ── Typography ─────────────────────────────────────────────

export const Typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, Blink, "Segoe UI", sans-serif',
    display: 'Space Grotesk, ui-sans-serif, system-ui, -apple-system, Blink, "Segoe UI", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  } as const,
} as const;

// ── Radius ─────────────────────────────────────────────────

export const Radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  full: '9999px',
} as const;

// ── Shadows ────────────────────────────────────────────────

export const Shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.3)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.3)',
  inset: 'inset 0 2px 4px 0 rgba(0,0,0,0.5)',
} as const;

// ── Breakpoints ────────────────────────────────────────────

export const Breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ── Animation ──────────────────────────────────────────────

export const Animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '700ms',
  } as const,
  easing: {
    default: 'cubic-bezier(0.32, 0.72, 0, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  } as const,
} as const;

// ── Helpers ────────────────────────────────────────────────

export function getThemeColors(theme: ThemeMode) {
  return theme === 'dark' ? Colors.dark : Colors.light;
}
