import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FeatureViews } from "./lib/lazyViews";
import { ChatWorkspace } from "./components/chat";
import { AppOverlays, ContentView } from "./components/app";
import { BottomNav, SidebarNav } from "./components/navigation";
import { SafeRender } from "./components/resilience";
import { encodeMorse } from "./components/MorseDecoder";
import { MOCK_DATA_ENABLED } from "./lib/mockDataFlag";
import { MOCK_CHATS, MOCK_CHANNELS, MOCK_CONTACTS } from "./constants";
import { CallScreen } from "./components/call/CallScreen";
import { IncomingCallSheet } from "./components/call/IncomingCallSheet";
import { HuddleWidget } from "./components/huddle/HuddleWidget";
import { useCall } from "./hooks/useCall";
import { useScreenshotProtection } from "./hooks/useScreenshotProtection";
import { AnimatePresence } from "motion/react";
import { Lock } from "lucide-react";
import { useAppStore } from "./store";
import { cryptoCore } from "./lib/crypto/cryptoCore";
import { useI18n } from "./lib/i18n";
import { toast } from "sonner";
import { Toaster } from "sonner";
import type { Contact } from "./types/contact";
import type { ContactProfile } from "./components/ContactProfileModal";
import { registerRiskSession, getLastActionDebugId } from "./utils/riskShell";
import { parseMentions, isDNDEnabled, isPriorityContact } from "./constants";
import { SignallingManager } from './lib/signaling/manager';
import { TransportIndicator } from './components/status/TransportIndicator';
import { STORAGE_KEYS } from './constants/storage';
import { ThemeContext, useTheme, type Theme } from './contexts/ThemeContext';

export default function App() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved === 'dark' || saved === 'light') ? (saved as Theme) : 'dark';
  });
  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEYS.THEME, t);
  };
  const isDark = theme === 'dark';
  const { t, setLang } = useI18n();
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en');


  const appLockHashedPIN = useAppStore(s => s.appLockHashedPIN);
  const appLockSalt = useAppStore(s => s.appLockSalt);
  const chats = useAppStore(s => s.chats);
  const setChats = useAppStore(s => s.setChats);
  const channels = useAppStore(s => s.channels);
  const setChannels = useAppStore(s => s.setChannels);
  const bots = useAppStore(s => s.bots);
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const archivedChats = useAppStore(s => s.archivedChats);
  const toggleArchive = useAppStore(s => s.toggleArchive);
  const readReceipts = useAppStore(s => s.readReceipts);
  const deliveryReceipts = useAppStore(s => s.deliveryReceipts);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const setActiveCall = useAppStore(s => s.setActiveCall);
  const callHistory = useAppStore(s => s.callHistory);
  const activeCall = useAppStore(s => s.activeCall);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [lockAttempts, setLockAttempts] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEYS.LOCK_ATTEMPTS) || '0', 10) } catch { return 0 }
  });
  const [lockBlockedUntil, setLockBlockedUntil] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL) || '0', 10) } catch { return 0 }
  });
  const [lockBlockTimer, setLockBlockTimer] = useState(0);
  const [activeStory, setActiveStory] = useState<{ id: number, name: string, color: string } | null>(null);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [savedMessages, setSavedMessages] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED_MESSAGES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  
  const stealthMode = useAppStore(state => state.stealthMode);
  useScreenshotProtection(stealthMode);

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [globalSelectedContact, setGlobalSelectedContact] = useState<ContactProfile | null>(null);
  const [draftTextByChat, setDraftTextByChat] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error'>('disconnected');
const [regionBlocked, setRegionBlocked] = useState(false);
const managerRef = useRef<SignallingManager | null>(null);

useEffect(() => {
  const seedUrls = [
    'wss://signaling1.messanger.app/ws',
    'wss://signaling2.messanger.app/ws',
    'wss://signaling3.messanger.app/ws',
  ];
  const mgr = new SignallingManager(seedUrls);
  managerRef.current = mgr;

  setConnectionStatus('connecting');
  mgr.connect().catch(() => setConnectionStatus('error'));

  const unsub1 = mgr.onStateChange((state) => {
    setConnectionStatus(state);
  });

  const unsub2 = mgr.onBlockedRegion((event) => {
    setRegionBlocked(true);
  });

  return () => {
    mgr.disconnect();
    unsub1();
    unsub2();
  };
}, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(draftTextByChat));
  }, [draftTextByChat]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED_MESSAGES, JSON.stringify(savedMessages));
  }, [savedMessages]);


useEffect(() => {
     if (!MOCK_DATA_ENABLED) return;
     if (chats.length === 0) setChats(MOCK_CHATS as any);
     if (contacts.length === 0) setContacts(MOCK_CONTACTS);
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

  // Handle App Lock authentication logic with exponential backoff
  const getBlockDuration = (attempts: number): number => {
    if (attempts <= 2) return 0
    if (attempts === 3) return 30000
    if (attempts === 4) return 60000
    if (attempts === 5) return 120000
    if (attempts === 6) return 300000
    if (attempts === 7) return 900000
    return Infinity
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (lockBlockedUntil > Date.now()) {
      setLockBlockTimer(Math.ceil((lockBlockedUntil - Date.now()) / 1000))
      timer = setInterval(() => {
        const remaining = Math.ceil((lockBlockedUntil - Date.now()) / 1000)
        if (remaining <= 0) {
          setLockBlockTimer(0)
          clearInterval(timer)
        } else {
          setLockBlockTimer(remaining)
        }
      }, 1000)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [lockBlockedUntil])

  const handleUnlock = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!appLockHashedPIN || !appLockSalt) return;

    if (lockBlockedUntil > Date.now()) {
      setPinError(true);
      return;
    }

    const hashed = await cryptoCore.hashAppLockPIN(pinInput, appLockSalt);
    if (hashed.hash === appLockHashedPIN) {
       setIsUnlocked(true);
       setPinError(false);
       setLockAttempts(0);
       setLockBlockedUntil(0);
localStorage.setItem(STORAGE_KEYS.LOCK_ATTEMPTS, '0');
        localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, '0');
    } else {
       const newAttempts = lockAttempts + 1
       setLockAttempts(newAttempts)
       localStorage.setItem(STORAGE_KEYS.LOCK_ATTEMPTS, String(newAttempts))
       const duration = getBlockDuration(newAttempts)
       if (duration > 0 && duration !== Infinity) {
         const blockedUntil = Date.now() + duration
         setLockBlockedUntil(blockedUntil)
         localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, String(blockedUntil))
       } else if (duration === Infinity) {
         setLockBlockedUntil(Infinity)
         localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, 'permanent')
       }
       setPinError(true);
       setPinInput('');
    }
  };

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
   const [companySearchQuery, setCompanySearchQuery] = useState("");
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

const chatsUnread = useMemo(() => chats.reduce((sum, c) => sum + (c.unread || 0), 0), [chats]);
   const channelsUnread = useMemo(() => channels.reduce((sum, c) => sum + ((c as any).unread || 0), 0), [channels]);
   const companyUnread = useAppStore(state => state.companyChannels?.reduce((sum: number, c: any) => sum + (c.unread || 0), 0) || 0);
   const missedCalls = useMemo(() => callHistory.filter((c) => c.type === 'missed').length + (activeCall ? 1 : 0), [callHistory, activeCall]);

  if (appLockHashedPIN && !isUnlocked) {
    return (
      <div className={`w-full h-[100dvh] flex flex-col items-center justify-center font-sans ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
         <div className={`p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl ${isDark ? "bg-[#11141c] border border-white/10" : "bg-white border border-black/5"}`}>
            <Lock size={48} className={`mb-6 ${isDark ? "text-orange-500" : "text-orange-600"}`} />
            <h2 className="text-2xl font-bold mb-2 text-center">{t('lock.title')}</h2>
            <p className={`text-sm mb-6 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
               {t('lock.description')}
            </p>
               {lockBlockedUntil === Infinity ? (
                 <div className="text-center mb-4">
                   <p className="text-red-500 font-bold text-sm">Too many attempts</p>
                   <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>App is permanently locked. Recovery required.</p>
                 </div>
               ) : lockBlockTimer > 0 ? (
                 <div className="text-center mb-4">
                   <p className="text-red-500 font-bold text-sm">Locked</p>
                   <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Try again in {lockBlockTimer} seconds</p>
                 </div>
               ) : (
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
                   {pinError && (
                     <p className={`text-xs text-center mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                       Wrong PIN. {lockAttempts >= 2 ? `${3 - Math.min(lockAttempts, 3)} attempt(s) remaining` : `${3 - lockAttempts} attempt(s) remaining`}
                     </p>
                   )}
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
               )}
         </div>
      </div>
    );
  }

  const handleNavigate = (target: string) => {
    setActiveChat(null);
    setView(target as any);
    setSubView(null);
  };

const handlePreviewCall = (name: string, color?: string, callType: 'audio' | 'video' = 'audio') => {
    const existingCall = useAppStore.getState().activeCall;
    if (existingCall && existingCall.callType === callType && existingCall.status !== 'ended') {
      setActiveCall(existingCall);
      setView("calls");
      return;
    }
    const mockCall = {
      callId: `preview_${Date.now()}`,
      direction: 'outgoing' as const,
      status: 'connecting' as const,
      callType: callType as 'audio' | 'video',
      remotePeer: { peerId: 'preview', displayName: name },
      localStream: null,
      screenStream: null,
      isMuted: false,
      isSpeaker: false,
      isVideoEnabled: callType === 'video',
      isVideo: callType === 'video',
      isRecording: false,
      startTime: Date.now(),
      participants: [],
    };
    useAppStore.getState().setActiveCall(mockCall);
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
    if (!globalSelectedContact) return;
    if (useAppStore.getState().riskShellActive) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return;
    }
    handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color, 'audio');
    setGlobalSelectedContact(null);
  };

  const handleProfileVideoCall = () => {
    if (!globalSelectedContact) return;
    if (useAppStore.getState().riskShellActive) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return;
    }
    handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color, 'video');
    setGlobalSelectedContact(null);
  };

  const handleProfileMessage = () => {
    if (!globalSelectedContact) return;
    if (useAppStore.getState().riskShellActive) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return;
    }
    setView("chats");
    const existingChat = chats.find((chat) => chat.name === globalSelectedContact.name && chat.type === "direct");
    if (existingChat) {
      setActiveChat(existingChat);
    } else {
      const newChat = {
        id: Date.now(),
        name: globalSelectedContact.name,
        type: "direct",
        color: globalSelectedContact.color || "from-blue-400 to-indigo-500",
        online: true,
        history: [],
      };
      setChats([newChat, ...chats] as any);
      setActiveChat(newChat);
    }
    setGlobalSelectedContact(null);
  };

  const handleProfileDelete = () => {
    if (useAppStore.getState().riskShellActive && globalSelectedContact) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return;
    }
    if (activeChat && activeChat.name === globalSelectedContact?.name) setActiveChat(null);
    setChats(chats.filter((contact) => contact.name !== globalSelectedContact?.name) as any);
    setGlobalSelectedContact(null);
  };

  const handleProfileEdit = () => {
    if (useAppStore.getState().riskShellActive && globalSelectedContact) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return;
    }
    if (globalSelectedContact) setEditingContact(globalSelectedContact as unknown as Contact);
    setGlobalSelectedContact(null);
  };

  const handleProfileBlock = () => {
    if (useAppStore.getState().riskShellActive && globalSelectedContact) {
      registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
      toast.warning('Paused by risk shell');
      return;
    }
    if (activeChat && activeChat.name === globalSelectedContact?.name) setActiveChat(null);
    setChats(chats.filter((contact) => contact.name !== globalSelectedContact?.name));
    setGlobalSelectedContact(null);
  };

  const { call, startCall, acceptCall, endCall, toggleMute, toggleVideo, toggleScreenShare, toggleRecording, changeCallType: changeCallTypeHook } = useCall();
  const [incomingCall, setIncomingCall] = useState<{ peerId: string; displayName: string; callType: 'audio' | 'video' } | null>(null);
  const riskDebugId = useAppStore((state) => state.riskShellActive ? getLastActionDebugId(globalSelectedContact?.id || '') : undefined);
  const activeRiskContactId = useAppStore((state) => state.riskShellActive ? globalSelectedContact?.id : undefined);

const isChatListRoute = useMemo(() => view === "chats" || view === "channels" || view === "bots" || view === "stories", [view]);

  const handleSendMessageRef = useRef(handleSendMessage);
  const sendVoiceMessageRef = useRef(sendVoiceMessage);
  const sendStickerMessageRef = useRef(sendStickerMessage);
  const handlePreviewCallRef = useRef(handlePreviewCall);
  const handlePreviewMessageRef = useRef(handlePreviewMessage);

  useEffect(() => { handleSendMessageRef.current = handleSendMessage }, [handleSendMessage]);
  useEffect(() => { sendVoiceMessageRef.current = sendVoiceMessage }, [sendVoiceMessage]);
  useEffect(() => { sendStickerMessageRef.current = sendStickerMessage }, [sendStickerMessage]);
  useEffect(() => { handlePreviewCallRef.current = handlePreviewCall }, [handlePreviewCall]);
  useEffect(() => { handlePreviewMessageRef.current = handlePreviewMessage }, [handlePreviewMessage]);

const activeChatWorkspaceProps = useMemo(() => ({
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
    handleSendMessage: handleSendMessageRef.current,
    sendVoiceMessage: sendVoiceMessageRef.current,
    sendStickerMessage: sendStickerMessageRef.current,
    savedMessages,
    onToggleSavedMessage: toggleSavedMessage,
    onPreviewCall: handlePreviewCallRef.current,
    onPreviewVideoCall: (name: string, color?: string) => handlePreviewCallRef.current(name, color, 'video'),
    onPreviewMessage: handlePreviewMessageRef.current,
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
      sendVoiceMessageRef.current(url, duration);
      setVoiceNoteError("");
    },
    onToggleSchedulePopup: () => setShowSchedulePopup(!showSchedulePopup),
    onToggleSilent: () => setSilentMode(!silentMode),
    onToggleMorse: () => setMorseMode(!morseMode),
  }), [
    activeChat, setActiveChat, messageText, setMessageText, scheduleDateTime,
    showSchedulePopup, setShowSchedulePopup, setScheduleDateTime, isRecordingVoice,
    setIsRecordingVoice, voiceNoteError, showStickerPicker, setShowStickerPicker,
    morseMode, silentMode, replyTarget, setReplyTarget, draftTextByChat,
    setDraftTextByChat, setChats, setChannels, setVoiceNoteError, setSilentMode,
    setMorseMode, toggleSavedMessage, savedMessages, activeChat?.isMuted,
    handleSendMessageRef.current, sendVoiceMessageRef.current, sendStickerMessageRef.current,
    handlePreviewCallRef.current, handlePreviewMessageRef.current, messageText
  ]);

const chatListWorkspaceProps = useMemo(() => ({
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
    onCall: handlePreviewCallRef.current,
    onVideoCall: (name: string, color?: string) => handlePreviewCallRef.current(name, color, 'video'),
  }), [
    view, activeFolder, setActiveFolder, chatSearchQuery, setChatSearchQuery,
    filteredChats, filteredChannels, bots, archivedUnreadCount, toggleArchive,
    contacts, setGlobalSelectedContact, setActiveChat, setView, setActiveStory,
    setShowCreateChannel, setShowCreateBot, setShowAdvancedFilterModal, advancedFilters,
    t, isDark, handlePreviewCallRef.current
  ]);

  // Design read: messenger/product UI with premium consumer aesthetic, dark mode primary, orange accent.
  // Layout: sidebar navigation, central content, bottom nav for mobile.
  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      <Toaster position="top-right" duration={3000} theme={isDark ? 'dark' : 'light'} />
      <div data-theme={theme} className={`w-full h-[100dvh] flex font-sans select-none overflow-hidden relative ${isDark ? "bg-[#0d1017] text-white" : "bg-[#f0f2f5] text-slate-800"}`}>
        {isDark && (
          <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
        )}

        <div className="absolute top-2 right-2 z-50">
          <TransportIndicator status={connectionStatus} />
        </div>

<SidebarNav
           activeView={view}
           isDark={isDark}
           unreadCount={chatsUnread}
           companyUnreadCount={companyUnread}
           onNavigate={handleNavigate}
           t={t}
         />

        <div className="flex-1 flex flex-col min-w-0 pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0">
          <AnimatePresence mode="wait">
            <ContentView
              isDark={isDark}
              onCloseStory={() => setActiveStory(null)}
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
                  subView={subView}
                  setSubView={setSubView}
                  contacts={contacts}
                  setContacts={setContacts as any}
                  showContactPicker={showContactPicker}
                  setShowContactPicker={setShowContactPicker}
                  setEditingContact={setEditingContact}
                  chats={chats}
                  setChats={setChats as any}
                  setActiveChat={setActiveChat}
                  setView={setView as any}
                  onCall={handlePreviewCall}
                  onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
                  onMessage={handlePreviewMessage}
                />
              </SafeRender>
            </ContentView>
          </AnimatePresence>
        </div>

<BottomNav
           activeView={view}
           isDark={isDark}
           unreadCount={chatsUnread}
           companyUnreadCount={companyUnread}
           onNavigate={handleNavigate}
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
        />

        <AnimatePresence>
          {call && (
            <CallScreen
              call={{
                id: call.callId,
                remotePeer: { displayName: call.remotePeer.displayName || '', stream: call.remotePeer.stream },
                localStream: call.localStream,
                screenStream: call.screenStream,
                isMuted: call.isMuted,
                isVideoEnabled: call.isVideoEnabled,
                isRecording: call.isRecording,
                callType: call.callType,
                status: call.status,
              }}
              onEnd={endCall}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onToggleScreen={toggleScreenShare}
              onToggleRecord={toggleRecording}
              onChangeCallType={(newType) => {
                if (call) {
                  if (newType === call.callType) {
                    return;
                  }
                  if (newType === 'video') {
                    toggleVideo();
                  }
                  const newCall = { ...call, callType: newType, isVideoEnabled: newType === 'video', isVideo: newType === 'video' };
                  setActiveCall(newCall);
                }
              }}
            />
          )}
          {incomingCall && (
            <IncomingCallSheet
              callerName={incomingCall.displayName}
              callType={incomingCall.callType}
              onAccept={async () => {
                await acceptCall(incomingCall.peerId, incomingCall.displayName, incomingCall.callType);
                setIncomingCall(null);
              }}
              onReject={async () => {
                await endCall();
                setIncomingCall(null);
              }}
              onAcceptVideo={async () => {
                await acceptCall(incomingCall.peerId, incomingCall.displayName, 'video');
                setIncomingCall(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </ThemeContext.Provider>
  );
}
