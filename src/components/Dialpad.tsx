import React, { useEffect, useRef, useState } from "react";
import {
  Mic, MicOff, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing,
  Plus, User, UserPlus, Users, Video, Volume1, Volume2, X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ContactProfileModal, type ContactProfile } from "./ContactProfileModal";
import { useAppStore } from "../store";
import { useI18n } from "../lib/i18n";
import type { Contact } from "../types/contact";
import { toast } from "sonner";
import { MOCK_CALLS } from "../constants";
import { DialpadAddContactModal, DialpadContactPicker, DialpadCreateFolderModal } from "./call/DialpadModals";
import { SearchInput } from "./ui/SearchInput";

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

function findContactByPhone(
  contacts: Array<{ id: string; name: string; color: string; lastSeen: number; [key: string]: any }>,
  phone: string,
): Contact | null {
  if (!phone || phone.length < 3) return null;
  const normalized = phone.replace(/[\s\-\(\)]/g, "");
  const match = contacts.find((c) => {
    const cName = c.name.replace(/[\s\-\(\)]/g, "");
    return cName === normalized || cName.startsWith(normalized) || normalized.startsWith(cName);
  });
  return match || null;
}

function KeyButton({ num, letters, isDark, onPress }: {
  num: string; letters: string; isDark: boolean; onPress: (n: string) => void;
}) {
  return (
    <motion.button
      onClick={() => onPress(num)}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className={`w-[76px] h-[76px] rounded-[22px] flex flex-col items-center justify-center cursor-pointer select-none transition-colors ${
        isDark
          ? "bg-[#13151b] border border-white/[0.06] active:bg-[#1e2129] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "bg-[#eaeff4] border border-white/60 active:bg-[#dce2ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
      }`}
    >
      <span className={`text-[28px] font-semibold leading-none ${isDark ? "text-gray-200" : "text-slate-700"}`}>
        {num}
      </span>
      {letters.trim() && (
        <span className="text-[8px] mt-[2px] font-bold tracking-[0.15em] text-orange-500/70">
          {letters}
        </span>
      )}
    </motion.button>
  );
}

export const Dialpad = ({
  theme, onCall, onVideoCall, onMessage,
  contacts, showContactPicker, setShowContactPicker, setEditingContact,
}: DialpadProps) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [number, setNumber] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [callFilter, setCallFilter] = useState<"all" | "incoming" | "outgoing" | "missed">("all");
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [pendingContactName, setPendingContactName] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [addName, setAddName] = useState('');
  const [addId, setAddId] = useState('');

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

  const handleAddContact = () => {
    if (!addName.trim() || !addId.trim()) return;
    const colors = [
      "from-blue-400 to-indigo-500", "from-purple-400 to-fuchsia-500",
      "from-teal-400 to-emerald-500", "from-amber-400 to-orange-500",
      "from-rose-400 to-pink-500", "from-cyan-400 to-blue-500",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newContact = {
      id: addId.trim(), name: addName.trim(), color: randomColor,
      lastSeen: Date.now(), isFavorite: false,
    };
    setContacts((prev: any[]) => [newContact, ...prev]);
    setAddName(''); setAddId(''); setPendingContactName(null);
    setShowAddContact(false);
    toast.success(t('toast.contactAdded'), { description: addName.trim() });
  };

  const handleQuickAddContact = (name: string) => {
    setPendingContactName(name); setAddName(name); setAddId('');
    setShowAddContact(true);
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
        localStream: null, screenStream: null, isMuted: false, isSpeaker: false,
        isVideoEnabled: false, isVideo: false, isRecording: false,
        startTime: Date.now(), participants: [],
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
    { num: "1", letters: " " }, { num: "2", letters: "ABC" }, { num: "3", letters: "DEF" },
    { num: "4", letters: "GHI" }, { num: "5", letters: "JKL" }, { num: "6", letters: "MNO" },
    { num: "7", letters: "PQRS" }, { num: "8", letters: "TUV" }, { num: "9", letters: "WXYZ" },
    { num: "*", letters: " " }, { num: "0", letters: "+" }, { num: "#", letters: " " },
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
    setNewFolderName(''); setShowCreateFolder(false);
  };

  const deleteFolder = (id: string) => {
    removeCallFolder(id);
    if (activeFolder === id) setActiveFolder('all');
  };

  return (
    <div className={`p-4 md:p-6 flex flex-col shadow-2xl relative overflow-y-auto w-full h-full ${
      isDark ? "bg-[#1a1d24]" : "bg-[#eaeff4]"
    }`}>
      <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${
        isDark ? "bg-orange-500/8" : "bg-orange-400/15"
      }`} />

      <AnimatePresence mode="wait">
        {isCalling ? (
          <motion.div
            key="active-call"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center flex-1 w-full relative z-10 gap-8"
          >
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner ${
                isDark ? "bg-[#13151b] text-white" : "bg-[#e2e8f0] text-slate-700"
              }`}>
                <User size={48} className={isDark ? "text-gray-500" : "text-slate-400"} />
              </div>
              {isVideoCall && (
                <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isDark ? "bg-orange-500 border-[#13151b] text-white" : "bg-orange-500 border-[#e2e8f0] text-white"
                }`}>
                  <Video size={16} />
                </div>
              )}
            </motion.div>

            <div className="flex flex-col items-center gap-2">
              <span className={`text-[24px] font-bold tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}>
                {number.length > 0 ? number : t('chat.unknownCaller')}
              </span>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`text-[15px] font-mono font-medium tracking-widest ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              >
                {formatDuration(callDuration)}
              </motion.span>
            </div>

            <div className="flex gap-6 mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => activeCall && setActiveCall({ ...activeCall, isMuted: !isMuted })}
                title={isMuted ? t('chat.unmuteMicrophone') : t('chat.muteMicrophone')}
                className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
                  isMuted
                    ? isDark
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      : "bg-slate-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                    : isDark
                      ? "bg-[#13151b] text-gray-400 hover:bg-white/10 border border-white/5"
                      : "bg-[#f8fafc] text-slate-500 hover:bg-white border border-black/5"
                }`}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => activeCall && setActiveCall({ ...activeCall, isSpeaker: !isSpeaker })}
                title={isSpeaker ? t('chat.disableSpeaker') : t('chat.enableSpeaker')}
                className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
                  isSpeaker
                    ? isDark
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      : "bg-slate-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                    : isDark
                      ? "bg-[#13151b] text-gray-400 hover:bg-white/10 border border-white/5"
                      : "bg-[#f8fafc] text-slate-500 hover:bg-white border border-black/5"
                }`}
              >
                {isSpeaker ? <Volume2 size={18} /> : <Volume1 size={18} />}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle-dialpad"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 min-h-0 relative z-10"
          >
            <div className="flex items-center justify-center mb-3">
              <SearchInput
                id="dialer-number-input"
                value={number}
                onChange={setNumber}
                placeholder={t('chat.searchOrDial') || "Dial a number..."}
                isDark={isDark}
                shape="pill"
                maxLength={14}
                rightElement={number.length > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowContactPicker(true); }}
                    className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                      isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-black/10"
                    }`}
                    title={t('contacts.selectFromContacts')}
                  >
                    <Users size={18} />
                  </button>
                ) : undefined}
              />
            </div>

            <div className="flex items-center justify-between px-2 mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                {t('chat.recent')}
              </span>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
                {[
                  { id: "all", label: t('chat.all') },
                  { id: "incoming", label: t('chat.incomingShort') },
                  { id: "outgoing", label: t('chat.outgoingShort') },
                  { id: "missed", label: t('chat.missed') },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => { setCallFilter(tab.id as any); setActiveFolder('all'); }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 ${
                      callFilter === tab.id && activeFolder === 'all'
                        ? isDark ? "bg-white/10 text-white" : "bg-black/10 text-slate-800"
                        : isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 shrink-0">
              <motion.button
                onClick={() => setActiveFolder('all')}
                whileTap={{ scale: 0.95 }}
                className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap ${
                  activeFolder === 'all'
                    ? (isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600")
                    : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")
                }`}
              >
                {t('chat.all')}
              </motion.button>
              <motion.button
                onClick={() => setActiveFolder('missed')}
                whileTap={{ scale: 0.95 }}
                className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap ${
                  activeFolder === 'missed'
                    ? (isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600")
                    : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")
                }`}
              >
                {t('chat.missed')}
              </motion.button>
              {callFolders.map(folder => (
                <div key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1 group`}
                >
                  <span className={activeFolder === folder.id ? (isDark ? "text-orange-400" : "text-orange-600") : ""}>{folder.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
              <motion.button
                onClick={() => setShowCreateFolder(true)}
                whileTap={{ scale: 0.95 }}
                className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1 ${
                  isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Plus size={10} /> {t('chat.newFolder')}
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
              {folderCalls.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-full py-8 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                    <Phone className="w-5 h-5 opacity-40" />
                  </div>
                  <p className="text-sm">{t('chat.noCalls')}</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {folderCalls.map((call) => (
                    <motion.div
                      key={call.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      onClick={() => {
                        setSelectedContact({
                          id: `hash_${call.id}`,
                          name: call.name,
                          color: call.name === "Unknown" ? "from-gray-500 to-gray-600" : "from-blue-400 to-indigo-500",
                          callInfo: { time: call.time, type: call.type as any, duration: "10:32" },
                        });
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all group ${
                        isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-slate-700"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
                        call.type === "missed"
                          ? isDark ? "bg-red-500/10 text-red-400" : "bg-red-500/10 text-red-600"
                          : isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"
                      }`}>
                        {call.type === "incoming" && <PhoneIncoming size={16} />}
                        {call.type === "outgoing" && <PhoneOutgoing size={16} />}
                        {call.type === "missed" && <PhoneMissed size={16} />}
                      </div>
                      <div className="flex-1 flex flex-col min-w-0 pr-2">
                        <span className={`text-[14px] font-bold truncate leading-snug ${
                          call.type === "missed"
                            ? (isDark ? "text-red-400" : "text-red-600")
                            : isDark ? "text-white" : "text-slate-800"
                        }`}>
                          {call.name}
                        </span>
                        <div className="flex gap-2 items-center mt-0.5">
                          <span className={`text-[11px] font-semibold tracking-wide ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                            {call.time}
                          </span>
                          {call.duration && (
                            <span className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                              • {call.duration}
                            </span>
                          )}
                        </div>
                      </div>
                      {(call.name.startsWith("+") || call.name === "Unknown") && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); handleQuickAddContact(call.name); }}
                          className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                            isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-700"
                          }`}
                          title={t('contacts.addContact')}
                        >
                          <UserPlus size={14} />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="grid w-full justify-items-center pt-3 gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {keys.map((k) => (
                <KeyButton key={k.num} num={k.num} letters={k.letters} isDark={isDark} onPress={handlePress} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex items-center justify-center gap-6 w-[240px] mt-3 relative z-10 sticky bottom-0 pb-2 pt-2 mx-auto ${
        isDark ? 'bg-[#1a1d24]' : 'bg-[#eaeff4]'
      }`}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { if (number.length > 0) handleQuickAddContact(number); }}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
            number.length > 0
              ? (isDark ? "opacity-60 hover:opacity-100 text-gray-400 hover:text-white" : "opacity-60 hover:opacity-100 text-slate-500 hover:text-slate-700")
              : "opacity-0 pointer-events-none"
          } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
          title={t('contacts.addContact')}
        >
          <UserPlus size={20} />
        </motion.button>

        <motion.button
          onClick={handleCallToggle}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          title={isCalling ? t('chat.endCall') : t('chat.startCall')}
          className={`w-[76px] h-[76px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl ${
            isCalling
              ? "bg-gradient-to-br from-red-500 to-red-700 shadow-[0_12px_24px_rgba(239,68,68,0.3)]"
              : isDark
                ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_12px_24px_rgba(249,115,22,0.3)]"
                : "bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_12px_24px_rgba(249,115,22,0.3)]"
          }`}
        >
          <Phone className={`text-white drop-shadow-sm fill-white/20 transition-transform ${
            isCalling ? "rotate-[135deg]" : ""
          }`} size={28} strokeWidth={2} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 opacity-60 hover:opacity-100 ${
            isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-700"
          } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
        >
          {number.length > 0 && !isCalling ? (
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
            </svg>
          ) : null}
        </motion.button>
      </div>

      <ContactProfileModal
        contact={selectedContact} theme={theme}
        onClose={() => setSelectedContact(null)}
        onCall={() => { if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color); setSelectedContact(null); }}
        onVideoCall={() => { if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color); setSelectedContact(null); }}
        onMessage={() => { if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color); setSelectedContact(null); }}
        onDelete={() => { toast.info(t('toast.contact'), { description: t('chat.deletedCallHistory', { name: selectedContact?.name || "" }) }); setSelectedContact(null); }}
        onEdit={() => { if (selectedContact) setEditingContact(selectedContact as unknown as Contact); setSelectedContact(null); }}
        onBlock={() => { toast.warning(t('toast.contact'), { description: t('chat.blockedContact', { name: selectedContact?.name || "" }) }); setSelectedContact(null); }}
        onToggleFavorite={(id) => { setContacts((prev: any[]) => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)); }}
      />

      <DialpadAddContactModal theme={theme} showAddContact={showAddContact}
        onCloseAddContact={() => { setShowAddContact(false); setPendingContactName(null); }}
        addName={addName} onAddNameChange={setAddName}
        addId={addId} onAddIdChange={setAddId}
        onSaveContact={handleAddContact} canSaveContact={!!addName.trim() && !!addId.trim()} />

      <DialpadContactPicker theme={theme} showContactPicker={showContactPicker}
        onCloseContactPicker={() => setShowContactPicker(false)}
        contacts={contacts} onSelectContact={(name) => { setNumber(name); setShowContactPicker(false); }} />

      <DialpadCreateFolderModal theme={theme} showCreateFolder={showCreateFolder}
        onCloseCreateFolder={() => { setShowCreateFolder(false); setNewFolderName(''); }}
        newFolderName={newFolderName} onNewFolderNameChange={setNewFolderName}
        onCreateFolder={createFolder} canCreateFolder={!!newFolderName.trim()}
        callFolders={callFolders} onDeleteFolder={deleteFolder} />
    </div>
  );
};
