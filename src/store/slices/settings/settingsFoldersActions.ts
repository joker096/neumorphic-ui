import type { SettingsSlice } from "../settingsSlice";
import { persistSetting } from "./settingsPersist";
import {
  createCustomFolderId,
  sanitizeCustomFolderName,
  type ChatFolder,
} from "../../../lib/chat/customFolders";

export const createFoldersActions = (
  set: any,
  get: any,
): Pick<
  SettingsSlice,
  | "addCustomFolder"
  | "renameCustomFolder"
  | "deleteCustomFolder"
  | "setCustomFolderChats"
> => ({
  addCustomFolder: (name) => {
    const trimmed = sanitizeCustomFolderName(name);
    if (!trimmed) return;
    const next: ChatFolder[] = [
      ...get().customFolders,
      { id: createCustomFolderId(), name: trimmed, chatIds: [] },
    ];
    set({ customFolders: next });
    persistSetting("customFolders", next);
  },
  renameCustomFolder: (id, name) => {
    const trimmed = sanitizeCustomFolderName(name);
    if (!trimmed) return;
    const next: ChatFolder[] = get().customFolders.map((f: ChatFolder) =>
      f.id === id ? { ...f, name: trimmed } : f,
    );
    set({ customFolders: next });
    persistSetting("customFolders", next);
  },
  deleteCustomFolder: (id) => {
    const next: ChatFolder[] = get().customFolders.filter((f: ChatFolder) => f.id !== id);
    set({ customFolders: next });
    persistSetting("customFolders", next);
  },
  setCustomFolderChats: (id, chatIds) => {
    const next: ChatFolder[] = get().customFolders.map((f: ChatFolder) =>
      f.id === id ? { ...f, chatIds } : f,
    );
    set({ customFolders: next });
    persistSetting("customFolders", next);
  },
});
