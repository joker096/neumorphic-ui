import React from "react";
import { p2pNetwork } from "../../lib/p2p/network";

/** How long the peer keeps showing "typing" after the last keystroke. */
const TYPING_IDLE_MS = 2500;

export interface UseTypingIndicatorArgs {
  /** Channels have no peer to notify. */
  isChannel: boolean;
  /** Gated by the user's privacy setting. */
  enabled: boolean;
  /** Peer display name; the signal is addressed by name, not by id. */
  peerName?: string;
  /** Current draft; any non-blank text marks the user as typing. */
  text: string;
}

/**
 * Throttled "typing…" signal: sent on the first keystroke of a burst, then once
 * the draft stays quiet for {@link TYPING_IDLE_MS}. The effect cleanup also
 * clears the flag, so leaving the chat (or unmounting) never leaves a peer
 * showing a typing indicator forever.
 */
export function useTypingIndicator({ isChannel, enabled, peerName, text }: UseTypingIndicatorArgs): void {
  const activeRef = React.useRef(false);
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    if (isChannel || !enabled || !peerName) return;
    const name = peerName;

    if (text.trim()) {
      if (!activeRef.current) {
        activeRef.current = true;
        p2pNetwork.sendTypingIndicator(name, true);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        activeRef.current = false;
        p2pNetwork.sendTypingIndicator(name, false);
      }, TYPING_IDLE_MS);
    } else {
      if (activeRef.current) {
        activeRef.current = false;
        p2pNetwork.sendTypingIndicator(name, false);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (activeRef.current) {
        activeRef.current = false;
        p2pNetwork.sendTypingIndicator(name, false);
      }
    };
  }, [text, isChannel, enabled, peerName]);
}
