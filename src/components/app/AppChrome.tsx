import React from "react";
import { Toaster } from "sonner";
import { TransportIndicator } from "../status/TransportIndicator";

export interface AppChromeProps {
  isDark: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';
  connectionError?: string | null;
}

function AppChromeImpl({ isDark, connectionStatus, connectionError }: AppChromeProps) {
  return (
    <>
      <Toaster
        position="top-right"
        duration={3000}
        theme={isDark ? 'dark' : 'light'}
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          },
        }}
      />
      {isDark && (
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-[var(--accent)]/5 to-transparent pointer-events-none" />
      )}
      <div className="absolute top-2 right-2 z-50">
        <TransportIndicator status={connectionStatus} detail={connectionError} />
      </div>
    </>
  );
}

export const AppChrome = React.memo(AppChromeImpl);
AppChrome.displayName = "AppChrome";
