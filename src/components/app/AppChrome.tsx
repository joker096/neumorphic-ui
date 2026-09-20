import React from "react";
import { Toaster } from "sonner";

export interface AppChromeProps {
  isDark: boolean;
}

function AppChromeImpl({ isDark }: AppChromeProps) {
  return (
    <>
      <Toaster
        position="top-right"
        duration={3000}
        theme={isDark ? 'dark' : 'light'}
        toastOptions={{
          style: {
            background: 'var(--msg-bg-panel)',
            backdropFilter: 'blur(var(--msg-glass-blur)) saturate(var(--msg-glass-saturate))',
            WebkitBackdropFilter: 'blur(var(--msg-glass-blur)) saturate(var(--msg-glass-saturate))',
            border: '1px solid var(--msg-border)',
            borderRadius: 'var(--msg-radius-md)',
            color: 'var(--msg-text-primary)',
            boxShadow: 'var(--msg-shadow-floating)',
          },
        }}
      />
      {isDark && (
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-[var(--accent)]/5 to-transparent pointer-events-none" />
      )}
    </>
  );
}

export const AppChrome = React.memo(AppChromeImpl);
AppChrome.displayName = "AppChrome";
