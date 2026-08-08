import React, { useEffect, useState, useMemo, useCallback } from "react";
import { AppOverlays, AppLockScreen } from "./components/app";
import { SafeRender } from "./components/resilience";
import { MOCK_DATA_ENABLED } from "./lib/mockDataFlag";
import { useCall } from "./hooks/useCall";
import { useMessageActions } from "./hooks/useMessageActions";
import { useProfileActions } from "./hooks/useProfileActions";
import { useAppLock } from "./hooks/useAppLock";
import { useScreenshotProtection } from "./hooks/useScreenshotProtection";
import { AnimatePresence } from "motion/react";
import { useAppStore } from "./store";
import { useUiStore } from "./store/uiStore";
import type { Contact } from "./types/contact";
import type { ContactProfile } from "./components/ContactProfileModal";
import { seedMockData } from './utils/mockSeeding';
import { useAppConnection } from './hooks/useAppConnection';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppSettings } from './hooks/useAppSettings';
import { useScheduledMessages } from './hooks/useScheduledMessages';
import { useRefMessageActions } from './hooks/useRefMessageActions';
import { useActiveChatWorkspace } from './hooks/useActiveChatWorkspace';
import { useChatListWorkspace } from './hooks/useChatListWorkspace';
import { useFilteredChats } from './hooks/useFilteredChats';
import { useUnreadCount } from './hooks/useUnreadCount';
import { useLocalStorage } from "./hooks/useLocalStorage";
import { CallScreen } from './components/call/CallScreen';
import { AppShell } from './components/app/AppShell';
import { AppChrome } from './components/app/AppChrome';
import { STORAGE_KEYS } from './constants/storage';
import { ThemeContext } from './contexts/ThemeContext';
import { useIdentityAuth } from './hooks/useIdentityAuth';
import { RegistrationScreen, LoginScreen } from './components/auth';

export default function App() {
  const { theme, setTheme, isDark, fontSize, setFontSize, t } = useAppSettings();

  const chats = useAppStore(s => s.chats);
  const setChats = useAppStore(s => s.setChats);
  const channels = useAppStore(s => s.channels);
  const setChannels = useAppStore(s => s.setChannels);
  const bots = useAppStore(s => s.bots);
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const archivedChats = useAppStore(s => s.archivedChats);
  const toggleArchive = useAppStore(s => s.toggleArchive);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const setActiveCall = useAppStore(s => s.setActiveCall);
  const stealthMode = useAppStore(state => state.stealthMode);
  const hideWhenOfficeOnly = useAppStore(state => state.hideWhenOfficeOnly);
  const {
    pinInput, setPinInput, pinError, lockAttempts,
    lockBlockedUntil, lockBlockTimer, handleUnlock, isLocked,
  } = useAppLock();
  const { status: identityStatus } = useIdentityAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleRegistrationComplete = useCallback(() => {
    setShowLogin(false);
  }, []);

  useEffect(() => {
    const handler = () => setShowLogin(true);
    window.addEventListener('show-login', handler);
    return () => window.removeEventListener('show-login', handler);
  }, []);
  const [activeStory, setActiveStory] = useState<{ id: number, name: string, color: string } | null>(null);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [savedMessages, setSavedMessages] = useLocalStorage<any[]>(STORAGE_KEYS.SAVED_MESSAGES, []);
  useScreenshotProtection(stealthMode);

  const {
    showCreateChannel, setShowCreateChannel,
    showCreateBot, setShowCreateBot,
    globalSelectedContact, setGlobalSelectedContact,
    showContactPicker, setShowContactPicker,
    editingContact, setEditingContact,
    showAdvancedFilterModal, setShowAdvancedFilterModal,
    advancedFilters, setAdvancedFilters,
  } = useUiStore();

  const [draftTextByChat, setDraftTextByChat] = useLocalStorage<Record<string, string>>(STORAGE_KEYS.DRAFTS, {});

  const { connectionStatus } = useAppConnection();

  useEffect(() => {
    if (!MOCK_DATA_ENABLED) return;
    seedMockData(setChats, setContacts, setChannels, chats, contacts, channels);
  }, [setChats, setContacts, setChannels, chats, contacts, channels]);

  // Check scheduled messages periodically
  useScheduledMessages();



  const [view, setView] = useState<'chats' | 'channels' | 'bots' | 'settings' | 'contacts' | 'stories' | 'company'>('chats');
  const [subView, setSubView] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteError, setVoiceNoteError] = useState("");
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [morseMode, setMorseMode] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const { filteredChats, filteredChannels } = useFilteredChats(
    chats,
    chatSearchQuery,
    activeFolder,
    archivedChats,
    advancedFilters,
    channels,
  );

  const {
    sendVoiceMessage, sendStickerMessage, handleSendMessage, toggleSavedMessage,
  } = useMessageActions(
    activeChat, messageText, scheduledQueue, replyTarget, silentMode, savedMessages, morseMode,
    scheduleDateTime, setChats, setActiveChat, setMessageText, setScheduleDateTime,
    setSilentMode, setReplyTarget, setDraftTextByChat,
    setShowStickerPicker, setSavedMessages,
  );

  const { chatsUnread, companyUnread } = useUnreadCount(chats, channels);

  const archivedUnreadCount = useMemo(() => {
    let count = 0;
    chats.forEach(c => { if (archivedChats.includes(c.id)) count += c.unread || 0; });
    channels.forEach(c => { if (archivedChats.includes(c.id)) count += (c as any).unread || 0; });
    return count;
  }, [chats, channels, archivedChats]);

  const {
    handleNavigate,
    handlePreviewCall,
    handlePreviewMessage,
    isChatListRoute,
  } = useAppNavigation(
    view, chats, activeChat, setView, setSubView, setActiveChat, setChats, setActiveCall,
  );

  const {
    handleProfileCall,
    handleProfileVideoCall,
    handleProfileMessage,
    handleProfileDelete,
    handleProfileEdit,
    handleProfileBlock,
    handleProfileToggleFavorite,
  } = useProfileActions(
    chats, activeChat, globalSelectedContact,
    setView, setActiveChat, setChats, setContacts, setGlobalSelectedContact, setEditingContact,
    handlePreviewCall, handlePreviewMessage,
  );

  const { call, acceptCall, endCall, toggleMute, toggleVideo, toggleScreenShare, toggleRecording } = useCall();
  const [incomingCall, setIncomingCall] = useState<{ peerId: string; displayName: string; callType: 'audio' | 'video' } | null>(null);
  const refActions = useRefMessageActions({
    handleSendMessage,
    sendVoiceMessage,
    sendStickerMessage,
    handlePreviewCall,
    handlePreviewMessage,
  });

  const activeChatWorkspaceProps = useActiveChatWorkspace({
    theme,
    activeChat,
    setActiveChat,
    messageText,
    setMessageText,
    scheduleDateTime,
    showSchedulePopup,
    setShowSchedulePopup,
    setScheduleDateTime,
    isRecordingVoice,
    setIsRecordingVoice,
    voiceNoteError,
    showStickerPicker,
    setShowStickerPicker,
    morseMode,
    silentMode,
    replyTarget,
    setReplyTarget,
    draftTextByChat,
    setDraftTextByChat,
    setChats,
    setChannels,
    setVoiceNoteError,
    setSilentMode,
    setMorseMode,
    savedMessages,
    toggleSavedMessage,
    handleSendMessage: refActions.handleSendMessageRef,
    sendVoiceMessage: refActions.sendVoiceMessageRef,
    sendStickerMessage: refActions.sendStickerMessageRef,
    handlePreviewCall: refActions.handlePreviewCallRef,
    handlePreviewMessage: refActions.handlePreviewMessageRef,
    setEditingContact,
  });

  const chatListWorkspaceProps = useChatListWorkspace({
    theme,
    view,
    activeFolder,
    setActiveFolder,
    chatSearchQuery,
    setChatSearchQuery,
    filteredChats,
    filteredChannels,
    bots,
    archivedChats,
    chats,
    channels,
    toggleArchive,
    contacts,
    setGlobalSelectedContact,
    setActiveChat,
    setView,
    setActiveStory,
    setShowCreateChannel,
    setShowCreateBot,
    setShowAdvancedFilterModal,
    advancedFilters,
    t,
    isDark,
    onCall: refActions.handlePreviewCallRef,
    onVideoCall: (name: string, color?: string) => refActions.handlePreviewCallRef(name, color, 'video'),
  });

  if (identityStatus === 'loading') {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (identityStatus === 'new-user') {
    return <RegistrationScreen onComplete={handleRegistrationComplete} />;
  }

  if (showLogin) {
    return <LoginScreen onComplete={handleRegistrationComplete} />;
  }

  if (isLocked) {
    return (
      <AppLockScreen
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        lockAttempts={lockAttempts}
        lockBlockTimer={lockBlockTimer}
        lockBlockedUntil={lockBlockedUntil}
        isDark={isDark}
        handleUnlock={handleUnlock}
      />
    );
  }

  // Design read: messenger/product UI with premium consumer aesthetic, dark mode primary, orange accent.
  // Layout: sidebar navigation, central content, bottom nav for mobile.
  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      <AppChrome isDark={isDark} connectionStatus={connectionStatus} />
      <AppShell
        theme={theme}
        isDark={isDark}
        fontSize={fontSize}
        view={view}
        subView={subView}
        setSubView={setSubView}
        activeStory={activeStory}
        setActiveStory={setActiveStory}
        stealthMode={stealthMode}
        hideWhenOfficeOnly={hideWhenOfficeOnly}
        chatsUnread={chatsUnread}
        companyUnread={companyUnread}
        handleNavigate={handleNavigate}
        isChatListRoute={isChatListRoute}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        chatListWorkspaceProps={chatListWorkspaceProps}
        activeChatWorkspaceProps={activeChatWorkspaceProps}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        chatSearchQuery={chatSearchQuery}
        setChatSearchQuery={setChatSearchQuery}
        filteredChats={filteredChats}
        filteredChannels={filteredChannels}
        bots={bots}
        archivedUnreadCount={archivedUnreadCount}
        toggleArchive={toggleArchive}
        contacts={contacts}
        setContacts={setContacts}
        showContactPicker={showContactPicker}
        setShowContactPicker={setShowContactPicker}
        setEditingContact={setEditingContact}
        chats={chats}
        setChats={setChats}
        setView={setView}
        setGlobalSelectedContact={setGlobalSelectedContact}
        setShowCreateChannel={setShowCreateChannel}
        setShowCreateBot={setShowCreateBot}
        setShowAdvancedFilterModal={setShowAdvancedFilterModal}
        advancedFilters={advancedFilters}
        handlePreviewCall={handlePreviewCall}
        handlePreviewMessage={handlePreviewMessage}
        setFontSize={setFontSize}
        t={t}
      />
      <AppOverlays
        isDark={isDark}
        view={view}
        showCreateChannel={showCreateChannel}
        setShowCreateChannel={setShowCreateChannel}
        showCreateBot={showCreateBot}
        setShowCreateBot={setShowCreateBot}
        showAdvancedFilterModal={showAdvancedFilterModal}
        setShowAdvancedFilterModal={setShowAdvancedFilterModal}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters as any}
        globalSelectedContact={globalSelectedContact}
        setGlobalSelectedContact={setGlobalSelectedContact}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        editingContact={editingContact}
        setEditingContact={setEditingContact}
        contacts={contacts}
        setContacts={setContacts as any}
        chats={chats}
        setChats={setChats as any}
        t={t}
        onProfileCall={handleProfileCall}
        onProfileVideoCall={handleProfileVideoCall}
        onProfileMessage={handleProfileMessage}
        onProfileDelete={handleProfileDelete}
         onProfileEdit={handleProfileEdit}
         onProfileBlock={handleProfileBlock}
         onProfileToggleFavorite={handleProfileToggleFavorite}
       />

      <AnimatePresence>
        <CallScreen
          call={call}
          incomingCall={incomingCall}
          onEnd={endCall}
          acceptCall={acceptCall}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
          toggleScreenShare={toggleScreenShare}
          toggleRecording={toggleRecording}
          setActiveCall={setActiveCall}
        />
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}
