import { lazy, Suspense, useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import { useP2PMessages } from './hooks/useP2PMessages';
import { useRefMessageActions } from './hooks/useRefMessageActions';
import { useActiveChatWorkspace } from './hooks/useActiveChatWorkspace';
import { useFilteredChats } from './hooks/useFilteredChats';
import { useUnreadCount } from './hooks/useUnreadCount';
import { useDataHydration } from './hooks/useDataHydration';
import { useBrowserBackNavigation } from './hooks/useBrowserBackNavigation';
import { useLocalStorage } from "./hooks/useLocalStorage";
import { AppShell } from './components/app/AppShell';
import { AppChrome } from './components/app/AppChrome';
import { STORAGE_KEYS } from './constants/storage';
import { ThemeContext } from './contexts/ThemeContext';
import { AppAuthGate } from './components/app/AppAuthGate';
import { ServicesProvider } from './services';
import { createLocalServices } from './services/localServices';
import { findStoryUser } from './components/stories/storiesData';
import { AcceptInviteModal } from './components/crm/AcceptInviteModal';
import { toast } from './components/ui/Toast';

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
  const bots = useAppStore(s => s.bots);
  const setBots = useAppStore(s => s.setBots);
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const archivedChats = useAppStore(s => s.archivedChats);
  const toggleArchive = useAppStore(s => s.toggleArchive);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const setActiveCall = useAppStore(s => s.setActiveCall);
  const stealthMode = useAppStore(state => state.stealthMode);
  const hideWhenOfficeOnly = useAppStore(state => state.hideWhenOfficeOnly);
  const loadCompanyMessages = useAppStore(s => s.loadCompanyMessages);
  const {
    showCreateChannel, setShowCreateChannel,
    showCreateBot, setShowCreateBot,
    showCreateGroup, setShowCreateGroup,
    globalSelectedContact, setGlobalSelectedContact,
    showContactPicker, setShowContactPicker,
    editingContact, setEditingContact,
    showAdvancedFilterModal, setShowAdvancedFilterModal,
    advancedFilters, setAdvancedFilters,
    showAddContactFromChat, setShowAddContactFromChat,
    chatReturnContext, setChatReturnContext,
  } = useUiStore();

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
  useP2PMessages();

  useEffect(() => {
    let stopRetention: () => void = () => {};
    import("./lib/recordingRetention").then(({ startRecordingRetention }) => {
      stopRetention = startRecordingRetention();
    }).catch(() => {});
    Promise.all([
      import("./lib/sdk"),
      import("./lib/crm/deepLink"),
      import("./lib/stories/storyDeepLink"),
    ]).then(([sdkModule, crmDeepLinkModule, storyDeepLinkModule]) => {
      sdkModule.installMessAngerSdk();
      const sdk = sdkModule.createMessAngerSdk();
      if (typeof window !== 'undefined') {
        crmDeepLinkModule.runCrmDeepLink(sdk, window.location.search, window.location.hash)
          .then((r) => { if (r && r.imported > 0) toast(`Imported ${r.imported} contacts from link`, 'success'); })
          .catch(() => {});
        const invite = new URLSearchParams(window.location.search).get('invite');
        if (invite) setPendingInvite(invite);
        const storyLink = storyDeepLinkModule.parseStoryDeepLink(window.location.hash, window.location.search);
        if (storyLink) {
          const u = findStoryUser(storyLink.userId);
          setActiveStory({ id: u.id, name: u.name, color: u.color });
          storyDeepLinkModule.clearStoryDeepLink();
        }
      }
    }).catch(() => {});
    return () => stopRetention();
  }, []);

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
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  // Clear any pending reply when switching to a different contact/chat
  const activeChatIdRef = useRef(activeChat?.id ?? null);
  useEffect(() => {
    const id = activeChat?.id ?? null;
    if (activeChatIdRef.current !== id) {
      activeChatIdRef.current = id;
      setReplyTarget(null);
      setMessageText(id ? (draftTextByChat[String(id)] ?? "") : "");
      setShowStickerPicker(false);
      setMorseMode(false);
    }
  }, [activeChat?.id, setReplyTarget, draftTextByChat, setMessageText, setShowStickerPicker, setMorseMode]);

  // Persist draft text per chat §55
  useEffect(() => {
    if (!activeChat) return;
    const chatId = String(activeChat.id);
    setDraftTextByChat((prev) => {
      if (messageText) {
        if (prev[chatId] === messageText) return prev;
        return { ...prev, [chatId]: messageText };
      }
      if (prev[chatId]) {
        const next = { ...prev };
        delete next[chatId];
        return next;
      }
      return prev;
    });
  }, [messageText, activeChat?.id]);
  const { filteredChats, filteredChannels } = useFilteredChats(
    chats,
    chatSearchQuery,
    activeFolder,
    archivedChats,
    advancedFilters,
    channels,
  );

  useBrowserBackNavigation({
    view, subView, activeChatId: activeChat?.id ?? null,
    chats, channels, setView, setSubView, setActiveChat,
  });

  // Resolve whether a chat belongs to a company (so back returns to CRM).
  const isCompanyChat = useCallback((chat: any) => {
    if (!chat) return false;
    if ((chat as any).company) return true;
    const match = contacts.find((ct: any) => ct.name === chat.name || ct.id === chat.id);
    return !!(match && match.company);
  }, [contacts]);

  // Open a chat, recording where the back button should return to.
  const openChat = useCallback((chat: any, opts?: { returnTo?: { view: string; subView?: string | null }; forceView?: string }) => {
    const route = (["chats", "channels", "bots"] as string[]).includes(view) ? view : "chats";
    if (opts?.returnTo) {
      setChatReturnContext({ view: opts.returnTo.view, subView: opts.returnTo.subView ?? null });
    } else if (isCompanyChat(chat)) {
      setChatReturnContext({ view: "company", subView: null });
    } else {
      setChatReturnContext({ view: route, subView });
    }
    setView((opts?.forceView as any) || route);
    setActiveChat(chat);
  }, [isCompanyChat, view, subView, setChatReturnContext, setView, setActiveChat]);

  // Back/close from a chat: return to the recorded context.
  const closeChat = useCallback(() => {
    if (chatReturnContext) {
      setView(chatReturnContext.view as any);
      setSubView(chatReturnContext.subView);
    }
    setActiveChat(null);
  }, [chatReturnContext, setView, setSubView, setActiveChat]);

  // Cross-view drill-downs (CRM→premium, list→bot, bot→miniApp) remember their
  // origin so the in-app Back button always returns to the previous screen.
  const [navOrigin, setNavOrigin] = useState<{ view: string; subView: string | null } | null>(null);

  const pushView = useCallback((v: string, sv: string | null = null) => {
    setNavOrigin({ view, subView });
    setView(v as any);
    setSubView(sv);
  }, [view, subView, setView, setSubView]);

  const goBack = useCallback(() => {
    if (navOrigin) {
      setView(navOrigin.view as any);
      setSubView(navOrigin.subView);
      setNavOrigin(null);
    } else {
      setView("chats");
      setSubView(null);
    }
  }, [navOrigin, setView, setSubView]);

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
    chats, activeChat, globalSelectedContact,
    setView, setActiveChat, setChats, setContacts, setGlobalSelectedContact, setEditingContact,
    handlePreviewCall, handlePreviewMessage,
  );

  const handleAddContactFromChat = useCallback((name: string, id: string, color?: string, localFields?: any[]) => {
    const newContact = { name, id, color: color || 'from-teal-400 to-emerald-500', lastSeen: Date.now(), localFields };
    setContacts(prev => [newContact, ...prev]);
    setShowAddContactFromChat(false);
  }, [setContacts, setShowAddContactFromChat]);

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

  return (
    <ServicesProvider services={createLocalServices()}>
    <AppAuthGate>
      <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
        <AppChrome isDark={isDark} />
        <AppShell
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
          chatsUnread={chatsUnread}
          companyUnread={companyUnread}
          handleNavigate={handleNavigate}
          isChatListRoute={isChatListRoute}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          activeChatWorkspaceProps={activeChatWorkspaceProps}
          onOpenChat={openChat}
          onCloseChat={closeChat}
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
          goBack={goBack}
          pushView={pushView}
          setGlobalSelectedContact={setGlobalSelectedContact}
          setShowCreateChannel={setShowCreateChannel}
          setShowCreateBot={setShowCreateBot}
          setShowCreateGroup={setShowCreateGroup}
          setShowAdvancedFilterModal={setShowAdvancedFilterModal}
          advancedFilters={advancedFilters}
          handlePreviewCall={handlePreviewCall}
          handlePreviewMessage={handlePreviewMessage}
          setFontSize={setFontSize}
          t={t}
          showAddContactFromChat={showAddContactFromChat}
          setShowAddContactFromChat={setShowAddContactFromChat}
onAddContactFromChat={handleAddContactFromChat}
          draftTextByChat={draftTextByChat}
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
          showCreateGroup={showCreateGroup}
          setShowCreateGroup={setShowCreateGroup}
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

        {pendingInvite && (
          <AcceptInviteModal
            code={pendingInvite}
            onAccept={async () => {
              const ok = await useAppStore.getState().acceptInvite(pendingInvite);
              toast(
                ok
                  ? t('crm.inviteAccepted', 'Invitation accepted')
                  : t('crm.inviteInvalid', 'Invite not valid on this device'),
                ok ? 'success' : 'error',
              );
              setPendingInvite(null);
            }}
            onClose={() => setPendingInvite(null)}
          />
        )}
      </ThemeContext.Provider>
    </AppAuthGate>
    <Suspense fallback={null}><LazyCallOverlay /></Suspense>
    </ServicesProvider>
  );
}
