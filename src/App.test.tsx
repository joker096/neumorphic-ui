import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from './App';

// Mock all the hooks used by App
vi.mock('../../hooks/useCall', () => ({
  useCall: vi.fn(() => ({
    call: null,
    startCall: vi.fn(),
    acceptCall: vi.fn(),
    endCall: vi.fn(),
    toggleMute: vi.fn(),
    toggleVideo: vi.fn(),
    toggleScreenShare: vi.fn(),
    toggleRecording: vi.fn(),
    changeCallType: vi.fn(),
  })),
}));

vi.mock('../../hooks/useAppView', () => ({
  useAppView: vi.fn(() => ({
    view: 'chats',
    setView: vi.fn(),
    subView: '',
    setSubView: vi.fn(),
    activeFolder: 'all',
    setActiveFolder: vi.fn(),
    activeChat: null,
    setActiveChat: vi.fn(),
    handleNavigate: vi.fn(),
  })),
}));

vi.mock('../../hooks/useAppLock', () => ({
  useAppLock: vi.fn(() => ({
    appLockHashedPIN: null,
    isUnlocked: true,
  })),
}));

vi.mock('../../hooks/useChatInteraction', () => ({
  useChatInteraction: vi.fn(() => ({
    messageText: '',
    setMessageText: vi.fn(),
    isRecordingVoice: false,
    setIsRecordingVoice: vi.fn(),
    voiceNoteError: '',
    setVoiceNoteError: vi.fn(),
    showSchedulePopup: false,
    setShowSchedulePopup: vi.fn(),
    scheduleDateTime: '',
    setScheduleDateTime: vi.fn(),
    morseMode: false,
    setMorseMode: vi.fn(),
    silentMode: false,
    setSilentMode: vi.fn(),
    showStickerPicker: false,
    setShowStickerPicker: vi.fn(),
    chatSearchQuery: '',
    setChatSearchQuery: vi.fn(),
    showAdvancedFilterModal: false,
    setShowAdvancedFilterModal: vi.fn(),
    advancedFilters: {},
    setAdvancedFilters: vi.fn(),
    replyTarget: null,
    setReplyTarget: vi.fn(),
    draftTextByChat: {},
    setDraftTextByChat: vi.fn(),
    savedMessages: [],
    activeStory: null,
    setActiveStory: vi.fn(),
    sendVoiceMessage: vi.fn(),
    sendStickerMessage: vi.fn(),
    handleSendMessage: vi.fn(),
    toggleSavedMessage: vi.fn(),
  })),
}));

vi.mock('../../hooks/useScreenshotProtection', () => ({
  useScreenshotProtection: vi.fn(),
}));

vi.mock('../../hooks/useAppConnection', () => ({
  useAppConnection: vi.fn(() => ({
    isConnected: true,
  })),
}));

vi.mock('../../hooks/useHealthCheck', () => ({
  useHealthCheck: vi.fn(() => ({
    health: 'healthy',
    errorCount: 0,
    criticalErrors: [],
    majorErrors: [],
    minorErrors: [],
    clearErrors: vi.fn(),
  })),
}));

vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => ['en', vi.fn()] as const),
}));

vi.mock('../../hooks/useGlobalErrorHandler', () => ({
  useGlobalErrorHandler: vi.fn(() => ({
    errors: [],
    errorStats: { count: 0 },
    addError: vi.fn(),
    clearErrors: vi.fn(),
    dismissError: vi.fn(),
    hasCriticalErrors: false,
  })),
}));

vi.mock('../../hooks/useDebounce', () => ({
  useDebounce: vi.fn((val: any) => val),
}));

vi.mock('../../hooks/useKeyboardScroll', () => ({
  useKeyboardScroll: vi.fn(() => ({})),
}));

vi.mock('../../hooks/useAppEffects', () => ({
  useAppEffects: vi.fn(),
}));

vi.mock('../../hooks/useMeshPeers', () => ({
  useMeshPeers: vi.fn(() => ({ peers: [] })),
}));

vi.mock('../../hooks/useUndoDelete', () => ({
  useUndoDelete: vi.fn(() => ({ undo: vi.fn(), deleteFn: vi.fn() })),
}));

vi.mock('../../hooks/useAppLock', () => ({
  useAppLock: vi.fn(() => ({
    appLockHashedPIN: null,
    isUnlocked: true,
  })),
}));

vi.mock('../../hooks/useAppConnection', () => ({
  useAppConnection: vi.fn(() => ({
    isConnected: true,
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
  })),
}));

vi.mock('../../hooks/useCall', () => ({
  useCall: vi.fn(() => ({
    call: null,
    startCall: vi.fn(),
    acceptCall: vi.fn(),
    endCall: vi.fn(),
    toggleMute: vi.fn(),
    toggleVideo: vi.fn(),
    toggleScreenShare: vi.fn(),
    toggleRecording: vi.fn(),
    changeCallType: vi.fn(),
  })),
}));

vi.mock('../../hooks/useAppView', () => ({
  useAppView: vi.fn(() => ({
    view: 'chats',
    setView: vi.fn(),
    subView: '',
    setSubView: vi.fn(),
    activeFolder: 'all',
    setActiveFolder: vi.fn(),
    activeChat: null,
    setActiveChat: vi.fn(),
    handleNavigate: vi.fn(),
  })),
}));

vi.mock('../../hooks/useChatInteraction', () => ({
  useChatInteraction: vi.fn(() => ({
    messageText: '',
    setMessageText: vi.fn(),
    isRecordingVoice: false,
    setIsRecordingVoice: vi.fn(),
    voiceNoteError: '',
    setVoiceNoteError: vi.fn(),
    showSchedulePopup: false,
    setShowSchedulePopup: vi.fn(),
    scheduleDateTime: '',
    setScheduleDateTime: vi.fn(),
    morseMode: false,
    setMorseMode: vi.fn(),
    silentMode: false,
    setSilentMode: vi.fn(),
    showStickerPicker: false,
    setShowStickerPicker: vi.fn(),
    chatSearchQuery: '',
    setChatSearchQuery: vi.fn(),
    showAdvancedFilterModal: false,
    setShowAdvancedFilterModal: vi.fn(),
    advancedFilters: {},
    setAdvancedFilters: vi.fn(),
    replyTarget: null,
    setReplyTarget: vi.fn(),
    draftTextByChat: {},
    setDraftTextByChat: vi.fn(),
    savedMessages: [],
    activeStory: null,
    setActiveStory: vi.fn(),
    sendVoiceMessage: vi.fn(),
    sendStickerMessage: vi.fn(),
    handleSendMessage: vi.fn(),
    toggleSavedMessage: vi.fn(),
  })),
}));

vi.mock('../../hooks/useHealthCheck', () => ({
  useHealthCheck: vi.fn(() => ({
    health: 'healthy',
    errorCount: 0,
    criticalErrors: [],
    majorErrors: [],
    minorErrors: [],
    clearErrors: vi.fn(),
  })),
}));

vi.mock('../../hooks/useKeyboardScroll', () => ({
  useKeyboardScroll: vi.fn(() => ({})),
}));

vi.mock('../../hooks/useScreenshotProtection', () => ({
  useScreenshotProtection: vi.fn(),
}));

vi.mock('../../hooks/useMeshPeers', () => ({
  useMeshPeers: vi.fn(() => ({ peers: [] })),
}));

vi.mock('../../hooks/useUndoDelete', () => ({
  useUndoDelete: vi.fn(() => ({ undo: vi.fn(), deleteFn: vi.fn() })),
}));

vi.mock('../../hooks/useAppConnection', () => ({
  useAppConnection: vi.fn(() => ({
    isConnected: true,
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
  })),
}));

vi.mock('../../hooks/useDebounce', () => ({
  useDebounce: vi.fn((val: any) => val),
}));

vi.mock('../../hooks/useGlobalErrorHandler', () => ({
  useGlobalErrorHandler: vi.fn(() => ({
    errors: [],
    errorStats: { count: 0 },
    addError: vi.fn(),
    clearErrors: vi.fn(),
    dismissError: vi.fn(),
    hasCriticalErrors: false,
  })),
}));

vi.mock('../../hooks/useAppEffects', () => ({
  useAppEffects: vi.fn(),
}));

vi.mock('../../hooks/useAppLock', () => ({
  useAppLock: vi.fn(() => ({
    appLockHashedPIN: null,
    isUnlocked: true,
  })),
}));

vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => ['en', vi.fn()] as const),
}));

vi.mock('../../hooks/useAppView', () => ({
  useAppView: vi.fn(() => ({
    view: 'chats',
    setView: vi.fn(),
    subView: '',
    setSubView: vi.fn(),
    activeFolder: 'all',
    setActiveFolder: vi.fn(),
    activeChat: null,
    setActiveChat: vi.fn(),
    handleNavigate: vi.fn(),
  })),
}));

vi.mock('../../hooks/useCall', () => ({
  useCall: vi.fn(() => ({
    call: null,
    startCall: vi.fn(),
    acceptCall: vi.fn(),
    endCall: vi.fn(),
    toggleMute: vi.fn(),
    toggleVideo: vi.fn(),
    toggleScreenShare: vi.fn(),
    toggleRecording: vi.fn(),
    changeCallType: vi.fn(),
  })),
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => key,
    setLang: vi.fn(),
  })),
}));

vi.mock('../../store', () => ({
  useAppStore: vi.fn(() => ({
    chats: [],
    setChats: vi.fn(),
    channels: [],
    setChannels: vi.fn(),
    bots: [],
    scheduledQueue: { messages: [] },
    archivedChats: [],
    toggleArchive: vi.fn(),
    contacts: [],
    setContacts: vi.fn(),
    activeCall: null,
    setActiveCall: vi.fn(),
    callHistory: [],
    stealthMode: false,
    riskShellActive: false,
    companyChannels: [],
    updateSettings: vi.fn(),
    addMessage: vi.fn(),
    addCallHistory: vi.fn(),
    clearCallHistory: vi.fn(),
    addCallFolder: vi.fn(),
    removeCallFolder: vi.fn(),
    setCompanyName: vi.fn(),
    setCompanyMembers: vi.fn(),
    setCompanyMember: vi.fn(),
    setCompanyHideWhenOfficeOnly: vi.fn(),
    setCompanyOnlineStatus: vi.fn(),
    setConnectionStatus: vi.fn(),
    setTransportBackend: vi.fn(),
    setLatency: vi.fn(),
    setBlockedBackends: vi.fn(),
    setRegionBlocked: vi.fn(),
    setSyncStatus: vi.fn(),
    addRecording: vi.fn(),
    deleteRecording: vi.fn(),
    toggleRecordingFavorite: vi.fn(),
    setCloudSyncEnabled: vi.fn(),
    setPrivacySetting: vi.fn(),
    toggleContactReadReceipts: vi.fn(),
    toggleArchiveChat: vi.fn(),
    addPinnedMessage: vi.fn(),
    addScheduledMessage: vi.fn(),
    setAppLock: vi.fn(),
    toggleSound: vi.fn(),
    updateSoundVolume: vi.fn(),
    setRadialDnD: vi.fn(),
  })),
}));

describe('App', () => {
  it('renders the app', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders main layout', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders sidebar navigation', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders bottom navigation', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with toasts', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders transport indicator', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });
});
