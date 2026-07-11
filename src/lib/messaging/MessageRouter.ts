// src/lib/messaging/MessageRouter.ts
import { MessageEnvelope } from './MessageEnvelope';

export class MessageRouter {
  private static routingTable: Map<string, string[]> = new Map();

  static routeMessage(msg: MessageEnvelope): string[] {
    if (msg.path && msg.path.length > 0) {
      return msg.path;
    }
    // Fallback: direct routing
    return [msg.recipient];
  }

  static addRoute(recipient: string, path: string[]): void {
    this.routingTable.set(recipient, path);
  }

  static getRoute(recipient: string): string[] | null {
    return this.routingTable.get(recipient) || null;
  }

  static clearRoutingTable(): void {
    this.routingTable.clear();
  }
}
