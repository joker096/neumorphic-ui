import React, { useEffect, useState } from "react";
import { ChatWorkspace } from "./components/chat";
import { AppOverlays, AppLockScreen, ContentView } from "./components/app";
import { BottomNav, SidebarNav } from "./components/navigation";
import { SafeRender } from "./components/resilience";
import { MOCK_DATA_ENABLED } from "./lib/mockDataFlag";
import { useCall } from "./hooks/useCall";
import { useMessageActions } from "./hooks/useMessageActions";
import { useProfileActions } from "./hooks/useProfileActions";
import { useAppLock } from "./hooks/useAppLock";
import { useScreenshotProtection } from "./hooks/useScreenshotProtection";
import { AnimatePresence } from "motion/react";
import { useAppStore } from "./store";
import { Toaster } from "sonner";
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
import { CallOverlay } from './components/call/CallOverlay';
import { FeatureViewsWrapper } from './components/app/FeatureViewsWrapper';
import { TransportIndicator } from './components/status/TransportIndicator';
import { STORAGE_KEYS } from './constants/storage';
import { ThemeContext } from './contexts/ThemeContext';

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
  const [activeStory, setActiveStory] = useState<{ id: number, name: string, color: string } | null>(null);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [savedMessages, setSavedMessages] = useLocalStorage<any[]>(STORAGE_KEYS.SAVED_MESSAGES, []);
  useScreenshotProtection(stealthMode);

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [globalSelectedContact, setGlobalSelectedContact] = useState<ContactProfile | null>(null);
  const [draftTextByChat, setDraftTextByChat] = useLocalStorage<Record<string, string>>(STORAGE_KEYS.DRAFTS, {});

  const { connectionStatus } = useAppConnection();

  useEffect(() => {
    if (!MOCK_DATA_ENABLED) return;
    seedMockData(setChats, setContacts, setChannels, chats, contacts, channels);
  }, [setChats, setContacts, setChannels, chats, contacts, channels]);

  // Check scheduled messages periodically
  useScheduledMessages();



  const [view, setView] = useState<'hub' | 'chats' | 'channels' | 'bots' | 'radar' | 'pulse' | 'calls' | 'settings' | 'contacts' | 'stories' | 'recordings' | 'company'>('chats');
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
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false });
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
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
  } = useProfileActions(
    chats, activeChat, globalSelectedContact,
    setView, setActiveChat, setChats, setGlobalSelectedContact, setEditingContact,
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
       <Toaster position="top-right" duration={3000} theme={isDark ? 'dark' : 'light'} />
       <div data-theme={theme} data-font-size={fontSize} className={`w-full h-[100dvh] flex font-sans select-none overflow-hidden relative ${isDark ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-[var(--text-primary)]"}`}>
         <div id="sr-region" aria-live="polite" role="status" className="sr-only" />
         {isDark && (
           <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
         )}

         <div className="absolute top-2 right-2 z-50">
           <TransportIndicator status={connectionStatus} />
         </div>

         <aside aria-label="Navigation sidebar" className="z-40 md:z-40">
            <SidebarNav
               activeView={view}
               isDark={isDark}
               unreadCount={chatsUnread}
               companyUnreadCount={companyUnread}
               onNavigate={handleNavigate}
               t={t}
               hideCompany={hideWhenOfficeOnly}
             />
</aside>

           <main id="main-content" role="main" aria-label="Main content" className="flex-1 flex flex-col min-w-0 pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0">
           <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col" style={{ minHeight: 0 }}>
           <AnimatePresence mode="wait">
             <ContentView
               isDark={isDark}
               onCloseStory={() => setActiveStory(null)}
               activeStory={activeStory}
               isStealthMode={stealthMode}
             >
               {isChatListRoute && (
                 <SafeRender>
                   <ChatWorkspace
                     hasActiveChat={Boolean(activeChat)}
                     listProps={chatListWorkspaceProps}
                     activeProps={activeChatWorkspaceProps}
                   />
                 </SafeRender>
               )}
                <SafeRender>
                   <FeatureViewsWrapper
                     view={view}
                     subView={subView}
                     setSubView={setSubView}
                     contacts={contacts}
                     setContacts={setContacts}
                     showContactPicker={showContactPicker}
                     setShowContactPicker={setShowContactPicker}
                     setEditingContact={setEditingContact}
                     chats={chats}
                     setChats={setChats}
                     setActiveChat={setActiveChat}
                     setView={setView as any}
                     onCall={handlePreviewCall}
                     onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
                     onMessage={handlePreviewMessage}
                     fontSize={fontSize}
                     setFontSize={setFontSize}
                   />
                 </SafeRender>
             </ContentView>
           </AnimatePresence>
            </div>
          </main>

         <footer aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 md:hidden z-50">
           <BottomNav
              activeView={view}
              isDark={isDark}
              unreadCount={chatsUnread}
              companyUnreadCount={companyUnread}
              onNavigate={handleNavigate}
              t={t}
            />
         </footer>


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
        />

        <AnimatePresence>
           <CallOverlay
             call={call}
             incomingCall={incomingCall}
             endCall={endCall}
             acceptCall={acceptCall}
             toggleMute={toggleMute}
             toggleVideo={toggleVideo}
             toggleScreenShare={toggleScreenShare}
             toggleRecording={toggleRecording}
             setActiveCall={setActiveCall}
          />
         </AnimatePresence>
      </div>
    </ThemeContext.Provider>
  );
}
