import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { applyThemeToDocument } from '../theme/tokens';
import { useThemeStore } from '../store/theme';

/** Keeps `<html data-theme>` in sync with the store; the tokens do the rest. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return <>{children}</>;
}
