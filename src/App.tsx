import { ChatWorkspace } from "./components/chat";
import { AppOverlays, ContentView, GlobalControls, HubView } from "./components/app";
import { SafeRender } from "./components/resilience";
import { FeatureViews } from "./components/features/FeatureViews";
import { encodeMorse } from "./components/MorseDecoder";
import { MOCK_CALLS, MOCK_CHATS, MOCK_CHANNELS } from "./components/mockData";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Activity, Bot, Hash, Lock, MessageCircle, Mic, Phone, Settings, Target, Users } from "lucide-react";
import { useAppStore } from "./store";
import { cryptoCore } from "./lib/crypto/cryptoCore";
import { useI18n } from "./lib/i18n";
import { toast } from "sonner";
import { Toaster } from "sonner";
import type { Contact } from "./types/contact";
import type { ContactProfile } from "./components/ContactProfileModal";


// --- Mention & DND utilities ---
const MENTION_PATTERN = /@(\w+)/g;

const parseMentions = (text: string): { text: string; mentions: { name: string; index: number }[] } => {
  const mentions: { name: string; index: number }[] = [];
  let match;
  const regex = new RegExp(MENTION_PATTERN);
  while ((match = regex.exec(text)) !== null) {
    mentions.push({ name: match[1], index: match.index });
  }
  return { text, mentions };
};

const isDNDEnabled = () => {
  try {
    const dndEnabled = localStorage.getItem("app_dnd_enabled") === "true";
    const dndFrom = localStorage.getItem("app_dnd_from") || "22:00";
    const dndTo = localStorage.getItem("app_dnd_to") || "08:00";
    if (!dndEnabled) return false;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const [fromH, fromM] = dndFrom.split(':').map(Number);
    const [toH, toM] = dndTo.split(':').map(Number);
    const fromMinutes = fromH * 60 + fromM;
    const toMinutes = toH * 60 + toM;
    if (fromMinutes <= toMinutes) {
      return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
    } else {
      return currentMinutes >= fromMinutes || currentMinutes <= toMinutes;
    }
  } catch {
    return false;
  }
};

const isPriorityContact = (contactName: string) => {
  try {
    const priorityStr = localStorage.getItem("app_priority_contacts");
    if (!priorityStr) return false;
    const names = JSON.parse(priorityStr);
    return names.some((n: string) => contactName.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(contactName.toLowerCase()));
  } catch {
    return false;
  }
};

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'dark';
  });
  const { t, setLang } = useI18n();
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const { 
    appLockHashedPIN, appLockSalt, chats, setChats, channels, setChannels, bots,
    scheduledQueue,
    archivedChats, toggleArchive,
    readReceipts, deliveryReceipts,
    contacts, setContacts
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
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [globalSelectedContact, setGlobalSelectedContact] = useState<ContactProfile | null>(null);
  const [draftTextByChat, setDraftTextByChat] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem("mess_drafts");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
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


  useEffect(() => {
    if (chats.length === 0) setChats(MOCK_CHATS);
    if (contacts.length === 0) {
      setContacts([
        { name: "Alice", id: "5a2f...9b1c", color: "from-rose-400 to-red-500", lastSeen: 1000 * 60 * 5 },
        { name: "Bob (Relay)", id: "node_f88b", color: "from-blue-400 to-indigo-500", lastSeen: 1000 * 60 * 60 * 2 },
        { name: "Charlie", id: "3c4d...5e6f", color: "from-amber-400 to-orange-400", lastSeen: 1000 * 60 * 30 },
        { name: "Diana", id: "7g8h...9i0j", color: "from-purple-400 to-fuchsia-400", lastSeen: 1000 * 60 * 60 * 24 },
      ]);
    }
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
  const handleUnlock = async (e?: FormEvent) => {
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

  const [view, setView] = useState<'hub' | 'chats' | 'channels' | 'bots' | 'radar' | 'pulse' | 'calls' | 'settings' | 'contacts' | 'stories' | 'recordings'>('hub');
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
  
  const isDark = theme === 'dark';
  const currentChatList = chats;

  const archivedUnreadCount = useMemo(() => {
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

    const isArchived = archivedChats.includes(chat.id);
if (activeFolder === 'archived') return isArchived;
    if (isArchived) return false;
    
    if (activeFolder === 'unread') return chat.unread > 0;
    if (activeFolder === 'personal') return chat.name === 'Alice Freeman'; 
    if (activeFolder === 'work') return chat.name === 'Design Team'; 
    return true; 
  }), [currentChatList, chatSearchQuery, activeFolder, archivedChats, advancedFilters]);
  
  const filteredChannels = useMemo(() => channels.filter(channel => {
    const query = chatSearchQuery.toLowerCase().trim();
    const historyText = ((channel as any).history || [])
      .flatMap((m: any) => [m.text, m.replyTo?.text, m.duration, m.sender].filter(Boolean))
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || channel.name.toLowerCase().includes(query) || (channel as any).message?.toLowerCase().includes(query) || historyText.includes(query);
    if (!matchesSearch) return false;
    const isArchived = archivedChats.includes(channel.id);
    if (activeFolder === 'archived') return isArchived;
    if (isArchived) return false;
    return true;
  }), [channels, chatSearchQuery, activeFolder, archivedChats]);

 const sendVoiceMessage = (audioUrl: string, durationStr: string) => {
     // DND enforcement - block non-priority voice messages during DND
     if (isDNDEnabled() && !isPriorityContact(activeChat?.name || "")) {
       toast("Voice message blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
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
       toast("Sticker blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
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
       toast("Message blocked - DND is active. Priority contacts can bypass.", { duration: 3000 });
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
          ? `Voice note · ${msg.duration || "0:00"}`
          : msg.type === "image"
            ? "Photo"
            : msg.type === "video"
              ? "Video"
              : msg.text || "Message";
      return [
        ...prev,
        {
          key: `${chatContext.id}_${msg.id}`,
          chatId: chatContext.id,
          chatName: chatContext.name,
          messageId: msg.id,
          sourceLabel: chatContext.name,
          preview: typeof preview === "string" ? preview.slice(0, 180) : "Message",
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

  const store = useAppStore();

  const chatsUnread = store.chats.reduce((sum, c) => sum + (c.unread || 0), 0);
  const channelsUnread = store.channels.reduce((sum, c) => sum + ((c as any).unread || 0), 0);
  const missedCalls = [...MOCK_CALLS].filter((c) => c.type === 'missed').length + (store.activeCall ? 1 : 0);

  const hubBadges: Record<string, number> = {
    chats: chatsUnread,
    channels: channelsUnread,
    calls: missedCalls,
  };

  const hubItems = [
    { id: 'channels', angle: 0, title: t('hub.channels'), subtitle: t('hub.channelsSubtitle'), icon: Hash },
    { id: 'chats', angle: 30, title: t('hub.chats'), subtitle: t('hub.chatsSubtitle'), icon: MessageCircle },
    { id: 'pulse', angle: 90, title: t('hub.metropulse'), subtitle: t('hub.metropulseSubtitle'), icon: Activity },
    { id: 'radar', angle: 150, title: t('hub.radar'), subtitle: t('hub.radarSubtitle'), icon: Target },
    { id: 'contacts', angle: 180, title: t('hub.contacts'), subtitle: t('hub.contactsSubtitle'), icon: Users },
    { id: 'calls', angle: 210, title: t('hub.calls'), subtitle: t('hub.callsSubtitle'), icon: Phone },
    { id: 'recordings', angle: 240, title: t('hub.recordings'), subtitle: t('hub.recordingsSubtitle'), icon: Mic },
    { id: 'bots', angle: 270, title: t('hub.bots'), subtitle: t('hub.botsSubtitle'), icon: Bot },
    { id: 'settings', angle: 330, title: t('hub.settings'), subtitle: t('hub.settingsSubtitle'), icon: Settings },
  ];

  if (appLockHashedPIN && !isUnlocked) {
    return (
      <div className={`w-full h-[100dvh] flex flex-col items-center justify-center font-sans ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
         <div className={`p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl ${isDark ? "bg-[#11141c] border border-white/10" : "bg-white border border-black/5"}`}>
            <Lock size={48} className={`mb-6 ${isDark ? "text-orange-500" : "text-orange-600"}`} />
            <h2 className="text-2xl font-bold mb-2 text-center">{t('lock.title')}</h2>
            <p className={`text-sm mb-6 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
               {t('lock.description')}
            </p>
            <form onSubmit={handleUnlock} className="w-full">
               <input 
                 type="password" 
                 value={pinInput}
                 onChange={e => setPinInput(e.target.value)}
                 autoFocus
                 className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-4 focus:outline-none transition-colors ${
                    isDark 
                      ? "bg-[#16181d] border-white/10 focus:border-orange-500/50" 
                      : "bg-[#f4f7f9] border-black/10 focus:border-orange-500/50"
                 } ${pinError ? "border-red-500 text-red-500" : ""}`}
                 placeholder="****"
               />
               <button 
                 type="submit"
                 className={`w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 ${
                    isDark
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
                      : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                 }`}
               >
                  {t('lock.unlock')}
               </button>
            </form>
         </div>
      </div>
    );
  }

  const handleBack = () => {
    if (activeChat) setActiveChat(null);
    else setView("hub");
  };

  const handleHome = () => {
    setActiveChat(null);
    setView("hub");
  };

  const handlePreviewCall = (name: string, color?: string) => {
    useAppStore.getState().setActiveCall({ number: name, startTime: Date.now(), isMuted: false, isSpeaker: false });
    setView("calls");
  };

  const handlePreviewMessage = (name: string, color?: string) => {
    setView("chats");
    const existingChat = chats.find((chat) => chat.name === name && chat.type === "direct");
    if (existingChat) {
      setActiveChat(existingChat);
      return;
    }

    const newChat = {
      id: Date.now(),
      name,
      type: "direct",
      color: color || "from-blue-400 to-indigo-500",
      online: true,
      history: [],
    };
    setChats([newChat, ...chats] as any);
    setActiveChat(newChat);
  };

  const handleProfileCall = () => {
    if (globalSelectedContact) handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color);
    setGlobalSelectedContact(null);
  };

  const handleProfileMessage = () => {
    if (globalSelectedContact) handlePreviewMessage(globalSelectedContact.name, globalSelectedContact.color);
    setGlobalSelectedContact(null);
  };

  const handleProfileDelete = () => {
    if (activeChat && activeChat.name === globalSelectedContact?.name) setActiveChat(null);
    setChats(chats.filter((contact) => contact.name !== globalSelectedContact?.name) as any);
    setGlobalSelectedContact(null);
  };

  const handleProfileEdit = () => {
    if (globalSelectedContact) setEditingContact(globalSelectedContact);
    setGlobalSelectedContact(null);
  };

  const handleProfileBlock = () => {
    if (activeChat && activeChat.name === globalSelectedContact?.name) setActiveChat(null);
    setChats(chats.filter((contact) => contact.name !== globalSelectedContact?.name));
    setGlobalSelectedContact(null);
  };

  const contentViewTitle = activeChat ? activeChat.name : t(`hub.${view}`);
  const isChatListRoute = view === "chats" || view === "channels" || view === "bots" || view === "stories";

  const activeChatWorkspaceProps = {
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
    handleSendMessage,
    sendVoiceMessage,
    sendStickerMessage,
    savedMessages,
    onToggleSavedMessage: toggleSavedMessage,
    onPreviewCall: handlePreviewCall,
    onPreviewMessage: handlePreviewMessage,
    setEditingContact,
    onToggleMute: () => {
      setActiveChat({ ...activeChat, isMuted: !activeChat?.isMuted });
      setChannels((prev) => prev.map((channel) => channel.id === activeChat?.id ? { ...channel, isMuted: !activeChat?.isMuted } : channel) as any);
    },
    onAttachImage: (newMessage: any) => {
      setChats((prevChats) => prevChats.map((chat) => chat.id === activeChat?.id ? { ...chat, history: [...(chat.history || []), newMessage] } : chat));
      setActiveChat((prev) => ({ ...prev, history: [...(prev.history || []), newMessage] }));
    },
    onHoldRecord: () => {
      if (!messageText) {
        setVoiceNoteError("");
        setIsRecordingVoice(true);
      }
    },
    onReRecord: () => setIsRecordingVoice(true),
    onPermissionDenied: (message: string) => {
      setIsRecordingVoice(false);
      setVoiceNoteError(message);
    },
    onSendVoice: (url: string, duration: string) => {
      setIsRecordingVoice(false);
      sendVoiceMessage(url, duration);
      setVoiceNoteError("");
    },
    onToggleSchedulePopup: () => setShowSchedulePopup(!showSchedulePopup),
    onToggleSilent: () => setSilentMode(!silentMode),
    onToggleMorse: () => setMorseMode(!morseMode),
  };

  const chatListWorkspaceProps = {
    theme,
    view,
    activeFolder,
    setActiveFolder,
    chatSearchQuery,
    setChatSearchQuery,
    filteredChats,
    filteredChannels,
    bots,
    archivedUnreadCount,
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
  };

  return (
    <>
      <Toaster position="top-right" duration={3000} />
      <div className={`w-full h-[100dvh] flex flex-col items-center justify-center font-sans select-none overflow-hidden relative ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
        {isDark && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
        )}

        <GlobalControls
          isDark={isDark}
          theme={theme}
          setTheme={setTheme}
          showLangMenu={showLangMenu}
          setShowLangMenu={setShowLangMenu}
          language={language}
          setLanguage={(code) => {
            setLanguage(code);
            setLang(code);
            setShowLangMenu(false);
          }}
          t={t}
        />

        <AnimatePresence mode="wait">
          {view === "hub" ? (
            <SafeRender>
              <HubView
                theme={theme}
                items={hubItems}
                badges={hubBadges}
                centerTitle={t("hub.centerTitle")}
                centerSubtitle={t("hub.centerSubtitle")}
                onItemClick={(id) => setView(id)}
              />
            </SafeRender>
          ) : (
            <ContentView
              title={contentViewTitle}
              theme={theme}
              isDark={isDark}
              t={t}
              onBack={handleBack}
              onHome={handleHome}
              onCloseStory={() => setActiveStory(null)}
              showHomeButton={!activeChat}
              activeStory={activeStory}
              isStealthMode={useAppStore.getState().stealthMode}
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
                <FeatureViews
                  view={view}
                  theme={theme}
                  contacts={contacts}
                  setContacts={setContacts as any}
                  showContactPicker={showContactPicker}
                  setShowContactPicker={setShowContactPicker}
                  setEditingContact={setEditingContact}
                  chats={chats}
                  setChats={setChats as any}
                  setActiveChat={setActiveChat}
                  setView={setView}
                  onCall={handlePreviewCall}
                  onMessage={handlePreviewMessage}
                />
              </SafeRender>
            </ContentView>
          )}
        </AnimatePresence>

        <AppOverlays
          theme={theme}
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
          onProfileMessage={handleProfileMessage}
          onProfileDelete={handleProfileDelete}
          onProfileEdit={handleProfileEdit}
          onProfileBlock={handleProfileBlock}
        />
      </div>
    </>
  );
  }
