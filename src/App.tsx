import { lazy, Suspense, useState, useCallback } from "react";
import { AppOverlays } from "./components/app";
import { useMessageActions } from "./hooks/useMessageActions";
import { useProfileActions } from "./hooks/useProfileActions";
import { useScreenshotProtection } from "./hooks/useScreenshotProtection";
import { usePremiumEntitlementRefresh } from "./hooks/usePremiumEntitlementRefresh";
import { useAppStore } from "./store";
import { useUiStore } from "./store/uiStore";
import { useAppConnection } from './hooks/useAppConnection';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppSettings } from './hooks/useAppSettings';
import { useAppearanceEffects } from './hooks/useAppearanceEffects';
import { useScheduledMessages } from './hooks/useScheduledMessages';
import { useP2PBoot } from './hooks/useP2PBoot';
import { useChatPresence } from './hooks/useChatPresence';
import { useSoundSettingsSync } from './hooks/useSoundSettingsSync';
import { useP2PMessages } from './hooks/useP2PMessages';
import { useSelfDestructSweep } from './hooks/useSelfDestructSweep';
import { useLiveLocationSweep } from './hooks/useLiveLocationSweep';
import { useRefMessageActions } from './hooks/useRefMessageActions';
import { useActiveChatWorkspace } from './hooks/useActiveChatWorkspace';
import { useDataHydration } from './hooks/useDataHydration';
import { useBrowserBackNavigation } from './hooks/useBrowserBackNavigation';
import { useAppBootEffects } from './hooks/useAppBootEffects';
import { useAppViewNavigation } from './hooks/useAppViewNavigation';
import { useChatDraftSync } from './hooks/useChatDraftSync';
import { useLocalStorage } from "./hooks/useLocalStorage";
import { AppShell } from './components/app/AppShell';
import { AppChrome } from './components/app/AppChrome';
import { PendingInviteGate } from './components/app/PendingInviteGate';
import { STORAGE_KEYS } from './constants/storage';
import { ThemeContext } from './contexts/ThemeContext';
import { AppAuthGate } from './components/app/AppAuthGate';
import { ServicesProvider } from './services';
import { createLocalServices } from './services/localServices';

const LazyCallOverlay = lazy(() => import("./components/app/CallOverlay").then((m) => ({ default: m.CallOverlay })));

export default function App() {
  const { theme, setTheme, isDark, fontSize, setFontSize, t } = useAppSettings();
  useAppearanceEffects();

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
  // Modal / filter / picker flags for the shell + overlays layers: one store
  // read, spread through instead of re-listing 25 pass-through props in JSX.
  const ui = useUiStore();
  const { chatReturnContext, setChatReturnContext } = ui;

  const [activeStory, setActiveStory] = useState<{ id: number | string, name: string, color: string } | null>(null);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [miniAppBotId, setMiniAppBotId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [savedMessages, setSavedMessages] = useLocalStorage<any[]>(STORAGE_KEYS.SAVED_MESSAGES, []);
  useScreenshotProtection(stealthMode);
  usePremiumEntitlementRefresh();

  const [draftTextByChat, setDraftTextByChat] = useLocalStorage<Record<string, string>>(STORAGE_KEYS.DRAFTS, {});

  useDataHydration({
    setChats, setContacts, setChannels, setBots, setCallHistory, loadCompanyMessages,
    callHistory, chats, contacts, channels,
  });

  const { connectionStatus, connectionError } = useAppConnection();

  useScheduledMessages();
  useP2PBoot();
  useChatPresence();
  useSoundSettingsSync();
  useP2PMessages();

  const { pendingInvite, setPendingInvite } = useAppBootEffects({ setActiveStory });

  const [activeChat, setActiveChat] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteError, setVoiceNoteError] = useState("");
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [morseMode, setMorseMode] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const {
    view, setView, subView, setSubView, setNavOrigin,
    openChat, closeChat, pushView, goBack, openPremium,
  } = useAppViewNavigation({ contacts, chatReturnContext, setChatReturnContext, setActiveChat });

  // Self-destruct deadlines actually erase the message (store list + saved
  // messages + voice/file blobs) — the bubble component only hides expired
  // content, so without this the plaintext would live forever.
  useSelfDestructSweep({ activeChat, setActiveChat, setSavedMessages });

  // Retire live-location shares and bubbles that outlived their deadline — the
  // timeout that ends a stream dies with the tab, and a peer that vanishes never
  // sends a stop frame.
  useLiveLocationSweep();

  useChatDraftSync({
    activeChat, messageText, setMessageText, setReplyTarget, setShowStickerPicker, setMorseMode,
    draftTextByChat, setDraftTextByChat, draftsEnabled,
  });

  useBrowserBackNavigation({
    view, subView, activeChatId: activeChat?.id ?? null,
    chats, channels, setView, setSubView, setActiveChat,
  });

  const {
    sendVoiceMessage, sendStickerMessage, handleSendMessage, toggleSavedMessage,
  } = useMessageActions(
    activeChat, messageText, scheduledQueue, replyTarget, silentMode, savedMessages, morseMode,
    scheduleDateTime, setChats, setActiveChat, setMessageText, setScheduleDateTime,
    setSilentMode, setReplyTarget, setDraftTextByChat,
    setShowStickerPicker, setSavedMessages,
  );

  const {
    handleNavigate: baseHandleNavigate,
    handlePreviewCall,
    handlePreviewMessage,
    isChatListRoute,
  } = useAppNavigation(
    view, chats, activeChat, setView, setSubView, setActiveChat, setChats, setActiveCall, openChat,
  );

  // Top-level navigation is explicit (not drill-down): drop any recorded origin.
  const handleNavigate = useCallback((target: string) => {
    setNavOrigin(null);
    baseHandleNavigate(target);
  }, [baseHandleNavigate, setNavOrigin]);

  const {
    handleProfileCall,
    handleProfileVideoCall,
    handleProfileMessage,
    handleProfileDelete,
    handleProfileEdit,
    handleProfileBlock,
    handleProfileToggleFavorite,
  } = useProfileActions(
    chats, activeChat, ui.globalSelectedContact,
    setView, setActiveChat, setChats, setContacts, ui.setGlobalSelectedContact, ui.setEditingContact,
    handlePreviewCall, handlePreviewMessage,
  );

  const handleAddContactFromChat = useCallback((name: string, id: string, color?: string, localFields?: any[]) => {
    const newContact = { name, id, color: color || 'from-teal-400 to-emerald-500', lastSeen: Date.now(), localFields };
    setContacts(prev => [newContact, ...prev]);
    ui.setShowAddContactFromChat(false);
  }, [setContacts, ui.setShowAddContactFromChat]);

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
    setEditingContact: ui.setEditingContact,
    onOpenPremium: openPremium,
  });

  return (
    <ServicesProvider services={createLocalServices()}>
    <AppAuthGate>
      <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
        <AppChrome isDark={isDark} />
        <AppShell
          {...ui}
          theme={theme}
          isDark={isDark}
          connectionStatus={connectionStatus}
          connectionError={connectionError}
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
          handleNavigate={handleNavigate}
          isChatListRoute={isChatListRoute}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          activeChatWorkspaceProps={activeChatWorkspaceProps}
          onOpenChat={openChat}
          onCloseChat={closeChat}
          setView={setView}
          goBack={goBack}
          pushView={pushView}
          handlePreviewCall={handlePreviewCall}
          handlePreviewMessage={handlePreviewMessage}
          setFontSize={setFontSize}
          t={t}
          onAddContactFromChat={handleAddContactFromChat}
          draftTextByChat={draftTextByChat}
           activeBotId={activeBotId}
           setActiveBotId={setActiveBotId}
           miniAppBotId={miniAppBotId}
           setMiniAppBotId={setMiniAppBotId}
         />
        <AppOverlays
          {...ui}
          setAdvancedFilters={ui.setAdvancedFilters as any}
          isDark={isDark}
          view={view}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
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
          onAddContactFromChat={handleAddContactFromChat}
        />

        {pendingInvite && (
          <PendingInviteGate code={pendingInvite} t={t} onDismiss={() => setPendingInvite(null)} />
        )}
      </ThemeContext.Provider>
    </AppAuthGate>
    <Suspense fallback={null}><LazyCallOverlay /></Suspense>
    </ServicesProvider>
  );
}