import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

function normalizeKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) parts.push('Cmd');
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.key === ',') parts.push(',');
  else if (e.key === ' ') parts.push('Space');
  else if (e.key === 'Escape') parts.push('Escape');
  else if (e.key === 'Enter') parts.push('Enter');
  else parts.push(e.key.toUpperCase());
  return parts.join('+');
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const key = normalizeKey(e);
      const action = shortcuts[key];
      if (action) {
        e.preventDefault();
        e.stopPropagation();
        action();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
