/**
 * Custom chat folders — user-created membership folders on top of the built-in
 * folder set (`CHAT_FOLDER_KEYS`). A folder is a name plus the explicit list of
 * chat (and channel) ids that belong to it; `chatInFolder`/`channelInFolder`
 * treat a custom folder as exact `chatIds` membership.
 */

export interface ChatFolder {
  id: string;
  name: string;
  chatIds: Array<string | number>;
}

export const MAX_CUSTOM_FOLDER_NAME = 30;

let fallbackSeq = 0;

/** Unique, stable folder id. Prefers `crypto.randomUUID` when available. */
export function createCustomFolderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  fallbackSeq += 1;
  return `cf-${Date.now()}-${fallbackSeq}`;
}

/** Trims and caps the folder name (an empty result means the name is invalid). */
export function sanitizeCustomFolderName(name: string): string {
  return String(name ?? "").trim().slice(0, MAX_CUSTOM_FOLDER_NAME);
}

/** Membership test — ids are compared after stringification (chat ids are mixed number/string). */
export function folderHasChat(folder: ChatFolder, chatId: string | number): boolean {
  return folder.chatIds.some((id) => String(id) === String(chatId));
}

/** Returns a copy with `chatId` toggled (present → removed, absent → added). */
export function toggleChatInFolder(folder: ChatFolder, chatId: string | number): ChatFolder {
  const has = folderHasChat(folder, chatId);
  return {
    ...folder,
    chatIds: has
      ? folder.chatIds.filter((id) => String(id) !== String(chatId))
      : [...folder.chatIds, chatId],
  };
}
