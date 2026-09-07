import React from "react";
import { useAppStore } from "../store";
import { ChannelCommentsView } from "./ChannelCommentsView";
import { SavedMessagesPanel } from "./chat-preview/SavedMessagesPanel";
import type { ContactProfile } from "./ContactProfileModal";
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
  setPhotoOpen: (open: boolean) => void;
  setVideoOpen: (open: boolean) => void;
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
}

export function ChatPreviewOverlays({
  chat, isDark, theme,
  photoOpen, videoOpen, activePhotoUrl,
  setPhotoOpen, setVideoOpen,
  showComments, activePostId, setShowComments,
  showSavedPanel, setShowSavedPanel, chatSavedMessages, onToggleSavedMessage,
  t,
  selectedContact, setSelectedContact, setEditingContact,
  onUpdateChat, onCall, onVideoCall, onMessage,
  profileOpen, setProfileOpen,
  onClosePreview,
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

  const pushNotification = useAppStore((s) => s.pushNotification);
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
  const prevMsgCount = React.useRef(0);
  React.useEffect(() => {
    if (!chat) return;
    const msgs = chat.messages;
    const len = Array.isArray(msgs) ? msgs.length : 0;
    if (prevMsgCount.current && len > prevMsgCount.current) {
      const added = msgs.slice(prevMsgCount.current);
      added.forEach((m: any) => {
        if (m && !m.isMe) {
          const kind = chat.type === "group" ? "group" : chat.type === "channel" ? "channel" : "message";
          pushNotification({ title: chat.name, body: typeof m.text === "string" ? m.text : "", kind, chatId: chat.id });
        }
      });
    }
    prevMsgCount.current = len;
  }, [chat, pushNotification]);

  return (
    <>
      {(photoOpen || videoOpen) && (
        <React.Suspense fallback={null}>
          <LazyMediaViewer
            media={
              photoOpen
                ? { type: 'photo', url: activePhotoUrl ?? undefined, caption: chat.name }
                : { type: 'video', caption: chat.name }
            }
            onClose={() => { setPhotoOpen(false); setVideoOpen(false); }}
            isDark={isDark}
          />
        </React.Suspense>
      )}
      <ChannelCommentsView isOpen={showComments} postId={activePostId || 0} onClose={() => setShowComments(false)} theme={theme} />
      <SavedMessagesPanel show={showSavedPanel} isDark={isDark} chatSavedMessages={chatSavedMessages} chatName={chat.name} onClose={() => setShowSavedPanel(false)} onToggleSavedMessage={(c, msg) => onToggleSavedMessage?.(c, msg)} t={t} />
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
