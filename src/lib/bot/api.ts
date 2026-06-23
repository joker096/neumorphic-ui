import type { BotPermissions } from '../../store'

export interface BotCommand {
  command: string;
  data?: any;
}

export interface BotMessage {
  botId: string;
  command: string;
  data: any;
  timestamp: number;
}

export class BotApi {
  private bots: Map<string, { commands: Set<string>; handlers: Map<string, (data: any) => void>; permissions: BotPermissions }> = new Map();

  register(botId: string, permissions: BotPermissions = DEFAULT_RESTRICTED_PERMISSIONS): void {
    this.bots.set(botId, {
      commands: new Set(),
      handlers: new Map(),
      permissions,
    });
  }

  canExecute(botId: string, action: keyof BotPermissions): boolean {
    const bot = this.bots.get(botId);
    if (!bot) return false;
    return bot.permissions[action] === true;
  }

  send(botId: string, command: string, data?: any): Promise<{ success: boolean; response?: any }> {
    const bot = this.bots.get(botId);
    if (!bot) {
      return Promise.resolve({ success: false, error: 'Bot not found' });
    }
    if (!this.canExecute(botId, 'sendMessages')) {
      return Promise.resolve({ success: false, error: 'Permission denied: sendMessages' });
    }
    bot.handlers.set(command, (response: any) => {});
    return Promise.resolve({ success: true, response: data });
  }

  receive(botId: string, handler: (data: any) => void): void {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.handlers.set('message', handler);
    }
  }

  getRegisteredBots(): string[] {
    return Array.from(this.bots.keys());
  }
}

export const DEFAULT_RESTRICTED_PERMISSIONS: BotPermissions = {
  readMessages: false,
  sendMessages: false,
  editMessages: false,
  deleteMessages: false,
  inlineKeyboard: false,
  readUserData: false,
  accessGroups: false,
  accessFiles: false,
}

export const botApi = new BotApi();
