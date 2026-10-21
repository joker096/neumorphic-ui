import { useAppStore } from '../store';

/**
 * Root-level slice of the chat store that the shell and the overlays layer pass
 * down. Grouped in one place so `App` reads as composition instead of a wall of
 * selectors — the selectors themselves are unchanged, one per field.
 */
export function useAppStoreBindings() {
  const chats = useAppStore(s => s.chats);
  const setChats = useAppStore(s => s.setChats);
  const channels = useAppStore(s => s.channels);
  const setChannels = useAppStore(s => s.setChannels);
  const callHistory = useAppStore(s => s.callHistory);
  const setCallHistory = useAppStore(s => s.setCallHistory);
  const setBots = useAppStore(s => s.setBots);
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const draftsEnabled = useAppStore(s => s.draftsEnabled);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const setActiveCall = useAppStore(s => s.setActiveCall);
  const stealthMode = useAppStore(state => state.stealthMode);
  const hideWhenOfficeOnly = useAppStore(state => state.hideWhenOfficeOnly);
  const loadCompanyMessages = useAppStore(s => s.loadCompanyMessages);

  return {
    chats,
    setChats,
    channels,
    setChannels,
    callHistory,
    setCallHistory,
    setBots,
    scheduledQueue,
    draftsEnabled,
    contacts,
    setContacts,
    setActiveCall,
    stealthMode,
    hideWhenOfficeOnly,
    loadCompanyMessages,
  };
}
