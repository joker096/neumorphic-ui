import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCheck,
  ChevronDown,
  Mic,
  MicOff,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Plus,
  Search,
  User,
  UserPlus,
  Users,
  Video,
  Volume1,
  Volume2,
  X,
  Folder,
  Trash2,
  FolderOpen,
  MoreVertical,
} from "lucide-react";
import { ContactProfileModal, type ContactProfile } from "../contacts/ContactProfileModal";
import { useAppStore } from "../../store";
import { useI18n } from "../../lib/i18n";
import type { Contact } from "../../types/contact";
import { toast } from "sonner";
import { MOCK_CALLS } from "../../constants";

interface DialpadProps {
  theme: "light" | "dark";
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  contacts: Contact[];
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
  setEditingContact: (contact: Contact | null) => void;
}

/**
 * Custom SVG Icon to precisely match the "Eucive" double-chevron diamond.
 */


export const LightSearchBar = ({ searchQuery, onSearchChange, placeholder }: { searchQuery?: string, onSearchChange?: (val: string) => void, placeholder?: string }) => {
  const [internalVal, setInternalVal] = useState("");
  const val = searchQuery !== undefined ? searchQuery : internalVal;
  const setVal = onSearchChange || setInternalVal;
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div className="relative group w-full">
      <div
        className={`relative w-full h-[44px] rounded-full px-6 py-0 flex items-center justify-between border transition-all duration-300 
        ${
          pressed
            ? "bg-[var(--bg-tertiary)] shadow-[inset_3px_3px_8px_rgba(165,175,190,0.4),_inset_-1px_-1px_4px_rgba(255,255,255,1)] border-black/5 scale-[0.98]"
            : focused
              ? "bg-[var(--bg-primary)] border-orange-300/60 scale-[1.01] shadow-[-4px_-4px_8px_rgba(255,255,255,1),_6px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_3px_rgba(165,175,190,0.1)]"
              : "bg-[var(--bg-primary)] shadow-[-8px_-8px_16px_rgba(255,255,255,0.9),_12px_16px_28px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,1)] border-white/80 hover:scale-[1.005]"
        }`}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        <input
          role="searchbox"
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "Search chats or messages..."}
          className="bg-transparent border-none outline-none w-full text-[14px] font-medium text-[var(--dialpad-text)] placeholder:text-[var(--dialpad-placeholder)] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
        />
        <div className={`ml-3 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${focused ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 active:scale-90" : "text-[var(--dialpad-text)] hover:bg-gray-200/50"}`}>
          <Search size={18} strokeWidth={1.75} className="drop-shadow-[0_1px_1px_rgba(255,255,255,1)]" />
        </div>
      </div>
    </div>
  );
};

export const DarkSearchBar = ({ searchQuery, onSearchChange, placeholder }: { searchQuery?: string, onSearchChange?: (val: string) => void, placeholder?: string }) => {
  const [internalVal, setInternalVal] = useState("");
  const val = searchQuery !== undefined ? searchQuery : internalVal;
  const setVal = onSearchChange || setInternalVal;
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div className="relative group w-full">
      <div
        className={`relative w-full h-[44px] rounded-full px-6 py-0 flex items-center justify-between border transition-all duration-300 
         ${
           pressed
              ? "bg-[var(--bg-primary)] shadow-[inset_0_8px_16px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(0,0,0,0.9)] border-orange-500/20 scale-[0.98]"
             : focused
               ? "bg-[var(--bg-secondary)] border-orange-500/40 scale-[1.01] shadow-[0_8px_16px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(249,115,22,0.1),_inset_0_-1px_2px_rgba(0,0,0,0.9)]"
               : "bg-[var(--bg-secondary)] shadow-[0_10px_18px_rgba(0,0,0,0.4),_0_4px_8px_rgba(0,0,0,0.3),_inset_0_1px_1px_rgba(255,255,255,0.08),_inset_0_-1px_2px_rgba(0,0,0,0.8)] border-white/[0.04]"
         }`}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        <input
          role="searchbox"
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "Search messages, people..."}
          className="bg-transparent border-none outline-none w-full text-[14px] font-medium text-[var(--dialpad-text-dark)] placeholder:text-[var(--dialpad-placeholder-dark)]"
        />
        <div className={`ml-3 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${focused ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 active:scale-90" : "text-[var(--dialpad-text-dark)] hover:bg-white/5"}`}>
          <Search size={18} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
};

export const Dialpad = ({ 
  theme, 
  onCall, 
  onVideoCall, 
  onMessage, 
  contacts,
  showContactPicker,
  setShowContactPicker,
  setEditingContact
}: { 
  theme: "light" | "dark", 
  onCall?: (n: string, color?: string) => void, 
  onVideoCall?: (n: string, color?: string) => void,
  onMessage?: (n: string, color?: string) => void,
  contacts: Array<{ name: string; id: string; color: string; lastSeen: number }>,
  showContactPicker: boolean,
  setShowContactPicker: (show: boolean) => void,
  setEditingContact: (contact: Contact | null) => void
}) => {
  const { t } = useI18n();
  const [number, setNumber] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [callFilter, setCallFilter] = useState<
    "all" | "incoming" | "outgoing" | "missed"
  >("all");
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { activeCall, setActiveCall, setContacts, callFolders, addCallFolder, removeCallFolder } = useAppStore();
  const isCalling = !!activeCall;
  const isVideoCall = activeCall?.isVideo || false;
  const isMuted = activeCall?.isMuted || false;
  const isSpeaker = activeCall?.isSpeaker || false;
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: number;
    if (activeCall) {
      interval = window.setInterval(() => {
        setCallDuration(Math.floor((Date.now() - activeCall.startTime) / 1000));
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handlePress = (num: string) => {
    if (number.length < 14) setNumber((prev) => prev + num);
  };

  const handleDelete = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCallToggle = () => {
    if (isCalling) {
       setActiveCall(null);
    } else {
       const mockCall = {
         callId: `preview_${Date.now()}`,
         direction: 'outgoing' as const,
         status: 'connecting' as const,
         callType: 'audio' as const,
          remotePeer: { peerId: 'manual', displayName: number || t('chat.unknownCaller') },
         localStream: null,
         screenStream: null,
         isMuted: false,
         isSpeaker: false,
         isVideoEnabled: false,
         isVideo: false,
         isRecording: false,
         startTime: Date.now(),
         participants: [],
       };
       setActiveCall(mockCall);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const keys = [
    { num: "1", letters: " " },
    { num: "2", letters: "ABC" },
    { num: "3", letters: "DEF" },
    { num: "4", letters: "GHI" },
    { num: "5", letters: "JKL" },
    { num: "6", letters: "MNO" },
    { num: "7", letters: "PQRS" },
    { num: "8", letters: "TUV" },
    { num: "9", letters: "WXYZ" },
    { num: "*", letters: " " },
    { num: "0", letters: "+" },
    { num: "#", letters: " " },
  ];

  const filteredCalls = MOCK_CALLS.filter(
    (call) => callFilter === "all" || call.type === callFilter,
  );

  const folderCalls = activeFolder === 'all'
    ? filteredCalls
    : activeFolder === 'missed'
      ? MOCK_CALLS.filter((call) => call.type === 'missed')
      : activeFolder === 'incoming'
        ? MOCK_CALLS.filter((call) => call.type === 'incoming')
        : activeFolder === 'outgoing'
          ? MOCK_CALLS.filter((call) => call.type === 'outgoing')
          : filteredCalls;

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    addCallFolder({ name: newFolderName.trim() });
    setNewFolderName('');
    setShowCreateFolder(false);
  };

  const deleteFolder = (id: string) => {
    removeCallFolder(id);
    if (activeFolder === id) setActiveFolder('all');
  };

  return (
    <div
      className={`p-4 sm:p-8 flex flex-col items-center shadow-2xl relative overflow-hidden flex-1 w-full bg-[var(--bg-primary)] border border-white/10`}
    >
      {/* Background radial soft light */}
      <div
        className={`absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 bg-orange-500/10`}
      />

      {isCalling ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full relative z-10 animate-fade-in gap-8">
          <div className="relative">
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner bg-[var(--bg-secondary)] text-white`}
            >
              <User
                size={48}
                className="text-gray-500"
              />
            </div>
            {isVideoCall && (
              <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-orange-500 border-[var(--bg-secondary)] text-white`}>
                <Video size={16} />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <span
              className={`text-[24px] font-bold tracking-tight text-white`}
            >
              {number.length > 0 ? number : t('chat.unknownCaller')}
            </span>
            <span
              className={`text-[15px] font-mono font-medium tracking-widest text-emerald-400`}
            >
              {formatDuration(callDuration)}
            </span>
          </div>

          <div className="flex gap-6 mt-4">
            <div
              onClick={() => activeCall && setActiveCall({ ...activeCall, isMuted: !isMuted })}
              title={isMuted ? t('chat.unmuteMicrophone') : t('chat.muteMicrophone')}
              className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-md ${
                isMuted
                  ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  : "bg-[var(--bg-secondary)] text-gray-400 hover:bg-white/10 border border-white/5"
              }`}
            >
              {isMuted ? (
                <MicOff size={22} className="text-current" />
              ) : (
                <Mic size={22} className="text-current" />
              )}
            </div>
            <div
              onClick={() => activeCall && setActiveCall({ ...activeCall, isSpeaker: !isSpeaker })}
              title={isSpeaker ? t('chat.disableSpeaker') : t('chat.enableSpeaker')}
              className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-md ${
                isSpeaker
                  ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  : "bg-[var(--bg-secondary)] text-gray-400 hover:bg-white/10 border border-white/5"
              }`}
            >
{isSpeaker ? (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    <Volume2 size={18} className="text-current" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    <Volume1 size={18} className="text-current" />
                  </div>
                )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full h-12 mb-6 flex items-center justify-center z-10 transition-colors">
            <Search
              size={18}
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-gray-500`}
            />
            <input
              role="textbox"
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder={t('chat.searchOrDial')}
              className={`w-full h-full bg-transparent border-none outline-none text-center px-10 pr-[60px] text-[20px] font-medium tracking-[0.05em] transition-colors placeholder:text-[14px] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] placeholder:text-gray-600`}
            />
            <button
              onClick={() => setShowContactPicker(true)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white`}
              title={t('chat.selectContact')}
            >
              <Users size={18} />
            </button>
          </div>

          {number.length === 0 ? (
            <div className="w-full relative z-10 h-[480px] flex flex-col">
              <div className="flex items-center justify-between px-2 mb-4">
                <div
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500`}
                >
                  {t('chat.recent')}
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
                  {[
                    { id: "all", label: t('chat.all') },
                    { id: "incoming", label: t('chat.incomingShort') },
                    { id: "outgoing", label: t('chat.outgoingShort') },
                    { id: "missed", label: t('chat.missed') },
                  ].map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => { setCallFilter(tab.id as any); setActiveFolder('all'); }}
                      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2 py-1 rounded-md shrink-0 bg-white/10 text-white`}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Folder tabs */}
              <div className={`flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0 ${number.length === 0 ? '' : 'hidden'}`}>
                <div
                  onClick={() => setActiveFolder('all')}
                  className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2 py-1 rounded-md shrink-0 whitespace-nowrap bg-orange-500/20 text-orange-400`}
                >
                  {t('chat.all')}
                </div>
                <div
                  onClick={() => setActiveFolder('missed')}
                  className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2 py-1 rounded-md shrink-0 whitespace-nowrap bg-red-500/20 text-red-400`}
                >
                  {t('chat.missed')}
                </div>
                {callFolders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2 py-1 rounded-md shrink-0 whitespace-nowrap flex items-center gap-1 group`}
                  >
                    <span className="text-orange-400">{folder.name}</span>
                    <div
                      onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3 cursor-pointer"
                    >
                      <X size={10} />
                    </div>
                  </div>
                ))}
                <div
                  onClick={() => setShowCreateFolder(true)}
                  className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2 py-1 rounded-md shrink-0 whitespace-nowrap flex items-center gap-1 text-gray-500 hover:text-gray-300`}
                >
                  <Plus size={10} />
                  {t('chat.newFolder')}
                </div>
              </div>
              <div
                className="flex flex-col gap-1.5 flex-1 overflow-y-auto"
              >
                {folderCalls.length === 0 ? (
                  <div className={`text-center py-8 text-gray-500`}>
                    <p className="text-sm">{t('chat.noCalls')}</p>
                  </div>
                ) : (
                  folderCalls.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => {
                        setSelectedContact({
                           id: `hash_${call.id}`, 
                           name: call.name, 
                           color: call.name === "Unknown" ? "from-gray-500 to-gray-600" : "from-blue-400 to-indigo-500",
                           callInfo: {
                               time: call.time,
                               type: call.type as any,
                               duration: "10:32"
                           }
                        });
                    }}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors group hover:bg-white/5 text-gray-300`}
                  >
                    <div
                      className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 bg-red-500/10 text-red-400`}
                    >
                      {call.type === "missed" && <PhoneMissed size={16} />}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 pr-2">
                      <span
                        className={`text-[14px] font-bold truncate leading-snug text-red-400`}
                      >
                        {call.name}
                      </span>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`text-[11px] font-semibold tracking-wide text-orange-400`}
                        >
                          {call.time}
                        </span>
                        {call.duration && (
                          <span
                            className={`text-[10px] font-medium text-gray-500`}
                          >
                            • {call.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* If name indicates it's an UNKNOWN or phone number, show Add to Contacts option */}
                    {(call.name.startsWith("+") || call.name === "Unknown") && (
                       <div 
                          className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 bg-white/10 hover:bg-white/20 text-white`}
                         onClick={(e) => {
                             e.stopPropagation();
                              toast.info(t('toast.contact'), { description: t('chat.creatingContact', { name: call.name }) });
                         }}
                        title={t('contacts.addContact')}
                      >
                         <UserPlus size={14} />
                      </div>
                    )}
                  </div>
                ))
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 relative z-10 w-full justify-items-center h-[360px]">
              {keys.map((k) => (
                <div
                  key={k.num}
                  onClick={() => handlePress(k.num)}
                  className={`w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.05] active:scale-[0.92] select-none bg-[var(--bg-secondary)] shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04] active:shadow-[inset_0_10px_20px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(0,0,0,0.9)]`}
                >
                  <span
                    className={`text-[26px] font-semibold leading-none transition-colors duration-200 text-gray-200 group-hover:text-white`}
                  >
                    {k.num}
                  </span>
                  {k.letters.trim() && (
                    <span
                      className={`text-[9px] mt-[3px] font-bold tracking-widest transition-colors duration-200 text-orange-500/70 group-hover:text-orange-400`}
                    >
                      {k.letters}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div
        className={`flex items-center justify-between w-[240px] mt-auto relative z-10`}
      >
        <div
           onClick={() => {
             if (number.length > 0) toast.success(t('toast.contactAdded'), { description: t('chat.contactAddedDescription', { number }) });
           }}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90 opacity-80 hover:opacity-100 text-gray-400 hover:text-white`}
          title={t('contacts.addContact')}
        >
          <UserPlus size={22} className="text-current" />
        </div>
        {/* Spacer for centering the call button visually */}
        <div
          onClick={handleCallToggle}
          title={isCalling ? t('chat.endCall') : t('chat.startCall')}
          className={`w-[76px] h-[76px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.08] active:scale-95 hover:rotate-3 shadow-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_12px_24px_rgba(249,115,22,0.3),_inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[inset_0_8px_16px_rgba(0,0,0,0.4)]`}
        >
          <Phone
            className={`text-white drop-shadow-sm fill-white/20 transition-transform ${isCalling ? "rotate-[135deg]" : ""}`}
            size={28}
            strokeWidth={2}
          />
        </div>
        <div
          onClick={handleDelete}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90 text-gray-400 hover:text-white`}
        >
          {number.length > 0 && !isCalling ? (
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
            </svg>
          ) : null}
        </div>
      </div>
      
        <ContactProfileModal
           contact={selectedContact}
           theme={theme}
           onClose={() => setSelectedContact(null)}
           onCall={() => {
               if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onVideoCall={() => {
               if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onMessage={() => {
               if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onDelete={() => {
                toast.info(t('toast.contact'), { description: t('chat.deletedCallHistory', { name: selectedContact?.name || "" }) });
                setSelectedContact(null);
            }}
           onEdit={() => {
                  if (selectedContact) {
                   setEditingContact(selectedContact as unknown as Contact);
                 }
                setSelectedContact(null);
            }}
           onBlock={() => {
                  toast.warning(t('toast.contact'), { description: t('chat.blockedContact', { name: selectedContact?.name || "" }) });
                 setSelectedContact(null);
            }}
           onToggleFavorite={(id) => {
             setContacts(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
           }}
        />
       
       {/* Contact Picker Modal */}
       {showContactPicker && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         >
           <motion.div 
             initial={{ scale: 0.95, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
           exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`w-full max-w-[340px] rounded-md p-6 shadow-2xl relative bg-[var(--bg-primary)] border border-white/10`}
            >
              <div 
                className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors bg-white/10 hover:bg-white/20 text-white`}
                onClick={() => setShowContactPicker(false)}
             >
               <X size={18} />
             </div>

             <div className="flex flex-col items-center mb-4 mt-4">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-500/20 text-orange-400`}>
                 <Users size={32} />
               </div>
               <h3 className={`text-xl font-bold text-white`}>{t('chat.selectContact')}</h3>
               <p className={`text-xs text-center mt-2 text-gray-400`}>{t('chat.chooseContact')}</p>
             </div>

             <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
               {contacts.map((c) => (
                 <div
                   key={c.id}
                   onClick={() => {
                     setNumber(c.name);
                     setShowContactPicker(false);
                   }}
                   className={`flex items-center gap-4 p-3 rounded-md cursor-pointer transition-colors hover:bg-white/5`}
                 >
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${c.color} text-white font-bold text-lg shadow-md shrink-0`}>
                     {(c.name || 'U').charAt(0)}
                   </div>
                   <div className="flex-1 flex flex-col min-w-0">
                     <span className={`font-bold truncate text-gray-100`}>{c.name}</span>
                     <span className={`font-mono text-[9px] tracking-wider truncate text-gray-500`}>{c.id}</span>
                   </div>
                   <Phone className={`w-5 h-5 shrink-0 text-orange-400`} />
                 </div>
               ))}
               {contacts.length === 0 && (
                 <div className={`text-center py-8 text-gray-500`}>
                   {t('chat.noContactsAvailable')} {t('chat.addContactsHint')}
                 </div>
               )}
             </div>
           </motion.div>
         </motion.div>
       )}

       {/* Create Folder Modal */}
       {showCreateFolder && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         >
           <motion.div
             initial={{ scale: 0.95, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`w-full max-w-[340px] rounded-md p-6 shadow-2xl relative bg-[var(--bg-primary)] border border-white/10`}
            >
              <div className="flex flex-col items-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-500/20 text-orange-400`}>
                  <Folder size={32} />
               </div>
               <h3 className={`text-xl font-bold text-white`}>{t('chat.createFolder')}</h3>
               <p className={`text-xs text-center mt-2 text-gray-400`}>{t('chat.folderNameHint')}</p>
             </div>

             <input
               type="text"
               value={newFolderName}
               onChange={(e) => setNewFolderName(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && createFolder()}
               placeholder={t('chat.folderPlaceholder')}
               className={`w-full px-4 py-3 rounded-md border outline-none text-center text-lg bg-[var(--bg-secondary)] border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50`}
               autoFocus
             />

             <div className="flex gap-3 mt-6">
               <button
                 onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                 className={`flex-1 py-3 rounded-md font-bold transition-colors bg-[var(--bg-secondary)] text-gray-300 hover:bg-white/10`}
               >
                 {t('chat.cancel')}
               </button>
               <button
                 onClick={createFolder}
                 className={`flex-1 py-3 rounded-md font-bold transition-transform hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg`}
               >
                 {t('chat.create')}
               </button>
             </div>

             {/* Existing custom folders */}
             {callFolders.length > 0 && (
               <div className="mt-6">
                 <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-gray-400`}>{t('chat.yourFolders')}</div>
                 <div className="flex flex-col gap-2">
                   {callFolders.map(folder => (
                     <div key={folder.id} className={`flex items-center gap-3 p-2.5 rounded-md bg-white/5`}>
                       <Folder size={14} className="text-gray-400" />
                       <span className={`flex-1 text-sm font-medium text-gray-200`}>{folder.name}</span>
                       <button
                         onClick={() => deleteFolder(folder.id)}
                         className={`w-6 h-6 rounded-full flex items-center justify-center text-red-400 hover:bg-white/10`}
                       >
                         <X size={12} />
                       </button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </motion.div>
         </motion.div>
       )}
     </div>
   );
 };

 
