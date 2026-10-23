/**
 * Outgoing poll message.
 *
 * The ballot travels whole and the receiver rebuilds the same option ids, so
 * both sides agree on what a vote refers to; votes then travel as deltas.
 */

import { encodeChatPoll, nextFrameSeq } from '../../lib/p2p/chatFrame';
import { createPoll } from '../../lib/polls';
import { p2pNetwork } from '../../lib/p2p/network';
import { applySelfDestruct } from './outgoingMessage';
import { useAppStore } from '../../store';
import { formatClockTime } from '../../utils/chatUtils';
import { wireSelfDestructTtl } from '../../lib/selfDestruct';

interface SendPollDeps {
  chat: any;
  onUpdateChat?: (chat: any) => void;
  queueOffline: (message: any, onFail: () => void) => void;
  updateMsgStatusInChat: (chat: any, msgId: string | number, status: string) => void;
  markSendFailure: (chat: any, msgId: string | number) => void;
  silent: boolean;
}

/** Options the composer offers; the wire accepts up to ten. */
export const MAX_POLL_OPTIONS = 5;

export function sendPollMessage(
  deps: SendPollDeps,
  question: string,
  optionTexts: string[],
  multiple: boolean,
): void {
  const { chat, onUpdateChat, queueOffline, updateMsgStatusInChat, markSendFailure, silent } = deps;
  const cleanQuestion = String(question || '').trim();
  const cleanOptions = (optionTexts || [])
    .map((text) => String(text || '').trim())
    .filter(Boolean)
    .slice(0, MAX_POLL_OPTIONS);
  if (!cleanQuestion || cleanOptions.length < 2) return;
  const newMessage: any = {
    id: Date.now(),
    sender: 'me',
    type: 'poll',
    poll: createPoll(cleanQuestion, cleanOptions, !!multiple),
    text: cleanQuestion,
    ts: Date.now(),
    time: formatClockTime(Date.now()),
    status: navigator.onLine ? 'sent' : 'queued',
    silent,
  };
  applySelfDestruct(newMessage, chat?.id);
  queueOffline({ ...newMessage, chatId: chat.id, chatName: chat.name }, () =>
    updateMsgStatusInChat(chat, newMessage.id, 'failed'),
  );
  const updatedChat = { ...chat, history: [...(chat.history || []), newMessage] };
  if (onUpdateChat) onUpdateChat(updatedChat);
  const peer = p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name);
  if (!peer) return;
  const sender = useAppStore.getState().userProfile;
  void p2pNetwork.sendAddressed(peer, encodeChatPoll({
    type: 'chat-poll',
    seq: nextFrameSeq(),
    messageId: String(newMessage.id),
    chatId: String(chat.id),
    chatName: String(chat.name || ''),
    senderName: sender?.name || sender?.username || 'User',
    question: cleanQuestion,
    optionTexts: cleanOptions,
    multiple: !!multiple,
    silent: !!newMessage.silent,
    timestamp: Number(newMessage.id) || Date.now(),
    ttlMs: wireSelfDestructTtl(newMessage.selfDestructAt),
  })).then(() => updateMsgStatusInChat(updatedChat, newMessage.id, 'sent'))
    .catch(() => markSendFailure(updatedChat, newMessage.id));
}
