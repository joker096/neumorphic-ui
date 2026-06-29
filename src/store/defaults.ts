import type { BotPermissions } from './types';

/** Default bot permissions used when creating a new bot */
export const DEFAULT_BOT_PERMISSIONS: BotPermissions = {
  readMessages: true,
  sendMessages: true,
  editMessages: false,
  deleteMessages: false,
  inlineKeyboard: true,
  readUserData: false,
  accessGroups: false,
  accessFiles: false,
};
