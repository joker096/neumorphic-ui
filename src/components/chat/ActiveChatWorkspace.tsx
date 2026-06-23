import type { Dispatch, SetStateAction } from "react";
import { ChatInputOverlay } from "../ChatInputOverlay";
import { ChatPreviewLayer } from "../ChatPreviewLayer";

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
  setChannels: Dispatch<SetStateAction<any[]>>;
  setVoiceNoteError: (message: string) => void;
  setSilentMode: (enabled: boolean) => void;
  setMorseMode: (enabled: boolean) => void;
  handleSendMessage: () => void;
  sendVoiceMessage: (audioUrl: string, durationStr: string) => void;
  sendStickerMessage: (sticker: string) => void;
  savedMessages: any[];
  onToggleSavedMessage: (chatContext: any, message: any) => void;
  onPreviewCall: (name: string, color?: string) => void;
  onPreviewVideoCall: (name: string, color?: string) => void;
  onPreviewMessage: (name: string, color?: string) => void;
  setEditingContact: (contact: any | null) => void;
  onToggleMute: () => void;
  onAttachImage: (message: any) => void;
  onHoldRecord: () => void;
  onReRecord: () => void;
  onPermissionDenied: (message: string) => void;
  onSendVoice: (url: string, duration: string) => void;
  onToggleSchedulePopup: () => void;
  onToggleSilent: () => void;
  onToggleMorse: () => void;
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
  setChannels,
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
  onHoldRecord,
  onReRecord,
  onPermissionDenied,
  onSendVoice,
  onToggleSchedulePopup,
  onToggleSilent,
  onToggleMorse,
}: ActiveChatWorkspaceProps) => (
  <div className="w-full max-w-[800px] h-[90%] relative z-10 animate-fade-in mt-6 max-h-[800px]">
    <ChatPreviewLayer
      chat={activeChat}
      theme={theme}
      onClose={() => setActiveChat(null)}
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
    />
    <ChatInputOverlay
      theme={theme}
      activeChat={activeChat}
      messageText={messageText}
      setMessageText={setMessageText}
      scheduleDateTime={scheduleDateTime}
      showSchedulePopup={showSchedulePopup}
      setShowSchedulePopup={setShowSchedulePopup}
      setScheduleDateTime={setScheduleDateTime}
      isRecordingVoice={isRecordingVoice}
      setIsRecordingVoice={setIsRecordingVoice}
      voiceNoteError={voiceNoteError}
      showStickerPicker={showStickerPicker}
      setShowStickerPicker={setShowStickerPicker}
      morseMode={morseMode}
      silentMode={silentMode}
      replyTarget={replyTarget}
      setReplyTarget={setReplyTarget}
      draftTextByChat={draftTextByChat}
      setDraftTextByChat={setDraftTextByChat}
      setChats={setChats}
      setChannels={setChannels}
      setActiveChat={setActiveChat}
      setVoiceNoteError={setVoiceNoteError}
      setSilentMode={setSilentMode}
      setMorseMode={setMorseMode}
      handleSendMessage={handleSendMessage}
      sendVoiceMessage={sendVoiceMessage}
      sendStickerMessage={sendStickerMessage}
      onScheduleChange={setScheduleDateTime}
      onToggleMute={onToggleMute}
      onAttachImage={onAttachImage}
      onToggleSchedulePopup={onToggleSchedulePopup}
      onToggleSilent={onToggleSilent}
      onToggleMorse={onToggleMorse}
      onHoldRecord={onHoldRecord}
      onReRecord={onReRecord}
      onPermissionDenied={onPermissionDenied}
      onSendVoice={onSendVoice}
      onToggleStickerPicker={() => setShowStickerPicker(!showStickerPicker)}
      onSendSticker={sendStickerMessage}
      isDark={theme === "dark"}
    />
  </div>
);
