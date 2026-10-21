/**
 * Self-destruct stamping shared by every outgoing path of the chat preview.
 */

import { useAppStore } from '../../store';
import { applyDefaultSelfDestruct, resolveSelfDestructTimer } from '../../lib/selfDestruct';

/**
 * Stamp the self-destruct timer onto an outgoing message. Every send path
 * uses it, so the timer covers text, geo, article and attachments alike
 * instead of text only. A per-chat override wins over the global default.
 */
export function applySelfDestruct(msg: any, chatId?: string | number): void {
  const s = useAppStore.getState();
  applyDefaultSelfDestruct(
    msg,
    resolveSelfDestructTimer(chatId, s.selfDestructDefault, s.chatSelfDestruct, s.premiumEntitlement?.premium ?? false),
  );
}
