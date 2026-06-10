// Channel Moderation - Channel moderation service

export interface ModerationConfig {
  autoMod: boolean;
  bannedWords: string[];
  messageLimit: number;
  joinLimit: number;
  adminPermissions: string[];
}

export interface ModerationAction {
  userId: string;
  action: 'ban' | 'mute' | 'warn' | 'timeout';
  reason: string;
  duration?: number;
}

export class ChannelModerationService {
  private config: ModerationConfig = {
    autoMod: true,
    bannedWords: [],
    messageLimit: 5000,
    joinLimit: 100,
    adminPermissions: [],
  };

  private bannedUsers: Set<string> = new Set();
  private mutedUsers: Map<string, { until: number; reason: string }> = new Map();
  private actions: ModerationAction[] = [];

  setConfig(config: Partial<ModerationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  checkMessage(message: string, chatId: string): { allowed: boolean; reason?: string } {
    if (!this.config.autoMod) {
      return { allowed: true };
    }

    // Check for banned words
    for (const word of this.config.bannedWords) {
      if (message.toLowerCase().includes(word.toLowerCase())) {
        return { allowed: false, reason: `Message contains banned word: ${word}` };
      }
    }

    // Check message length
    if (message.length > this.config.messageLimit) {
      return { allowed: false, reason: 'Message too long' };
    }

    return { allowed: true };
  }

  banUser(userId: string, chatId: string): void {
    this.bannedUsers.add(userId);
    this.actions.push({
      userId,
      action: 'ban',
      reason: 'User banned by moderator',
    });
  }

  muteUser(userId: string, reason: string, duration?: number): void {
    this.mutedUsers.set(userId, {
      until: duration ? Date.now() + duration : Date.now() + 86400000, // Default 24 hours
      reason,
    });
    this.actions.push({
      userId,
      action: 'mute',
      reason,
      duration,
    });
  }

  isBanned(userId: string): boolean {
    return this.bannedUsers.has(userId);
  }

  isMuted(userId: string): boolean {
    const muted = this.mutedUsers.get(userId);
    if (!muted) {
      return false;
    }
    if (Date.now() > muted.until) {
      this.mutedUsers.delete(userId);
      return false;
    }
    return true;
  }

  getActions(): ModerationAction[] {
    return this.actions;
  }
}

export const channelModerationService = new ChannelModerationService();
