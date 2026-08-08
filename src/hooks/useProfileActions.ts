import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { useAppStore } from "../store";
import { registerRiskSession, getLastActionDebugId } from "../utils/riskShell";
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

  const guard = useCallback(() => {
    if (!globalSelectedContact) return false;
    if (useAppStore.getState().riskShellActive) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return true;
    }
    return false;
  }, [globalSelectedContact]);

  const handleProfileCall = useCallback(() => {
    if (!globalSelectedContact || guard()) return;
    handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color, 'audio');
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, guard, handlePreviewCall, setGlobalSelectedContact]);

  const handleProfileVideoCall = useCallback(() => {
    if (!globalSelectedContact || guard()) return;
    handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color, 'video');
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, guard, handlePreviewCall, setGlobalSelectedContact]);

  const handleProfileMessage = useCallback(() => {
    if (!globalSelectedContact || guard()) return;
    handlePreviewMessage(globalSelectedContact.name, globalSelectedContact.color);
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, guard, handlePreviewMessage, setGlobalSelectedContact]);

  const handleProfileDelete = useCallback(() => {
    if (!globalSelectedContact) return;
    if (useAppStore.getState().riskShellActive) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return;
    }
    if (activeChat && activeChat.name === globalSelectedContact.name) setActiveChat(null);
    setChats((prev: any[]) => prev.filter((contact: any) => contact.name !== globalSelectedContact.name));
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, activeChat, setActiveChat, setChats, setGlobalSelectedContact]);

  const handleProfileEdit = useCallback(() => {
    if (!globalSelectedContact || guard()) return;
    setEditingContact(globalSelectedContact as any);
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, guard, setEditingContact, setGlobalSelectedContact]);

  const handleProfileBlock = useCallback(() => {
    if (!globalSelectedContact) return;
    if (useAppStore.getState().riskShellActive) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return;
    }
    if (activeChat && activeChat.name === globalSelectedContact.name) setActiveChat(null);
    setChats((prev: any[]) => prev.filter((contact: any) => contact.name !== globalSelectedContact.name));
    setGlobalSelectedContact(null);
  }, [globalSelectedContact, activeChat, setActiveChat, setChats, setGlobalSelectedContact]);

  const handleProfileToggleFavorite = useCallback((id: string, isFavorite: boolean) => {
    setContacts((prev: any[]) => prev.map((c: any) => c.id === id ? { ...c, isFavorite } : c));
    setGlobalSelectedContact((prev: any) => prev && prev.id === id ? { ...prev, isFavorite } : prev);
  }, [setContacts, setGlobalSelectedContact]);

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
