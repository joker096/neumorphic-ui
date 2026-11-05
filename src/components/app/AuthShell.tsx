// AuthShell — thin auth-layer wrapper extracted from AppLayout (§1.2 split, 2026-10-23).
// Keeps AppLayout under 300 lines (component-audit oversize 0). Contains only auth
// gate + theme provider + auth props bridge; no UI, no nav, no overlays.
import { ReactNode } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AppAuthGate } from "./AppAuthGate";

export interface AuthShellProps {
  theme: any; isDark: any;
  children?: ReactNode;
}

export function AuthShell({
  theme, isDark, children,
}: AuthShellProps) {
  return (
    <AppAuthGate>
      <ThemeContext.Provider value={{ theme, isDark, setTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    </AppAuthGate>
  );
}
