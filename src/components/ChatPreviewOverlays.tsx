import React from "react";
import { ChannelCommentsView } from "./ChannelCommentsView";
import { SavedMessagesPanel } from "./chat-preview/SavedMessagesPanel";
import { ContactProfileModal } from "./ContactProfileModal";
import type { ContactProfile } from "./ContactProfileModal";
const LazyMediaViewer = React.lazy(() => import("./MediaViewer").then((m) => ({ default: m.MediaViewer })));
const LazyChatProfileView = React.lazy(() => import("./ChatProfileView").then((m) => ({ default: m.ChatProfileView })));

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
      <ContactProfileModal
        contact={selectedContact}
        theme={theme}
        onClose={() => setSelectedContact(null)}
        onCall={handleCall}
        onVideoCall={handleVideoCall}
        onMessage={handleMessage}
        onDelete={() => setSelectedContact(null)}
        onEdit={() => { if (selectedContact) setEditingContact(selectedContact); setSelectedContact(null); }}
        onBlock={() => setSelectedContact(null)}
        onToggleFavorite={(id, isFavorite) => {
          setSelectedContact(prev => prev && prev.id === id ? { ...prev, isFavorite } : prev);
          if (chat) onUpdateChat?.({ ...chat, isFavorite });
        }}
      />
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
