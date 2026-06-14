
import { MeshRadar } from "./components/MeshRadar";
import { SystemPulsePlayer } from "./components/SystemPulsePlayer";
import { ContactsView } from "./components/ContactsView";
import { SettingsView } from "./components/SettingsView";
import { RecordingsScreen } from "./components/RecordingsScreen";
import { ContactProfileModal, ContactProfile } from "./components/ContactProfileModal";
import { encodeMorse, isMorseCode } from "./components/MorseDecoder";
import { RadialMenu } from "./components/RadialMenu";
import { Dialpad } from "./components/Dialpad";
import { ChatPreviewLayer } from "./components/ChatPreviewLayer";
import { MOCK_CHATS, MOCK_CHANNELS, LANGUAGES, parseMentions, isDNDEnabled, isPriorityContact, MENTION_PATTERN } from "./constants";
import { FloatingCallWidget } from "./components/FloatingCallWidget";
import { useAppStore } from './store';
import { cryptoCore } from './lib/cryptoCore';
import { useI18n } from './lib/i18n';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { CreateChannelModal } from "./components/CreateChannelModal";
import { EditChannelModal } from "./components/EditChannelModal";
import { CreateBotModal } from "./components/CreateBotModal";
import { AccountSwitcher } from "./components/AccountSwitcher";
import { FolderManagerModal } from "./components/FolderManagerModal";
import { SavedMessagesView } from "./components/SavedMessagesView";
import { SlideUpPreview } from "./components/SlideUpPreview";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageSelector } from "./components/LanguageSelector";
import { AppLockView } from "./components/AppLockView";
import { AppHeader } from "./components/AppHeader";
import { HomeButton } from "./components/HomeButton";
import { ChatListPanel } from "./components/ChatListPanel";
import { ChatInputBar } from "./components/ChatInputBar";
import { StoryViewer } from "./components/StoryViewer";
import { AdvancedFilterModal } from "./components/AdvancedFilterModal";
import { EditContactModal } from "./components/EditContactModal";
import { Hash, MessageCircle, Camera, Activity, Target, Users, Phone, Mic, Bot, Settings } from "lucide-react";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigationStack, NavPageTransition } from './lib/navigation/NavigationStack';
import { useKeyboardShortcuts } from './lib/navigation/useKeyboardShortcuts';

export default function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('app_theme_mode') as any) || 'dark';
  });

  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveTheme = themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode;
  const setTheme = (t: 'light' | 'dark') => setThemeMode(t);
  const theme = effectiveTheme;
  const { t, setLang } = useI18n();
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const { 
    appLockHashedPIN, appLockSalt, chats, setChats, channels, setChannels, bots, setBots,
    scheduledQueue,
    archivedChats, toggleArchive,
    readReceipts, deliveryReceipts, typingIndicators
  } = useAppStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeStory, setActiveStory] = useState<{ id: number, name: string, color: string } | null>(null);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [savedMessages, setSavedMessages] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("mess_saved_messages");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showEditChannel, setShowEditChannel] = useState<any>(null);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [globalSelectedContact, setGlobalSelectedContact] = useState<ContactProfile | null>(null);
  const [editContactName, setEditContactName] = useState('')
  const [showEditContactForm, setShowEditContactForm] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [draftTextByChat, setDraftTextByChat] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem("mess_drafts");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('app_theme', effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    localStorage.setItem('app_theme_mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("mess_drafts", JSON.stringify(draftTextByChat));
  }, [draftTextByChat]);

  useEffect(() => {
    localStorage.setItem("mess_saved_messages", JSON.stringify(savedMessages));
  }, [savedMessages]);

  const getPrivacyLastSeenLabel = (contact: any) => {
    if (typingIndicators && contact?.online) return t('chat.typing');
    if (contact?.lastSeen === undefined) return undefined;
    if (!contact?.online && contact.lastSeen > 0) {
      return contact.lastSeen < 60000 ? t('chat.activeNow') : contact.lastSeen < 3600000 ? t('chat.minutesAgo', { count: Math.floor(contact.lastSeen / 60000) }) : contact.lastSeen < 86400000 ? t('chat.hoursAgo', { count: Math.floor(contact.lastSeen / 3600000) }) : t('chat.daysAgo', { count: Math.floor(contact.lastSeen / 86400000) });
    }
    return contact.online ? t('chat.activeNow') : undefined;
  };
  
  useEffect(() => {
    if (chats.length === 0) setChats(MOCK_CHATS);
    // Push mock channels as P2PChannels mapping if empty
    if (channels.length === 0) {
      setChannels(MOCK_CHANNELS.map(c => ({
         id: c.id.toString(),
         name: c.name,
         ownerPublicKey: "MOCK_OWNER",
         ownerId: "mock1",
         subscribers: [],
         subscriberCount: 15,
         postCount: c.history.length,
         isPrivate: false,
         isPublic: true,
         createdAt: Date.now(),
         // Keeping mock properties for UI compatibility for now:
         color: c.color,
         message: c.message,
         time: c.time,
         unread: c.unread,
         isChannel: true,
         history: c.history
      })) as any);
    }
  }, []);

  // Check scheduled messages periodically
  useEffect(() => {
    if (!scheduledQueue || scheduledQueue.messages.length === 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const messagesToSend = scheduledQueue.messages.filter(msg => msg.scheduledAt <= now);
      
      if (messagesToSend.length > 0) {
        setChats(prevChats => {
           let updatedChats = [...prevChats];
           for (const msg of messagesToSend) {
               const chatIndex = updatedChats.findIndex(c => c.id === msg.chatId);
               if (chatIndex > -1) {
                  const chat = updatedChats[chatIndex];
                  const newHistory = [...(chat.history || []), {
                     id: Date.now() + Math.random(), // Ensure unique ID
                     text: msg.text,
                     sender: "me",
                     status: "delivered"
                  }];
                  updatedChats[chatIndex] = { ...chat, history: newHistory, message: msg.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
               }
           }
           return updatedChats;
        });

        messagesToSend.forEach(msg => scheduledQueue.removeMessage(msg.id));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [scheduledQueue, setChats]);

  // Handle App Lock authentication logic
  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!appLockHashedPIN || !appLockSalt) return;
    
    const hashed = await cryptoCore.hashAppLockPIN(pinInput, appLockSalt);
    if (hashed.hash === appLockHashedPIN) {
       setIsUnlocked(true);
       setPinError(false);
    } else {
       setPinError(true);
       setPinInput('');
    }
  };

  const nav = useNavigationStack({ name: 'hub' });
  const view = nav.current.name;
  const setView = (v: string) => nav.push({ name: v });
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [showFolderManager, setShowFolderManager] = useState(false);
  const chatFolders = useAppStore(s => s.chatFolders);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteError, setVoiceNoteError] = useState("");
   const [showPreview, setShowPreview] = useState(false);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
   const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [morseMode, setMorseMode] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false });
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [previewChat, setPreviewChat] = useState<any>(null);
  const [storyMentions, setStoryMentions] = useState<Record<number, string[]>>({});
  const [storyMentionInput, setStoryMentionInput] = useState("");
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const [showContactPicker, setShowContactPicker] = useState(false);
  
  useKeyboardShortcuts({
    'Cmd+,': () => setView('settings'),
    'Cmd+F': () => setChatSearchQuery(prev => prev || ' '),
    'Escape': () => { if (activeChat) setActiveChat(null); else if (nav.canGoBack) nav.pop(); },
    'Cmd+N': () => setView('contacts'),
    'Cmd+W': () => setActiveChat(null),
    'Cmd+Enter': () => handleSendMessage(),
  });

  const [isWide, setIsWide] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const handler = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isDark = theme === 'dark';
  const currentChatList = chats;

  const archivedUnreadCount = React.useMemo(() => {
     let count = 0;
     chats.forEach(c => { if (archivedChats.includes(c.id)) count += c.unread || 0; });
     channels.forEach(c => { if (archivedChats.includes(c.id)) count += (c as any).unread || 0; });
     return count;
  }, [chats, channels, archivedChats]);

  // Compute mention flags for each chat (check for @current_user mentions)
  const MENTIONED_USER = "user";
  const mentionCounts = useMemo(() => {
     const counts: Record<string, number> = {};
     const allChats = [...chats, ...channels] as any[];
     allChats.forEach(c => {
       const history = c.history || [];
       let count = 0;
       history.forEach((msg: any) => {
         if (msg.mentions && msg.mentions.some((m: any) => m.name === MENTIONED_USER)) {
           count++;
         } else if (msg.text && new RegExp(`@${MENTIONED_USER}`, 'i').test(msg.text)) {
           count++;
         }
       });
       if (count > 0) {
         counts[c.id] = count;
         // Update the chat with hasMentions flag
         if (c.history) {
           c.hasMentions = true;
         }
       }
     });
     return counts;
  }, [chats, channels]);

  const filterByFolder = useMemo(() => {
    const folder = chatFolders.find(f => f.id === activeFolder);
    if (!folder || folder.id === 'all') return (chat: any) => !archivedChats.includes(chat.id);
    return (chat: any) => {
      const isArchived = archivedChats.includes(chat.id);
      for (const rule of folder.rules) {
        if (rule.type === 'archived') {
          if (rule.value === 'true' && !isArchived) return false;
          if (rule.value === 'false' && isArchived) return false;
          continue;
        }
        if (rule.type === 'unread' && chat.unread <= 0) return false;
        if (rule.type === 'chat_name' && chat.name !== rule.value) return false;
      }
      if (folder.chatIds.length > 0 && !folder.chatIds.includes(chat.id)) return false;
      return true;
    };
  }, [activeFolder, chatFolders, archivedChats]);

  const filteredChats = useMemo(() => currentChatList.filter(chat => {
    const query = chatSearchQuery.toLowerCase().trim();
    const historyText = (chat.history || [])
      .flatMap((m: any) => [m.text, m.replyTo?.text, m.duration, m.sender].filter(Boolean))
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      !query ||
      chat.name.toLowerCase().includes(query) ||
      (chat.message || "").toLowerCase().includes(query) ||
      historyText.includes(query);
    if (!matchesSearch) return false;
    
    // advanced filters
    if (advancedFilters.hasMedia && !(chat.history || []).some((m: any) => m.type === "image" || m.type === "video")) return false;
    if (advancedFilters.hasAudio && !(chat.history || []).some((m: any) => m.type === "audio")) return false;
    if (advancedFilters.hasReplies && !(chat.history || []).some((m: any) => !!m.replyTo)) return false;
    if (advancedFilters.fromBots && chat.type !== 'bot') return false; 
    if (advancedFilters.priority && !chat.isPriority) return false;

    return filterByFolder(chat); 
  }), [currentChatList, chatSearchQuery, filterByFolder, advancedFilters]);
  
  const filteredChannels = useMemo(() => channels.filter(channel => {
    const query = chatSearchQuery.toLowerCase().trim();
    const historyText = ((channel as any).history || [])
      .flatMap((m: any) => [m.text, m.replyTo?.text, m.duration, m.sender].filter(Boolean))
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || channel.name.toLowerCase().includes(query) || (channel as any).message?.toLowerCase().includes(query) || historyText.includes(query);
    if (!matchesSearch) return false;
    return filterByFolder(channel);
  }), [channels, chatSearchQuery, filterByFolder]);

 const sendVoiceMessage = (audioUrl: string, durationStr: string) => {
     // DND enforcement - block non-priority voice messages during DND
      if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
        toast(t('chat.dndVoiceBlocked'), { duration: 3000 });
       return;
     }

     const newMessage = {
       id: Date.now(),
       sender: "me",
       text: "",
       type: "audio",
       audioUrl,
       duration: durationStr,
       replyTo: replyTarget ? {
         id: replyTarget.id,
         sender: replyTarget.sender,
         text: replyTarget.text,
         type: replyTarget.type,
         duration: replyTarget.duration
       } : undefined,
       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       status: "sent",
       silent: silentMode
    };

    setChats(prevChats => prevChats.map(c => {
      if (activeChat && c.id === activeChat.id) {
         return { ...c, history: [...(c.history || []), newMessage] };
      }
      return c;
    }));

    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return { ...prev, history: [...(prev.history || []), newMessage] };
    });
    setReplyTarget(null);
   };

   const sendStickerMessage = (sticker: string) => {
     if (!activeChat || !sticker) return;
     // DND enforcement - block non-priority sticker messages during DND
      if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
        toast(t('chat.dndStickerBlocked'), { duration: 3000 });
       return;
     }
     
     const newMessage = {
       id: Date.now(),
       sender: "me",
       text: sticker,
       type: "sticker",
       replyTo: replyTarget ? {
         id: replyTarget.id,
         sender: replyTarget.sender,
         text: replyTarget.text,
         type: replyTarget.type,
         duration: replyTarget.duration
       } : undefined,
       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       status: "sent",
       silent: silentMode
     };

     setChats(prevChats => prevChats.map(c => {
       if (activeChat.id === c.id) {
          return { ...c, history: [...(c.history || []), newMessage] };
       }
       return c;
     }));

     setActiveChat((prev: any) => {
       if (!prev) return prev;
       return { ...prev, history: [...(prev.history || []), newMessage] };
     });

     setReplyTarget(null);
     setShowStickerPicker(false);
   };

   const handleSendMessage = () => {
     if (!messageText.trim() && !morseMode) return;
     
     const sentText = morseMode && messageText ? encodeMorse(messageText) : messageText.trim();
     if (!sentText) return;

     // DND enforcement - block non-priority messages during DND
      if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
        toast(t('chat.dndMessageBlocked'), { duration: 3000 });
       return;
     }

     if (scheduleDateTime) {
      const scheduledTimeMs = new Date(scheduleDateTime).getTime();
      if (scheduledTimeMs > Date.now()) {
        scheduledQueue.addMessage({
          id: `sched_${Date.now()}`,
          chatId: activeChat?.id as string | number,
          text: sentText,
          scheduledAt: scheduledTimeMs
        });
        setMessageText("");
        setScheduleDateTime("");
        return;
      }
    }

    // Parse @mentions in the message text
     const { text: parsedText, mentions } = parseMentions(sentText);

     const newMessage = {
       id: Date.now(),
       sender: "me",
       text: parsedText,
       mentions: mentions.length > 0 ? mentions : undefined,
      replyTo: replyTarget ? {
        id: replyTarget.id,
        sender: replyTarget.sender,
        text: replyTarget.text,
        type: replyTarget.type,
        duration: replyTarget.duration
      } : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent",
      silent: silentMode
    };

    setChats(prevChats => prevChats.map(c => {
      if (activeChat && c.id === activeChat.id) {
         return { ...c, history: [...(c.history || []), newMessage] };
      }
      return c;
    }));

    setActiveChat((prev: any) => {
      if (!prev) return prev;
      return { ...prev, history: [...(prev.history || []), newMessage] };
    });

    setMessageText("");
    setSilentMode(false);
    setReplyTarget(null);
    if (activeChat) {
      setDraftTextByChat(prev => ({ ...prev, [String(activeChat.id)]: "" }));
    }

    const msgId = newMessage.id;
    setTimeout(() => {
      updateMessageStatus(msgId, "delivered");
    }, 1000);
  };

  const toggleSavedMessage = (chatContext: any, msg: any) => {
    if (!chatContext || !msg) return;
    setSavedMessages(prev => {
      const existingIndex = prev.findIndex(item => item.chatId === chatContext.id && item.messageId === msg.id);
      if (existingIndex > -1) {
        return prev.filter((_, index) => index !== existingIndex);
      }
      const preview =
        msg.type === "audio"
          ? t('chat.savedVoiceNote', { duration: msg.duration || "0:00" })
          : msg.type === "image"
            ? t('chat.savedPhoto')
            : msg.type === "video"
              ? t('chat.savedVideo')
              : msg.text || t('chat.savedMessage');
      return [
        ...prev,
        {
          key: `${chatContext.id}_${msg.id}`,
          chatId: chatContext.id,
          chatName: chatContext.name,
          messageId: msg.id,
          sourceLabel: chatContext.name,
          preview: typeof preview === "string" ? preview.slice(0, 180) : t('chat.savedMessage'),
          time: msg.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ];
    });
  };

  const updateMessageStatus = (msgId: number, status: string) => {
    setChats(prevChats => prevChats.map(c => {
      if (!c.history) return c;
      const updatedHistory = c.history.map((m: any) => m.id === msgId ? { ...m, status } : m);
      return { ...c, history: updatedHistory };
    }));
    setActiveChat((prev: any) => {
      if (!prev) return prev;
      const updatedHistory = prev.history.map((m: any) => m.id === msgId ? { ...m, status } : m);
      return { ...prev, history: updatedHistory };
    });
  };

  useEffect(() => {
    if (!activeChat) return;
    const savedDraft = draftTextByChat[String(activeChat.id)] || "";
    setMessageText(savedDraft);
  }, [activeChat?.id]);

  const hubItems = [
    { id: 'channels', angle: 0, title: t('hub.channels'), subtitle: t('hub.channelsSubtitle'), icon: Hash },
    { id: 'chats', angle: 30, title: t('hub.chats'), subtitle: t('hub.chatsSubtitle'), icon: MessageCircle },
    { id: 'stories', angle: 60, title: t('hub.stories'), subtitle: t('hub.storiesSubtitle'), icon: Camera },
    { id: 'pulse', angle: 90, title: t('hub.metropulse'), subtitle: t('hub.metropulseSubtitle'), icon: Activity },
    { id: 'radar', angle: 150, title: t('hub.radar'), subtitle: t('hub.radarSubtitle'), icon: Target },
    { id: 'contacts', angle: 180, title: t('hub.contacts'), subtitle: t('hub.contactsSubtitle'), icon: Users },
    { id: 'calls', angle: 210, title: t('hub.calls'), subtitle: t('hub.callsSubtitle'), icon: Phone },
    { id: 'recordings', angle: 240, title: t('hub.recordings'), subtitle: t('hub.recordingsSubtitle'), icon: Mic },
    { id: 'bots', angle: 270, title: t('hub.bots'), subtitle: t('hub.botsSubtitle'), icon: Bot },
    { id: 'settings', angle: 330, title: t('hub.settings'), subtitle: t('hub.settingsSubtitle'), icon: Settings },
  ];

  const compactNavItems = [
    { id: 'chats', icon: MessageCircle },
    { id: 'channels', icon: Hash },
    { id: 'contacts', icon: Users },
    { id: 'settings', icon: Settings },
  ];

  if (appLockHashedPIN && !isUnlocked) {
    return (
      <AppLockView
        isDark={isDark}
        pinInput={pinInput}
        pinError={pinError}
        onPinChange={setPinInput}
        onSubmit={handleUnlock}
        t={t}
      />
    );
  }

  return (
    <>
      <Toaster position="top-right" duration={3000} />
      <div className={`perspective-root w-full h-[100dvh] flex flex-col items-center justify-center font-sans select-none overflow-hidden relative ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
      {isDark && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      )}
      
      <div className="absolute bottom-6 left-6 flex items-center gap-3 z-50">
        <ThemeToggle isDark={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} t={t} />
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-3 z-50">
        <LanguageSelector
          isDark={isDark}
          showLangMenu={showLangMenu}
          setShowLangMenu={setShowLangMenu}
          language={language}
          onSelect={(code) => { setLanguage(code); setLang(code); }}
          languages={LANGUAGES}
        />
      </div>

      <AnimatePresence mode="wait">
        {view === 'hub' ? (
          <motion.div 
            key="hub-view"
            className="flex-1 w-full h-[100dvh] bg-transparent flex flex-col items-center justify-center relative z-10"
          >
            <AccountSwitcher theme={theme} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 scale-[0.45] min-[400px]:scale-[0.5] sm:scale-[0.6] md:scale-90 lg:scale-100 flex-1 flex flex-col items-center justify-center"
            >
              <RadialMenu 
                theme={theme} 
                items={hubItems} 
                centerTitle={t('hub.centerTitle')} 
                centerSubtitle={t('hub.centerSubtitle')} 
                onCenterClick={() => {}} 
                onItemClick={(id) => setView(id as any)}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="content-view"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-8 pb-24 h-full min-h-0"
          >
            <AppHeader
              isDark={isDark}
              view={view}
              activeChat={activeChat}
              onBack={() => {
                if (activeChat) setActiveChat(null);
                else setView('hub');
              }}
              t={t}
            />
            
            {/* Content Switcher */}
            <div className={`flex-1 w-full min-h-0 ${isWide && view !== 'hub' ? 'flex gap-0' : ''}`}>
              {isWide && view !== 'hub' && (
                <div className="w-[68px] shrink-0 border-r border-[var(--separator)] flex flex-col items-center py-4 gap-3 bg-[var(--secondary-system-bg)]">
                  {compactNavItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        view === item.id
                          ? 'bg-[var(--system-blue)] text-white shadow-md'
                          : 'text-[var(--system-gray)] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon size={20} />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 w-full overflow-hidden relative px-4 flex flex-col items-center min-h-0">
              {view === 'pulse' && <SystemPulsePlayer theme={theme} />}
              {view === 'radar' && <MeshRadar theme={theme} />}
{view === 'calls' && <Dialpad 
                theme={theme} 
                contacts={contacts}
                showContactPicker={showContactPicker}
                setShowContactPicker={setShowContactPicker}
                onCall={(name, color) => {
                   setView('calls');
                }} 
                onMessage={(name, color) => {
                   setView('chats');
                   const existingChat = chats.find(c => c.name === name && c.type === 'direct');
                   if (existingChat) {
                      setActiveChat(existingChat);
                   } else {
                      const newChat = { id: Date.now(), name, type: "direct", color: color || "from-blue-400 to-indigo-500", online: true, history: [] };
                      setChats([newChat, ...chats]);
                      setActiveChat(newChat);
                   }
                }} 
              />}
               {view === 'settings' && <SettingsView theme={theme} setTheme={setTheme} themeMode={themeMode} setThemeMode={setThemeMode as any} />}
               {view === 'recordings' && <RecordingsScreen theme={theme} onBack={() => setView('hub')} />}
               {view === 'contacts' && <ContactsView 
                theme={theme} 
                contacts={contacts}
                setContacts={setContacts}
                onCall={(name, color) => {
                   setView('calls');
                }} 
                onMessage={(name, color) => {
                   setView('chats');
                   const existingChat = chats.find(c => c.name === name && c.type === 'direct');
                   if (existingChat) {
                      setActiveChat(existingChat);
                   } else {
                      const newChat = { id: Date.now(), name, type: "direct", color: color || "from-blue-400 to-indigo-500", online: true, history: [] };
                      setChats([newChat, ...chats]);
                      setActiveChat(newChat);
                   }
                }} 
              />}
              
              {view === 'saved' && (
                <SavedMessagesView
                  theme={theme}
                  savedMessages={savedMessages}
                  onBack={() => setView('chats')}
                  onOpenChat={(chatName) => {
                    const existingChat = chats.find(c => c.name === chatName && c.type === 'direct');
                    if (existingChat) {
                      setActiveChat(existingChat);
                    }
                  }}
                />
              )}

              {(view === 'chats' || view === 'channels' || view === 'bots' || view === 'stories') && (
                !activeChat ? (
                  <ChatListPanel
                    isDark={isDark}
                    theme={theme}
                    view={view}
                    setView={setView}
                    activeChat={activeChat}
                    setActiveChat={setActiveChat}
                    chatSearchQuery={chatSearchQuery}
                    setChatSearchQuery={setChatSearchQuery}
                    filteredChats={filteredChats}
                    filteredChannels={filteredChannels}
                    bots={bots}
                    channels={channels}
                    setShowCreateChannel={setShowCreateChannel}
                    setShowCreateBot={setShowCreateBot}
                    activeFolder={activeFolder}
                    setActiveFolder={setActiveFolder}
                    setShowAdvancedFilterModal={setShowAdvancedFilterModal}
                    advancedFilters={advancedFilters}
                    toggleArchive={toggleArchive}
                    savedMessages={savedMessages}
                    archivedUnreadCount={archivedUnreadCount}
                    chatFolders={chatFolders}
                    setShowFolderManager={setShowFolderManager}
                    setGlobalSelectedContact={setGlobalSelectedContact}
                    setPreviewChat={setPreviewChat}
                    setActiveStory={setActiveStory}
                    t={t}
                  />
                ) : (
                  <div className="w-full max-w-[800px] h-[90%] relative z-10 animate-fade-in mt-6 max-h-[800px]">
                    <ChatPreviewLayer chat={activeChat} theme={theme} onClose={() => setActiveChat(null)} onUpdateChat={setActiveChat} onAction={(text: string) => text === "MUTE_TOGGLE" ? setActiveChat({ ...activeChat, isMuted: !activeChat.isMuted }) : setMessageText(text)} onCall={(name: string, color?: string) => { setView('calls'); }} onMessage={(name: string, color?: string) => { setView('chats'); const existingChat = chats.find(c => c.name === name && c.type === 'direct'); if (existingChat) { setActiveChat(existingChat); } else { const newChat = { id: Date.now(), name, type: "direct", color: color || "from-blue-400 to-indigo-500", online: true, history: [] }; setChats([newChat, ...chats] as any); setActiveChat(newChat); } }} onReply={(msg: any) => setReplyTarget(msg)} savedMessages={savedMessages} onToggleSavedMessage={toggleSavedMessage} deliveryReceipts={deliveryReceipts} readReceipts={readReceipts} onEditChannel={(ch: any) => setShowEditChannel(ch)} />
                    
                    <ChatInputBar
                      isDark={isDark}
                      theme={theme}
                      activeChat={activeChat}
                      messageText={messageText}
                      onMessageTextChange={(text) => {
                        setMessageText(text);
                        if (activeChat) setDraftTextByChat(prev => ({ ...prev, [String(activeChat.id)]: text }));
                      }}
                      onSend={handleSendMessage}
                      onSendVoice={sendVoiceMessage}
                      onSendSticker={sendStickerMessage}
                      isRecordingVoice={isRecordingVoice}
                      setIsRecordingVoice={setIsRecordingVoice}
                      voiceNoteError={voiceNoteError}
                      setVoiceNoteError={setVoiceNoteError}
                      showSchedulePopup={showSchedulePopup}
                      setShowSchedulePopup={setShowSchedulePopup}
                      scheduleDateTime={scheduleDateTime}
                      setScheduleDateTime={setScheduleDateTime}
                      showStickerPicker={showStickerPicker}
                      setShowStickerPicker={setShowStickerPicker}
                      replyTarget={replyTarget}
                      setReplyTarget={setReplyTarget}
                      silentMode={silentMode}
                      setSilentMode={setSilentMode}
                      morseMode={morseMode}
                      setMorseMode={setMorseMode}
                      onAttachImage={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const url = URL.createObjectURL(e.target.files[0]);
                          const newMessage = { id: Date.now(), sender: "me", text: "", type: "image", attachment: url, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: "sent", silent: silentMode };
                          setChats((prevChats: any[]) => prevChats.map(c => c.id === activeChat.id ? { ...c, history: [...(c.history || []), newMessage] } : c));
                          setActiveChat((prev: any) => ({ ...prev, history: [...(prev.history || []), newMessage] }));
                        }
                        e.target.value = '';
                      }}
                      onMuteToggle={() => {
                        setActiveChat({ ...activeChat, isMuted: !activeChat.isMuted });
                        setChannels(prev => prev.map(c => c.id === activeChat.id ? { ...c, isMuted: !activeChat.isMuted } : c) as any);
                      }}
                      t={t}
                    />
                  </div>
                )
              )}
              </div>
            </div>
            
            <HomeButton
              isDark={isDark}
              onHome={() => { setActiveChat(null); setView('hub'); }}
              t={t}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <StoryViewer
        activeStory={activeStory}
        onClose={() => setActiveStory(null)}
        storyMentions={storyMentions}
        onAddMention={(storyId, name) => {
          setStoryMentions(prev => ({
            ...prev,
            [storyId]: [...(prev[storyId] || []), name]
          }));
          setStoryMentionInput('');
        }}
        mentionInput={storyMentionInput}
        onMentionInputChange={setStoryMentionInput}
        t={t}
      />

      {showCreateChannel && <CreateChannelModal theme={theme} onClose={() => setShowCreateChannel(false)} />}
      {showEditChannel && (
        <EditChannelModal
          channel={showEditChannel}
          theme={theme}
          onClose={() => setShowEditChannel(null)}
          onSave={(updated) => {
            setChannels(prev => prev.map(c => c.id === updated.id ? updated : c) as any);
            setActiveChat(updated);
          }}
        />
      )}
      {showCreateBot && <CreateBotModal theme={theme} onClose={() => setShowCreateBot(false)} />}

      <AdvancedFilterModal
        isDark={isDark}
        show={showAdvancedFilterModal}
        onClose={() => setShowAdvancedFilterModal(false)}
        filters={advancedFilters}
        onToggle={(key) => setAdvancedFilters(prev => ({ ...prev, [key]: !prev[key as keyof typeof advancedFilters] }))}
        onReset={() => setAdvancedFilters({ hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false })}
        t={t}
      />

        <AnimatePresence>
        {showFolderManager && <FolderManagerModal theme={theme} onClose={() => setShowFolderManager(false)} />}
      </AnimatePresence>

      <ContactProfileModal 
         contact={globalSelectedContact}
         theme={theme}
         onClose={() => setGlobalSelectedContact(null)}
         onCall={() => {
            setView('calls');
            setGlobalSelectedContact(null);
         }}
         onMessage={() => {
            setView('chats');
            if (globalSelectedContact) {
               const existingChat = chats.find(c => c.name === globalSelectedContact.name && c.type === 'direct');
               if (existingChat) {
                  setActiveChat(existingChat);
               } else {
                  const newChat = { id: Date.now(), name: globalSelectedContact.name, type: "direct", color: globalSelectedContact.color || "from-blue-400 to-indigo-500", online: true, history: [] };
                  setChats([newChat, ...chats]);
                  setActiveChat(newChat);
               }
            }
            setGlobalSelectedContact(null);
         }}
         onDelete={() => {
            if (activeChat && activeChat.name === globalSelectedContact?.name) setActiveChat(null);
            if (globalSelectedContact && channels.some(c => c.name === globalSelectedContact.name)) {
              setChannels(prev => prev.filter(c => c.name !== globalSelectedContact?.name) as any);
            } else {
              setChats(chats.filter(c => c.name !== globalSelectedContact?.name) as any);
            }
            setGlobalSelectedContact(null);
         }}
       onEdit={() => {
          if (globalSelectedContact) {
            const isChannel = channels.some(c => c.name === globalSelectedContact.name);
            if (isChannel) {
              const ch = channels.find(c => c.name === globalSelectedContact.name);
              setShowEditChannel(ch);
            } else {
              setEditContactName(globalSelectedContact.name);
              setEditingContactId(globalSelectedContact.id);
              setShowEditContactForm(true);
            }
            setGlobalSelectedContact(null);
          }
          }}
         onBlock={() => {
            if (activeChat && activeChat.name === globalSelectedContact?.name) setActiveChat(null);
            setChats(chats.filter(c => c.name !== globalSelectedContact?.name));
            setGlobalSelectedContact(null);
         }}
      />
      
     {view !== 'calls' && <FloatingCallWidget theme={theme} />}

     <AnimatePresence>
        {previewChat && (
          <SlideUpPreview
            theme={theme}
            chat={previewChat}
            onClose={() => setPreviewChat(null)}
            onOpenChat={() => { setActiveChat(previewChat); setPreviewChat(null); }}
            onSendMessage={(text) => {
              const newMsg = {
                id: Date.now(), sender: "me", text, type: "text",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: "sent"
              };
              setChats(prev => prev.map(c => c.id === previewChat.id ? { ...c, history: [...(c.history || []), newMsg] } : c));
              setPreviewChat(null);
            }}
          />
        )}
     </AnimatePresence>

      <EditContactModal
        show={showEditContactForm}
        editContactName={editContactName}
        editingContactId={editingContactId}
        onNameChange={setEditContactName}
        onSave={() => {
          setContacts((prev: any[]) => prev.map((c: any) => c.id === editingContactId ? { ...c, name: editContactName } : c));
          setShowEditContactForm(false);
          setEditingContactId(null);
        }}
        onClose={() => setShowEditContactForm(false)}
        t={t}
      />
     </div>
     </>
    );
  }
