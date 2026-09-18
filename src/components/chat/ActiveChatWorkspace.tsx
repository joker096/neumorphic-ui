import { lazy, Suspense, type Dispatch, type SetStateAction } from "react";
const LazyChatPreviewLayer = lazy(() =>
  import("../ChatPreviewLayer").then((m) => ({ default: m.ChatPreviewLayer })),
);

function ChatPreviewFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center" aria-hidden="true">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
}

type ActiveChatWorkspaceProps = {
  theme: "light" | "dark";
  activeChat: any;
  setActiveChat: (chat: any | null) => void;
  messageText: string;
  setMessageText: (text: string) => void;
  scheduleDateTime: string;
  showSchedulePopup: boolean;
  setShowSchedulePopup: (show: boolean) => void;
  setScheduleDateTime: (value: string) => void;
  isRecordingVoice: boolean;
  setIsRecordingVoice: (value: boolean) => void;
  voiceNoteError: string;
  showStickerPicker: boolean;
  setShowStickerPicker: (show: boolean) => void;
  morseMode: boolean;
  silentMode: boolean;
  replyTarget: any;
  setReplyTarget: (target: any) => void;
  draftTextByChat: Record<string, string>;
  setDraftTextByChat: Dispatch<SetStateAction<Record<string, string>>>;
  setChats: Dispatch<SetStateAction<any[]>>;
  setVoiceNoteError: (message: string) => void;
  setSilentMode: (enabled: boolean) => void;
  setMorseMode: (enabled: boolean) => void;
  handleSendMessage: () => void;
  sendVoiceMessage: (audioUrl: string, durationStr: string, blob?: Blob) => void;
  sendStickerMessage: (sticker: string) => void;
  savedMessages: any[];
  onToggleSavedMessage: (chatContext: any, message: any) => void;
  onPreviewCall: (name: string, color?: string) => void;
  onPreviewVideoCall: (name: string, color?: string) => void;
  onPreviewMessage: (name: string, color?: string) => void;
  setEditingContact: (contact: any | null) => void;
  onToggleMute: () => void;
  onAttachImage: (message: any) => void;
  onToggleSchedulePopup: () => void;
  onToggleSilent: () => void;
  onToggleMorse: () => void;
  onCloseChat?: () => void;
};

export const ActiveChatWorkspace = ({
  theme,
  activeChat,
  setActiveChat,
  messageText,
  setMessageText,
  scheduleDateTime,
  showSchedulePopup,
  setShowSchedulePopup,
  setScheduleDateTime,
  isRecordingVoice,
  setIsRecordingVoice,
  voiceNoteError,
  showStickerPicker,
  setShowStickerPicker,
  morseMode,
  silentMode,
  replyTarget,
  setReplyTarget,
  draftTextByChat,
  setDraftTextByChat,
  setChats,
  setVoiceNoteError,
  setSilentMode,
  setMorseMode,
  handleSendMessage,
  sendVoiceMessage,
  sendStickerMessage,
  savedMessages,
  onToggleSavedMessage,
  onPreviewCall,
  onPreviewVideoCall,
  onPreviewMessage,
  setEditingContact,
  onToggleMute,
  onAttachImage,
  onToggleSchedulePopup,
  onToggleSilent,
  onToggleMorse,
  onCloseChat,
}: ActiveChatWorkspaceProps) => (
 <div className="w-full max-w-full sm:max-w-[600px] md:max-w-[640px] lg:max-w-[800px] h-full md:h-[calc(100%-0.5rem)] relative z-10 md:z-10 animate-fade-in md:mt-2 max-h-[calc(100vh-2rem)]">
    <Suspense fallback={<ChatPreviewFallback />}>
      <LazyChatPreviewLayer
       chat={activeChat}
      theme={theme}
      onClose={() => (onCloseChat ? onCloseChat() : setActiveChat(null))}
      onUpdateChat={setActiveChat}
      onAction={(text: string) => (text === "MUTE_TOGGLE" ? setActiveChat({ ...activeChat, isMuted: !activeChat.isMuted }) : setMessageText(text))}
      onCall={onPreviewCall}
      onVideoCall={onPreviewVideoCall}
      onMessage={onPreviewMessage}
      onReply={(message: any) => setReplyTarget(message)}
      savedMessages={savedMessages}
      onToggleSavedMessage={onToggleSavedMessage}
      deliveryReceipts
      readReceipts
      setEditingContact={setEditingContact}
      // Pass input props to ChatPreviewLayer
      messageText={messageText}
      setMessageText={setMessageText}
      morseMode={morseMode}
      setMorseMode={setMorseMode}
      silentMode={silentMode}
      setSilentMode={setSilentMode}
      showStickerPicker={showStickerPicker}
      setShowStickerPicker={setShowStickerPicker}
      isRecordingVoice={isRecordingVoice}
      setIsRecordingVoice={setIsRecordingVoice}
      voiceNoteError={voiceNoteError}
      setVoiceNoteError={setVoiceNoteError}
      scheduleDateTime={scheduleDateTime}
      setScheduleDateTime={setScheduleDateTime}
      showSchedulePopup={showSchedulePopup}
      setShowSchedulePopup={setShowSchedulePopup}
      replyTarget={replyTarget}
      setReplyTarget={setReplyTarget}
      draftTextByChat={draftTextByChat}
      setDraftTextByChat={setDraftTextByChat}
      setChats={setChats}
      sendVoiceMessage={sendVoiceMessage}
      sendStickerMessage={sendStickerMessage}
      handleSendMessage={handleSendMessage}
      onScheduleChange={setScheduleDateTime}
      onToggleMute={onToggleMute}
      onAttachImage={onAttachImage}
      onToggleSchedulePopup={onToggleSchedulePopup}
      onToggleSilent={onToggleSilent}
      onToggleMorse={onToggleMorse}
        onToggleStickerPicker={() => setShowStickerPicker(!showStickerPicker)}
      />
    </Suspense>
   </div>
);
