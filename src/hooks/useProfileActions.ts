import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ContactProfile } from "../components/ContactProfileModal";

export function useProfileActions(
  chats: any[],
  activeChat: any,
  globalSelectedContact: ContactProfile | null,
  setView: Dispatch<SetStateAction<any>>,
  setActiveChat: Dispatch<SetStateAction<any>>,
  setChats: Dispatch<SetStateAction<any>>,
  setContacts: Dispatch<SetStateAction<any>>,
  setGlobalSelectedContact: Dispatch<SetStateAction<any>>,
  setEditingContact: Dispatch<SetStateAction<any>>,
  handlePreviewCall: (name: string, color?: string, callType?: 'audio' | 'video') => void,
  handlePreviewMessage: (name: string, color?: string) => void,
) {

  const handleProfileCall = useCallback(() => {
    if (!globalSelectedContact) return;
    handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color, 'audio');
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, handlePreviewCall, setGlobalSelectedContact]);

  const handleProfileVideoCall = useCallback(() => {
    if (!globalSelectedContact) return;
    handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color, 'video');
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, handlePreviewCall, setGlobalSelectedContact]);

  const handleProfileMessage = useCallback(() => {
    if (!globalSelectedContact) return;
    handlePreviewMessage(globalSelectedContact.name, globalSelectedContact.color);
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, handlePreviewMessage, setGlobalSelectedContact]);

  const handleProfileDelete = useCallback(() => {
    if (!globalSelectedContact) return;
    if (activeChat && activeChat.name === globalSelectedContact.name) setActiveChat(null);
    setChats((prev: any[]) => prev.filter((contact: any) => contact.name !== globalSelectedContact.name));
    setContacts((prev: any[]) => (prev || []).filter((c: any) => c.name !== globalSelectedContact.name));
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, activeChat, setActiveChat, setChats, setContacts, setGlobalSelectedContact]);

  const handleProfileEdit = useCallback(() => {
    if (!globalSelectedContact) return;
    setEditingContact(globalSelectedContact as any);
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, setEditingContact, setGlobalSelectedContact]);

  const handleProfileBlock = useCallback(() => {
    if (!globalSelectedContact) return;
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, setGlobalSelectedContact]);

  const handleProfileToggleFavorite = useCallback((id: string, isFavorite: boolean) => {
    setContacts((prev: any[]) => (prev || []).map((c: any) => c.id === id ? { ...c, isFavorite } : c));
    setChats((prev: any[]) => (prev || []).map((c: any) => c.id === id ? { ...c, isFavorite } : c));
    setGlobalSelectedContact((prev: any) => prev && prev.id === id ? { ...prev, isFavorite } : prev);
  }, [setContacts, setChats, setGlobalSelectedContact]);

  return {
    handleProfileCall,
    handleProfileVideoCall,
    handleProfileMessage,
    handleProfileDelete,
    handleProfileEdit,
    handleProfileBlock,
    handleProfileToggleFavorite,
  };
}
