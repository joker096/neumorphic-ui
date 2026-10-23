import { encodeChatPollVote, nextFrameSeq } from './chatFrame';
import { p2pNetwork } from './network';
import { useAppStore } from '../../store';
import type { VoteOp } from '../polls';

/**
 * Best-effort propagation of one poll vote to a direct chat's peer.
 *
 * The local store write is the source of truth (already applied by the caller);
 * this only mirrors the delta. No-op when the chat is not a direct chat or no
 * peer is currently bound — group polls stay local, exactly like group
 * retraction, because group frames are dropped on ingress.
 */
export function sendPollVote(
  chat: any,
  messageId: string | number,
  optionId: string,
  op: VoteOp,
): void {
  if (!chat) return;
  if (chat.type && chat.type !== 'direct') return;
  const peer = p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name);
  if (!peer) return;
  const sender = useAppStore.getState().userProfile;
  void p2pNetwork.sendAddressed(peer, encodeChatPollVote({
    type: 'chat-poll-vote',
    seq: nextFrameSeq(),
    messageId: String(messageId),
    chatId: String(chat.id),
    chatName: String(chat.name || ''),
    senderName: sender?.name || sender?.username || 'User',
    optionId,
    op,
    timestamp: Date.now(),
  })).catch(() => {});
}
