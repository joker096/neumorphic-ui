import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from './index';

vi.mock('../lib/deviceSecurity', () => ({
  deviceSecurity: {
    initSessionMasterKey: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../lib/errorHandling', () => ({
  logError: vi.fn(),
}));

vi.mock('../lib/idb', () => ({
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  getAllChats: vi.fn().mockResolvedValue([]),
  getAllContacts: vi.fn().mockResolvedValue([]),
  getAllChannels: vi.fn().mockResolvedValue([]),
  getAllBots: vi.fn().mockResolvedValue([]),
  getAllScheduledMessages: vi.fn().mockResolvedValue([]),
  getAllRecordings: vi.fn().mockResolvedValue([]),
  getAllCallHistory: vi.fn().mockResolvedValue([]),
  getAllCompanyMessages: vi.fn().mockResolvedValue([]),
}));

vi.mock('../lib/messageQueue', () => ({
  getPendingMessages: vi.fn().mockResolvedValue([]),
  markMessageSent: vi.fn(),
  retryMessage: vi.fn(),
}));

vi.mock('../lib/network/AtRestEncryption', () => ({
  AtRestEncryption: {
    init: vi.fn(),
    encryptObject: vi.fn().mockResolvedValue('encrypted'),
    decryptObject: vi.fn().mockResolvedValue({}),
  },
}));

describe('App Store', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct default state shape', () => {
      const state = useAppStore.getState();
      expect(state.chats).toEqual([]);
      expect(state.contacts).toEqual([]);
      expect(state.channels).toEqual([]);
      expect(state.bots).toEqual([]);
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.activeCall).toBeNull();
      expect(state.isOnline).toBe(true);
      expect(state.currentLanguage).toBe('en');
    });
  });

  describe('settings updates', () => {
    it('should update theme via updateSettings', () => {
      useAppStore.getState().updateSettings({ currentLanguage: 'de' });
      expect(useAppStore.getState().currentLanguage).toBe('de');
    });

    it('should toggle sound', () => {
      useAppStore.getState().setSoundEnabled(false);
      expect(useAppStore.getState().soundEnabled).toBe(false);
    });

    it('should update sound volume', () => {
      useAppStore.getState().setSoundVolume(0.5);
      expect(useAppStore.getState().soundVolume).toBe(0.5);
    });

    it('should toggle radial dnd', () => {
      useAppStore.getState().setRadialDnd(true);
      expect(useAppStore.getState().radialDnd).toBe(true);
    });

    it('should set app lock', () => {
      useAppStore.getState().setAppLock('hash123', 'salt456');
      expect(useAppStore.getState().appLockHashedPIN).toBe('hash123');
      expect(useAppStore.getState().appLockSalt).toBe('salt456');
    });

    it('should update multiple settings at once', () => {
      useAppStore.getState().updateSettings({
        currentLanguage: 'fr',
        soundEnabled: false,
        anonymousMode: true,
      });
      const state = useAppStore.getState();
      expect(state.currentLanguage).toBe('fr');
      expect(state.soundEnabled).toBe(false);
      expect(state.anonymousMode).toBe(true);
    });
  });

  describe('chat actions', () => {
    it('should send a message by updating chats', () => {
      const chat = { id: 'chat-1', name: 'Test', history: [] };
      useAppStore.getState().setChats([chat]);
      useAppStore.getState().setChats((prev: any[]) =>
        prev.map((c: any) =>
          c.id === 'chat-1'
            ? { ...c, history: [...c.history, { id: 1, text: 'Hello', sender: 'me' }] }
            : c
        )
      );
      const updated = useAppStore.getState().chats.find((c: any) => c.id === 'chat-1');
      expect(updated.history).toHaveLength(1);
      expect(updated.history[0].text).toBe('Hello');
    });

    it('should add a contact', () => {
      useAppStore.getState().setContacts([{ id: 'contact-1', name: 'Alice' } as any]);
      expect(useAppStore.getState().contacts).toHaveLength(1);
      expect(useAppStore.getState().contacts[0].name).toBe('Alice');
    });

    it('should add and remove favorites', () => {
      useAppStore.getState().addFavorite('contact-1');
      expect(useAppStore.getState().favoriteContacts).toContain('contact-1');
      useAppStore.getState().removeFavorite('contact-1');
      expect(useAppStore.getState().favoriteContacts).not.toContain('contact-1');
    });

    it('should forward a message to another chat', () => {
      const chat1 = { id: 'chat-1', name: 'Source', history: [{ id: 1, text: 'Fwd me' }] };
      const chat2 = { id: 'chat-2', name: 'Target', history: [] };
      useAppStore.getState().setChats([chat1, chat2]);
      useAppStore.getState().forwardMessage({ id: 1, text: 'Fwd me' }, 'chat-2');
      const target = useAppStore.getState().chats.find((c: any) => c.id === 'chat-2');
      expect(target.history).toHaveLength(1);
    });

    it('should pin and unpin a chat (max 3)', () => {
      const chats = [
        { id: '1', name: 'A', pinned: false },
        { id: '2', name: 'B', pinned: false },
        { id: '3', name: 'C', pinned: false },
        { id: '4', name: 'D', pinned: false },
      ];
      useAppStore.getState().setChats(chats);
      useAppStore.getState().pinChat('1');
      useAppStore.getState().pinChat('2');
      useAppStore.getState().pinChat('3');
      useAppStore.getState().pinChat('4');
      const pinned = useAppStore.getState().chats.filter((c: any) => c.pinned);
      expect(pinned).toHaveLength(3);
    });
  });

  describe('device pairing', () => {
    it('should add a device', () => {
      useAppStore.getState().addDevice({
        id: 'device-2',
        name: 'Mobile',
        platform: 'ios',
        lastActive: Date.now(),
        isCurrent: false,
      });
      expect(useAppStore.getState().devices).toHaveLength(2);
    });

    it('should remove a device', () => {
      useAppStore.getState().removeDevice('current-device');
      expect(useAppStore.getState().devices).toHaveLength(0);
    });

    it('should set pairing QR data', () => {
      useAppStore.getState().setPairingQrData('qr-data-string');
      expect(useAppStore.getState().pairingQrData).toBe('qr-data-string');
    });

    it('should set TOTP secret', () => {
      useAppStore.getState().setTotpSecret('totp-secret-123');
      expect(useAppStore.getState().totpSecret).toBe('totp-secret-123');
    });
  });

  describe('call state management', () => {
    it('should set active call', () => {
      const call = { id: 'call-1', peerId: 'peer-1', type: 'audio' } as any;
      useAppStore.getState().setActiveCall(call);
      expect(useAppStore.getState().activeCall).toEqual(call);
    });

    it('should add call to history', () => {
      useAppStore.getState().addCallToHistory({ name: 'Alice', type: 'incoming', duration: '1:30' });
      expect(useAppStore.getState().callHistory).toHaveLength(1);
      expect(useAppStore.getState().callHistory[0].name).toBe('Alice');
    });

    it('should clear call history', () => {
      useAppStore.getState().addCallToHistory({ name: 'Alice', type: 'missed' });
      useAppStore.getState().clearCallHistory();
      expect(useAppStore.getState().callHistory).toHaveLength(0);
    });

    it('should add and remove call folders', () => {
      useAppStore.getState().addCallFolder({ name: 'Work', filter: 'all' });
      expect(useAppStore.getState().callFolders).toHaveLength(4);
      const folderId = useAppStore.getState().callFolders[3].id;
      useAppStore.getState().removeCallFolder(folderId);
      expect(useAppStore.getState().callFolders).toHaveLength(3);
    });
  });

  describe('company member management', () => {
    it('should set company ID', () => {
      useAppStore.getState().setCompanyId('company-1');
      expect(useAppStore.getState().companyId).toBe('company-1');
    });

    it('should set company name', () => {
      useAppStore.getState().setCompanyName('Acme Corp');
      expect(useAppStore.getState().companySettings?.name).toBe('Acme Corp');
    });

    it('should set company members', () => {
      const members = [{ id: 'member-1', name: 'Alice', role: 'admin' }] as any;
      useAppStore.getState().setCompanyMembers(members);
      expect(useAppStore.getState().companyMembers).toEqual(members);
    });

    it('should update company field', () => {
      useAppStore.getState().setCompanySettings({ name: 'Acme', logo: '' });
      useAppStore.getState().updateCompanyField('name', 'Acme Corp');
      expect(useAppStore.getState().companySettings?.name).toBe('Acme Corp');
    });

    it('should set hideWhenOfficeOnly', () => {
      useAppStore.getState().setHideWhenOfficeOnly(true);
      expect(useAppStore.getState().hideWhenOfficeOnly).toBe(true);
    });

    it('should toggle online status', () => {
      useAppStore.getState().setOnlineStatus(false);
      expect(useAppStore.getState().isOnline).toBe(false);
    });
  });

  describe('connection state', () => {
    it('should set connection status', () => {
      useAppStore.getState().setConnectionStatus('connected');
      expect(useAppStore.getState().connectionStatus).toBe('connected');
    });

    it('should set transport backend', () => {
      useAppStore.getState().setTransportBackend('relay');
      expect(useAppStore.getState().transportBackend).toBe('relay');
    });

    it('should set latency', () => {
      useAppStore.getState().setLatency(42);
      expect(useAppStore.getState().latencyMs).toBe(42);
    });

    it('should set blocked backends', () => {
      useAppStore.getState().setBlockedBackends(['relay', 'direct']);
      expect(useAppStore.getState().blockedBackends).toEqual(['relay', 'direct']);
    });

    it('should set region blocked', () => {
      useAppStore.getState().setRegionBlocked(true);
      expect(useAppStore.getState().regionBlocked).toBe(true);
    });

    it('should set sync status', () => {
      useAppStore.getState().setSyncStatus('syncing');
      expect(useAppStore.getState().syncStatus).toBe('syncing');
    });
  });

  describe('media / camera state', () => {
    it('should add a recording', () => {
      useAppStore.getState().addRecording({ id: 'rec-1', name: 'Meeting' });
      expect(useAppStore.getState().recordings).toHaveLength(1);
    });

    it('should delete a recording', () => {
      useAppStore.getState().addRecording({ id: 'rec-1', name: 'Meeting' });
      useAppStore.getState().deleteRecording('rec-1');
      expect(useAppStore.getState().recordings).toHaveLength(0);
    });

    it('should toggle recording favorite', () => {
      useAppStore.getState().addRecording({ id: 'rec-1', name: 'Meeting', isFavorite: false });
      useAppStore.getState().toggleFavorite('rec-1');
      expect(useAppStore.getState().recordings[0].isFavorite).toBe(true);
    });

    it('should set cloud sync enabled', () => {
      useAppStore.getState().setCloudSyncEnabled(true);
      expect(useAppStore.getState().cloudSync.enabled).toBe(true);
    });

    it('should trigger cloud sync and update status', async () => {
      await useAppStore.getState().triggerCloudSync();
      expect(useAppStore.getState().cloudSync.status).toBe('success');
      expect(useAppStore.getState().cloudSync.lastSync).not.toBeNull();
    });
  });

  describe('persistence and helpers', () => {
    it('should persist privacy settings to localStorage on change', () => {
      useAppStore.getState().updateSettings({ currentLanguage: 'es' });
      const stored = JSON.parse(localStorage.getItem('mess_privacy_settings_v2') || '{}');
      expect(stored.currentLanguage).toBe('es');
    });

    it('should toggle contact read receipts', () => {
      useAppStore.getState().toggleContactReadReceipt('chat-1', true);
      expect(useAppStore.getState().contactReadReceipts['chat-1']).toBe(true);
    });

    it('should toggle archive chat', () => {
      useAppStore.getState().toggleArchive('chat-1');
      expect(useAppStore.getState().archivedChats).toContain('chat-1');
      useAppStore.getState().toggleArchive('chat-1');
      expect(useAppStore.getState().archivedChats).not.toContain('chat-1');
    });

    it('should add and remove pinned messages', () => {
      useAppStore.getState().addPinnedMessage({ id: 1, chatId: 'chat-1', pinBy: 'me' });
      expect(useAppStore.getState().pinnedMessageList).toHaveLength(1);
      useAppStore.getState().removePinnedMessage(1);
      expect(useAppStore.getState().pinnedMessageList).toHaveLength(0);
    });

    it('should handle scheduled queue messages', () => {
      useAppStore.getState().scheduledQueue.addMessage({ id: 'sched-1', chatId: 'chat-1', text: 'Later', scheduledAt: Date.now() + 10000 });
      expect(useAppStore.getState().scheduledQueue.messages).toHaveLength(1);
      useAppStore.getState().scheduledQueue.removeMessage('sched-1');
      expect(useAppStore.getState().scheduledQueue.messages).toHaveLength(0);
    });
  });
});
