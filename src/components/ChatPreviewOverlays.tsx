import React from "react";
import { useAppStore } from "../store";
import { ChannelCommentsView } from "./ChannelCommentsView";
import { SavedMessagesPanel } from "./chat-preview/SavedMessagesPanel";
import { MessageThreadPanel } from "./chat-preview/MessageThreadPanel";
import type { ContactProfile } from "./ContactProfileModal";
import { formatSize } from "../utils/formatSize";
const LazyMediaViewer = React.lazy(() => import("./MediaViewer").then((m) => ({ default: m.MediaViewer })));
const LazyChatProfileView = React.lazy(() => import("./ChatProfileView").then((m) => ({ default: m.ChatProfileView })));
const LazyContactProfileModal = React.lazy(() => import("./ContactProfileModal").then((m) => ({ default: m.ContactProfileModal })));

type TranslateFn = (key: string, fallback?: string | Record<string, string | number>) => string;

interface ChatPreviewOverlaysProps {
  chat: any;
  isDark: boolean;
  theme: "light" | "dark";
  photoOpen: boolean;
  videoOpen: boolean;
  activePhotoUrl: string | null;
  activeMediaMsg?: any;
  setActiveMediaMsg?: (msg: any) => void;
  setPhotoOpen: (open: boolean) => void;
  setVideoOpen: (open: boolean) => void;
  onForward?: (msg: any) => void;
  onDelete?: (msg: any) => void;
  showComments: boolean;
  activePostId: number | null;
  setShowComments: (show: boolean) => void;
  showSavedPanel: boolean;
  setShowSavedPanel: (show: boolean) => void;
  chatSavedMessages: any[];
  onToggleSavedMessage?: (chat: any, message: any) => void;
  t: TranslateFn;
  selectedContact: ContactProfile | null;
  setSelectedContact: React.Dispatch<React.SetStateAction<ContactProfile | null>>;
  setEditingContact: (contact: ContactProfile | null) => void;
  onUpdateChat?: (chat: any) => void;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  profileOpen: boolean;
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClosePreview?: () => void;
  threadOpen: boolean;
  threadRoot?: any;
  threadReplies: any[];
  onCloseThread: () => void;
  onSendThreadReply: (text: string) => void;
}

export function ChatPreviewOverlays({
  chat, isDark, theme,
  photoOpen, videoOpen, activePhotoUrl,
  activeMediaMsg, setActiveMediaMsg,
  setPhotoOpen, setVideoOpen,
  showComments, activePostId, setShowComments,
  showSavedPanel, setShowSavedPanel, chatSavedMessages, onToggleSavedMessage,
  t,
  selectedContact, setSelectedContact, setEditingContact,
  onUpdateChat, onCall, onVideoCall, onMessage,
  profileOpen, setProfileOpen,
  onClosePreview,
  onForward, onDelete,
  threadOpen, threadRoot, threadReplies, onCloseThread, onSendThreadReply,
}: ChatPreviewOverlaysProps) {
  const handleCall = () => {
    if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color);
    setSelectedContact(null);
  };
  const handleVideoCall = () => {
    if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
    setSelectedContact(null);
  };
  const handleMessage = () => {
    if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
    setSelectedContact(null);
  };

  const setChats = useAppStore((s) => s.setChats);
  const setContacts = useAppStore((s) => s.setContacts);

  const handleDeleteContact = () => {
    if (selectedContact) {
      setContacts((prev: any[]) => (prev || []).filter((c: any) => c.name !== selectedContact.name));
      if (chat && chat.type !== "group" && chat.type !== "channel") {
        setChats((prev: any[]) => (prev || []).filter((c: any) => c.name !== selectedContact.name));
        onClosePreview?.();
      }
    }
    setSelectedContact(null);
  };

  return (
    <>
      {(photoOpen || videoOpen) && (
        <React.Suspense fallback={null}>
          <LazyMediaViewer
            media={
              photoOpen
                ? {
                    type: 'photo',
                    url: activePhotoUrl ?? undefined,
                    caption: chat.name,
                    name: activeMediaMsg?.fileName,
                    size: typeof activeMediaMsg?.fileSize === "number" ? formatSize(activeMediaMsg.fileSize) : undefined,
                  }
                : { type: 'video', caption: chat.name, name: activeMediaMsg?.fileName }
            }
            message={activeMediaMsg}
            prev={undefined}
            next={undefined}
            onClose={() => { setPhotoOpen(false); setVideoOpen(false); setActiveMediaMsg?.(null); }}
            isDark={isDark}
            onToggleSave={onToggleSavedMessage ? (m: any) => onToggleSavedMessage(chat, m) : undefined}
            onForward={onForward}
            onDelete={onDelete}
          />
        </React.Suspense>
      )}
      <ChannelCommentsView isOpen={showComments} postId={activePostId || 0} onClose={() => setShowComments(false)} theme={theme} />
      <SavedMessagesPanel show={showSavedPanel} isDark={isDark} chatSavedMessages={chatSavedMessages} chatName={chat.name} onClose={() => setShowSavedPanel(false)} onToggleSavedMessage={(c, msg) => onToggleSavedMessage?.(c, msg)} t={t} />
      <MessageThreadPanel
        open={threadOpen}
        isDark={isDark}
        rootMessage={threadRoot}
        replies={threadReplies}
        t={t}
        onClose={onCloseThread}
        onSend={onSendThreadReply}
      />
      {selectedContact && (
        <React.Suspense fallback={null}>
          <LazyContactProfileModal
            contact={selectedContact}
            theme={theme}
            onClose={() => setSelectedContact(null)}
            onCall={handleCall}
            onVideoCall={handleVideoCall}
            onMessage={handleMessage}
            onDelete={handleDeleteContact}
            onEdit={() => { if (selectedContact) setEditingContact(selectedContact); setSelectedContact(null); }}
            onBlock={() => setSelectedContact(null)}
            onToggleFavorite={(id, isFavorite) => {
              setSelectedContact(prev => prev && prev.id === id ? { ...prev, isFavorite } : prev);
              if (chat) onUpdateChat?.({ ...chat, isFavorite });
            }}
          />
        </React.Suspense>
      )}
      {profileOpen && (
        <React.Suspense fallback={null}>
          <LazyChatProfileView
            open={profileOpen}
            chat={chat}
            isDark={isDark}
            onClose={() => setProfileOpen(false)}
            onMessage={() => setProfileOpen(false)}
            onCall={onCall ? () => { onCall(chat.name, chat.color); setProfileOpen(false); } : undefined}
            onVideoCall={onVideoCall ? () => { onVideoCall(chat.name, chat.color); setProfileOpen(false); } : undefined}
          />
        </React.Suspense>
      )}
    </>
  );
}
