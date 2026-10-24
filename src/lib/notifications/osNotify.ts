/**
 * OS-level notification bridge (Telegram/WhatsApp-style tap-to-open).
 *
 * The app keeps an in-app notification store (`notificationSlice`), but a
 * mobile user in another app only sees system notifications. This module fires
 * a real `Notification` when permission is granted and routes the click back to
 * the originating chat through a tiny event bus — the app subscribes to
 * `OPEN_CHAT_EVENT` and opens the chat (see `App.tsx`).
 */

export const OPEN_CHAT_EVENT = "messanger:open-chat";

export function emitOpenChat(chatId: string | number): void {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { chatId } }));
}

/**
 * Fire an OS notification. Never throws — the send path must not break because
 * the Notification constructor is unavailable or restricted.
 */
export function fireOsNotification(
  title: string,
  body: string | undefined,
  chatId?: string,
): void {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const n = new Notification(title, body ? { body } : undefined);
    if (chatId !== undefined) {
      n.onclick = () => {
        window.focus();
        emitOpenChat(chatId);
      };
    }
  } catch {
    /* restricted context / quota — best-effort only */
  }
}
