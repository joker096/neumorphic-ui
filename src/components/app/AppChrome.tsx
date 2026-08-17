import React from "react";
import { Toaster } from "sonner";
import { TransportIndicator } from "../status/TransportIndicator";

export interface AppChromeProps {
  isDark: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';
}

function AppChromeImpl({ isDark, connectionStatus }: AppChromeProps) {
  return (
    <>
      <Toaster position="top-right" duration={3000} theme={isDark ? 'dark' : 'light'} />
      {isDark && (
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-[#6f7fff]/5 to-transparent pointer-events-none" />
      )}
      <div className="absolute top-2 right-2 z-50">
        <TransportIndicator status={connectionStatus} />
      </div>
    </>
  );
}

export const AppChrome = React.memo(AppChromeImpl);
AppChrome.displayName = "AppChrome";
