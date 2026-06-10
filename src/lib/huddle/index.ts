// Huddle - Group call management

export interface HuddleMessage {
  type: 'join' | 'leave' | 'message' | 'audio' | 'video' | 'chat';
  content: any;
  timestamp: number;
}

export interface HuddleConfig {
  chatId: string;
  participants: string[];
  maxParticipants: number;
}

export class HuddleManager {
  private huddles: Map<string, { participants: string[]; messages: HuddleMessage[] }> = new Map();

  createHuddle(config: HuddleConfig): { huddleId: string; status: string } {
    const huddleId = crypto.randomUUID();

    this.huddles.set(huddleId, {
      participants: config.participants,
      messages: [],
    });

    return { huddleId, status: 'created' };
  }

  joinHuddle(huddleId: string, participantId: string): { status: string } {
    const huddle = this.huddles.get(huddleId);
    if (!huddle) {
      return { status: 'not-found' };
    }

    huddle.participants.push(participantId);

    return { status: 'joined' };
  }

  sendMessage(huddleId: string, message: any): { status: string } {
    const huddle = this.huddles.get(huddleId);
    if (!huddle) {
      return { status: 'not-found' };
    }

    const huddleMessage: HuddleMessage = {
      type: 'message',
      content: message,
      timestamp: Date.now(),
    };

    huddle.messages.push(huddleMessage);

    return { status: 'sent' };
  }

  leaveHuddle(huddleId: string, participantId: string): { status: string } {
    const huddle = this.huddles.get(huddleId);
    if (!huddle) {
      return { status: 'not-found' };
    }

    huddle.participants = huddle.participants.filter((p) => p !== participantId);

    return { status: 'left' };
  }

  getHuddle(huddleId: string): { participants: string[]; messages: HuddleMessage[] } | null {
    return this.huddles.get(huddleId) || null;
  }
}

export const huddleManager = new HuddleManager();
