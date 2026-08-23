import { useEffect, useRef, useState } from 'react';
import { MOCK_DATA_ENABLED } from '../lib/mockDataFlag';
import * as idb from '../lib/idb';
import { logError } from '../lib/errorHandling';
import { markDataHydrated, useAppStore } from '../store';
import { loadCloudSyncMeta } from '../lib/cloudSync';
import { seedMockData } from '../utils/mockSeeding';
import type { Contact } from '../types/contact';
import type { P2PChannel } from '../store/types';

interface UseDataHydrationParams {
  setChats: (chats: any[]) => void;
  setContacts: (contacts: Contact[] | ((prev: Contact[]) => Contact[])) => void;
  setChannels: (channels: P2PChannel[] | ((prev: P2PChannel[]) => P2PChannel[])) => void;
  setCallHistory: (history: any[] | ((prev: any[]) => any[])) => void;
  loadCompanyMessages: () => void;
  callHistory: any[];
  chats: any[];
  contacts: Contact[];
  channels: P2PChannel[];
}

export const useDataHydration = ({
  setChats,
  setContacts,
  setChannels,
  setCallHistory,
  loadCompanyMessages,
  callHistory,
  chats,
  contacts,
  channels,
}: UseDataHydrationParams): { hydrated: boolean } => {
  const didSeedMockData = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate chats / contacts / channels / call history / company messages
  // from IndexedDB before mock seeding so user data is not overwritten.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedChats, storedContacts, storedChannels, storedCalls] = await Promise.all([
          idb.get<any[]>('chats_all'),
          idb.get<any[]>('contacts_all'),
          idb.get<any[]>('channels_all'),
          idb.get<any[]>('call_history_all'),
        ]);
        if (cancelled) return;
        if (storedChats?.length) setChats(storedChats);
        if (storedContacts?.length) setContacts(storedContacts);
        if (storedChannels?.length) setChannels(storedChannels);
        if (storedCalls?.length) setCallHistory(storedCalls);
        loadCompanyMessages();
        const meta = await loadCloudSyncMeta();
        if (meta) {
          useAppStore.getState().updateCloudSyncStatus({
            enabled: meta.enabled,
            lastSync: meta.lastSync,
            pendingChanges: meta.pendingChanges,
            status: meta.status === 'error' ? 'idle' : meta.status,
            errorMessage: null,
          });
        }
      } catch (e) {
        logError(e, 'hydrateFromIdb');
      } finally {
        if (!cancelled) {
          markDataHydrated();
          setHydrated(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [setChats, setContacts, setChannels, setCallHistory, loadCompanyMessages]);

  useEffect(() => {
    if (!hydrated) return;
    if (!MOCK_DATA_ENABLED) return;
    if (didSeedMockData.current) return;
    seedMockData(setChats, setContacts, setChannels, setCallHistory, callHistory, chats, contacts, channels);
    didSeedMockData.current = true;
  }, [hydrated, setChats, setContacts, setChannels, setCallHistory, callHistory, chats, contacts, channels]);

  return { hydrated };
};
