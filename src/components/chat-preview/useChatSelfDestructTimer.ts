import { useCallback } from 'react';
import { selfDestructOptions, resolveSelfDestructTimer } from '../../lib/selfDestruct';
import { useAppStore } from '../../store';

/**
 * Per-chat self-destruct timer: an override over the global default, same
 * premium gate. `chatId` gates the control — a chat without a stable id has
 * nowhere to write the override, so the toolbar button is not rendered at all.
 */
export function useChatSelfDestructTimer(chat: any) {
  const chatId = chat?.id;
  const timerPremium = !!useAppStore((state) => state.premiumEntitlement?.premium);
  const timerOverrides = useAppStore((state) => state.chatSelfDestruct);
  const timerGlobal = useAppStore((state) => state.selfDestructDefault);
  const setChatSelfDestruct = useAppStore((state) => state.setChatSelfDestruct);
  const timerOptions = selfDestructOptions(timerPremium);
  const timerValue =
    resolveSelfDestructTimer(chatId, timerGlobal, timerOverrides, timerPremium) ?? 'Off';
  const onCycleTimer = useCallback(() => {
    if (chatId === undefined || chatId === null) return;
    const idx = timerOptions.indexOf(timerValue);
    setChatSelfDestruct(chatId, timerOptions[(idx + 1) % timerOptions.length]);
  }, [chatId, timerOptions, timerValue, setChatSelfDestruct]);
  return { timerValue, onCycleTimer };
}
