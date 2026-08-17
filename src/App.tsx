import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AppOverlays } from "./components/app";
import { SafeRender } from "./components/resilience";
import { MOCK_DATA_ENABLED } from "./lib/mockDataFlag";
import { useCall } from "./hooks/useCall";
import { useMessageActions } from "./hooks/useMessageActions";
import { useProfileActions } from "./hooks/useProfileActions";
import { useScreenshotProtection } from "./hooks/useScreenshotProtection";
import { AnimatePresence } from "motion/react";
import { useAppStore } from "./store";
import { useUiStore } from "./store/uiStore";
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
import { AppAuthGate } from './components/app/AppAuthGate';
import { ToastViewport } from './components/ui/Toast';
import { ServicesProvider } from './services';

export default function App() {
  const { theme, setTheme, isDark, fontSize, setFontSize, t } = useAppSettings();

  const chats = useAppStore(s => s.chats);
  const setChats = useAppStore(s => s.setChats);
  const channels = useAppStore(s => s.channels);
  const setChannels = useAppStore(s => s.setChannels);
  const callHistory = useAppStore(s => s.callHistory);
  const setCallHistory = useAppStore(s => s.setCallHistory);
  const bots = useAppStore(s => s.bots);
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const archivedChats = useAppStore(s => s.archivedChats);
  const toggleArchive = useAppStore(s => s.toggleArchive);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const setActiveCall = useAppStore(s => s.setActiveCall);
  const callMinimized = useAppStore(s => s.callMinimized);
  const setCallMinimized = useAppStore(s => s.setCallMinimized);
  const stealthMode = useAppStore(state => state.stealthMode);
  const hideWhenOfficeOnly = useAppStore(state => state.hideWhenOfficeOnly);
  const {
    showCreateChannel, setShowCreateChannel,
    showCreateBot, setShowCreateBot,
    globalSelectedContact, setGlobalSelectedContact,
    showContactPicker, setShowContactPicker,
    editingContact, setEditingContact,
    showAdvancedFilterModal, setShowAdvancedFilterModal,
    advancedFilters, setAdvancedFilters,
    showAddContactFromChat, setShowAddContactFromChat,
  } = useUiStore();

  const [activeStory, setActiveStory] = useState<{ id: number, name: string, color: string } | null>(null);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [miniAppBotId, setMiniAppBotId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [savedMessages, setSavedMessages] = useLocalStorage<any[]>(STORAGE_KEYS.SAVED_MESSAGES, []);
  useScreenshotProtection(stealthMode);

  const [draftTextByChat, setDraftTextByChat] = useLocalStorage<Record<string, string>>(STORAGE_KEYS.DRAFTS, {});
  const didSeedMockData = useRef(false);

  const { connectionStatus } = useAppConnection();

  useEffect(() => {
    if (!MOCK_DATA_ENABLED) return;
    if (didSeedMockData.current) return;
    seedMockData(setChats, setContacts, setChannels, setCallHistory, callHistory, chats, contacts, channels);
    didSeedMockData.current = true;
  }, [setChats, setContacts, setChannels, setCallHistory, callHistory, chats, contacts, channels]);

  useScheduledMessages();

  const [view, setView] = useState<'chats' | 'channels' | 'bots' | 'settings' | 'profile' | 'contacts' | 'stories' | 'company' | 'calls' | 'workplace' | 'bot' | 'miniApp'>('chats');
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

  // Clear any pending reply when switching to a different contact/chat
  const activeChatIdRef = useRef(activeChat?.id ?? null);
  useEffect(() => {
    const id = activeChat?.id ?? null;
    if (activeChatIdRef.current !== id) {
      activeChatIdRef.current = id;
      setReplyTarget(null);
    }
  }, [activeChat?.id, setReplyTarget]);
  const { filteredChats, filteredChannels } = useFilteredChats(
    chats,
    chatSearchQuery,
    activeFolder,
    archivedChats,
    advancedFilters,
    channels,
  );

  // Browser/hardware Back support (Telegram-like step-back: chat → list → chats)
  const chatsRef = useRef(chats);
  chatsRef.current = chats;
  const channelsRef = useRef(channels);
  channelsRef.current = channels;
  const lastPushed = useRef("");
  const skipNextPush = useRef(false);
  useEffect(() => {
    window.history.replaceState(
      { view, activeChatId: activeChat?.id ?? null, subView },
      "",
    );
    const onPop = (e: PopStateEvent) => {
      const s = e.state as { view?: string; activeChatId?: string | number; subView?: string | null } | null;
      if (!s) return;
      skipNextPush.current = true;
      setView((s.view as any) ?? "chats");
      setSubView(s.subView ?? null);
      const id = s.activeChatId;
      const found = id != null
        ? [...chatsRef.current, ...channelsRef.current].find((c: any) => c.id === id)
        : null;
      setActiveChat(found ?? null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const id = activeChat?.id ?? null;
    const key = `${view}|${id}|${subView}`;
    if (key === lastPushed.current) return;
    lastPushed.current = key;
    window.history.pushState({ view, activeChatId: id, subView }, "");
  }, [view, activeChat?.id, subView]);

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

  const handleAddContactFromChat = useCallback((name: string, id: string, color?: string, localFields?: any[]) => {
    const newContact = { name, id, color: color || 'from-teal-400 to-emerald-500', lastSeen: Date.now(), localFields };
    setContacts(prev => [newContact, ...prev]);
    setShowAddContactFromChat(false);
  }, [setContacts, setShowAddContactFromChat]);

  const { call, acceptCall, endCall, toggleMute, toggleVideo, toggleScreenShare, toggleRecording, toggleSpeaker, flipCamera, changeCallType } = useCall();
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
    onOpenBot: (id: string) => { setActiveBotId(id); setView("bot"); },
  });

  return (
    <ServicesProvider>
    <AppAuthGate onRegistrationComplete={() => {}}>
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
          onComposeStory={() => setShowStoryComposer(true)}
          showStoryComposer={showStoryComposer}
          onCloseComposer={() => setShowStoryComposer(false)}
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
          showAddContactFromChat={showAddContactFromChat}
          setShowAddContactFromChat={setShowAddContactFromChat}
           onAddContactFromChat={handleAddContactFromChat}
           activeBotId={activeBotId}
           setActiveBotId={setActiveBotId}
           miniAppBotId={miniAppBotId}
           setMiniAppBotId={setMiniAppBotId}
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
          showAddContactFromChat={showAddContactFromChat}
          setShowAddContactFromChat={setShowAddContactFromChat}
          onAddContactFromChat={handleAddContactFromChat}
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
          {call && !callMinimized && (
            <CallScreen
              call={call}
              incomingCall={incomingCall}
              onEnd={endCall}
              acceptCall={acceptCall}
              toggleMute={toggleMute}
              toggleVideo={toggleVideo}
              toggleScreenShare={toggleScreenShare}
            toggleRecording={toggleRecording}
            toggleSpeaker={toggleSpeaker}
            flipCamera={flipCamera}
            changeCallType={changeCallType}
            setActiveCall={setActiveCall}
              onMinimize={() => setCallMinimized(true)}
            />
          )}
        </AnimatePresence>
        <ToastViewport isDark={isDark} />
      </ThemeContext.Provider>
    </AppAuthGate>
    </ServicesProvider>
  );
}
