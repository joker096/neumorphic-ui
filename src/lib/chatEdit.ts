import { parseMentions } from '../constants';
import { encodeChatEdit, nextFrameSeq } from './p2p/chatFrame';
import { p2pNetwork } from './p2p/network';
import { useAppStore } from '../store';

export function executeEditMessage(messageId: number, newText: string, chatContext: any = null) {
  const trimmed = newText.trim();
  if (!trimmed) return;

  const { text: parsedText, mentions } = parseMentions(trimmed);
  const patch = (m: any) => m.id === messageId
    ? { ...m, text: parsedText, edited: true, mentions: mentions.length > 0 ? mentions : undefined }
    : m;

  const st = useAppStore.getState();
  const setChats = st.setChats;

  if (typeof setChats === "function") {
    setChats((prevChats: any[]) => (prevChats || []).map((c: any) =>
      c.id === (chatContext ? chatContext.id : undefined)
        ? { ...c, history: (c.history || []).map(patch) }
        : c,
    ));
  }

  const sender = st.userProfile;
  const frame = encodeChatEdit({
    type: "chat-edit",
    seq: nextFrameSeq(),
    messageId: String(messageId),
    chatId: String(chatContext ? chatContext.id : ""),
    chatName: String(chatContext?.name || ""),
    senderName: sender?.name || sender?.username || "User",
    text: parsedText,
    timestamp: Date.now(),
  });
  void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chatContext?.id) ?? p2pNetwork.peerForChatName(chatContext?.name), frame)
    .catch(() => {});
}
