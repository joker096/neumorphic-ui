// Bot API - Bot API for interacting with bot services

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
  private bots: Map<string, { commands: Set<string>; handlers: Map<string, (data: any) => void> }> = new Map();

  register(botId: string): void {
    this.bots.set(botId, {
      commands: new Set(),
      handlers: new Map(),
    });
  }

  send(botId: string, command: string, data?: any): Promise<{ success: boolean; response?: any }> {
    const bot = this.bots.get(botId);
    if (!bot) {
      return Promise.resolve({ success: false });
    }

    // Execute command
    bot.handlers.set(command, (response: any) => {
      // Handle response
    });

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

export const botApi = new BotApi();
