/**
 * JSON frame protocol for P2P chat text messages
 * Frames travel as raw string payloads over `p2pNetwork.broadcast()`
 * The receiving peer's identity is the wire `BroadcastMessage.senderId`,
 * not a field inside the frame.
 */

export const MSG_MAGIC = 'msg1:';

/** Text chat message carried across peers. */
export interface ChatTextFrame {
  type: 'chat-text';
  chatId: string;
  chatName: string;
  senderName: string;
  text: string;
  silent: boolean;
  timestamp: number;
}

/** Encode a frame as the wire payload (magic prefix + JSON). */
export function encodeChatText(frame: ChatTextFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

/** Parse a wire payload into a frame; null when the payload is not a frame. */
export function parseChatText(raw: string): ChatTextFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatTextFrame;
    return parsed.type === 'chat-text' ? parsed : null;
  } catch {
    return null;
  }
}
