import React from "react";
import { FeatureViews } from "../../lib/lazyViews";

interface FeatureViewsWrapperProps {
  view: string;
  subView: string | null;
  setSubView: React.Dispatch<React.SetStateAction<string | null>>;
  contacts: any[];
  setContacts: (updater: any[] | ((prev: any[]) => any[])) => void;
  showContactPicker: boolean;
  setShowContactPicker: (v: boolean) => void;
  setEditingContact: (c: any) => void;
  chats: any[];
  setChats: (updater: any[] | ((prev: any[]) => any[])) => void;
  setActiveChat: (c: any) => void;
  setView: (v: string) => void;
  onCall: (name: string, color?: string) => void;
  onVideoCall: (name: string, color?: string) => void;
  onMessage: (name: string, color?: string) => void;
  fontSize: string;
  setFontSize: (s: string) => void;
}

export function FeatureViewsWrapper({
  view, subView, setSubView, contacts, setContacts, showContactPicker, setShowContactPicker,
  setEditingContact, chats, setChats, setActiveChat, setView,
  onCall, onVideoCall, onMessage, fontSize, setFontSize,
}: FeatureViewsWrapperProps) {
  return (
    <FeatureViews
      view={view}
      subView={subView}
      setSubView={setSubView as any}
      contacts={contacts}
      setContacts={setContacts as any}
      showContactPicker={showContactPicker}
      setShowContactPicker={setShowContactPicker}
      setEditingContact={setEditingContact}
      chats={chats}
      setChats={setChats as any}
      setActiveChat={setActiveChat}
      setView={setView as any}
      onCall={onCall}
      onVideoCall={onVideoCall}
      onMessage={onMessage}
      fontSize={fontSize}
      setFontSize={setFontSize}
    />
  );
}
