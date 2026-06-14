import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  Mic,
  MicOff,
  Users,
  User,
  UserPlus,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Volume1,
  Volume2,
} from "lucide-react";
import { useAppStore } from "../store";
import { MOCK_CALLS } from "../constants";
import { toast } from "sonner";
import { ContactProfileModal, ContactProfile } from "./ContactProfileModal";
import { ContactCreateEditModal } from "./ContactCreateEditModal";
import type { Contact, ContactField } from "../types/contact";
import { useI18n } from "../lib/i18n";

export const Dialpad = ({
  theme,
  onCall,
  onMessage,
  contacts,
  setContacts,
  showContactPicker,
  setShowContactPicker,
}: {
  theme: "light" | "dark";
  onCall?: (n: string, color?: string) => void;
  onMessage?: (n: string, color?: string) => void;
  contacts: Array<{ name: string; id: string; color: string; lastSeen: number; isFavorite?: boolean; localFields?: Array<{ id: string; type: string; label: string; value: string; phoneSubtype?: string }> }>;
  setContacts?: React.Dispatch<React.SetStateAction<Array<{ name: string; id: string; color: string; lastSeen: number; isFavorite?: boolean; localFields?: Array<{ id: string; type: string; label: string; value: string; phoneSubtype?: string }> }>>>;
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
}) => {
  const { t } = useI18n();
  const isDark = theme === "dark";
  const [number, setNumber] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [callFilter, setCallFilter] = useState<
    "all" | "incoming" | "outgoing" | "missed"
  >("all");

  const { activeCall, setActiveCall } = useAppStore();
  const isCalling = !!activeCall;
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

  const handleSaveContact = (name: string, id: string, color: string | undefined, localFields: ContactField[]) => {
    if (!setContacts) return;
    if (editingContact) {
      const existing = contacts.find(c => c.id === editingContact.id);
      if (existing) {
        setContacts(contacts.map(c => c.id === editingContact.id ? { ...c, name, id, color: color || c.color, localFields } : c));
      } else {
        const colors = ["from-teal-400 to-emerald-500", "from-pink-400 to-rose-500", "from-yellow-400 to-orange-500"];
        const newColor = colors[contacts.length % colors.length];
        setContacts([{ name, id, color: newColor, lastSeen: Date.now(), localFields }, ...contacts]);
      }
    }
    setShowEditForm(false);
    setEditingContact(null);
  };

  const handleCallToggle = () => {
    if (isCalling) {
      setActiveCall(null);
    } else {
      setActiveCall({
        number: number || "Unknown",
        startTime: Date.now(),
        isMuted: false,
        isSpeaker: false,
      });
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

  return (
    <div
      className={`p-8 rounded-[48px] flex flex-col items-center shadow-2xl relative overflow-hidden h-[540px] w-full ${
        isDark
          ? "bg-[#1a1d24] border border-white/10"
          : "bg-[#eaeff4] border border-white/60"
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 ${isDark ? "bg-orange-500/10" : "bg-orange-400/20"}`}
      />

      {isCalling ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full relative z-10 animate-fade-in gap-8">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner ${isDark ? "bg-[#13151b] text-white" : "bg-[#e2e8f0] text-slate-700"}`}
          >
            <User
              size={48}
              className={isDark ? "text-gray-500" : "text-slate-400"}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span
              className={`text-[24px] font-bold tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}
            >
              {number.length > 0 ? number : t('calls.unknownCaller')}
            </span>
            <span
              className={`text-[15px] font-mono font-medium tracking-widest ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
            >
              {formatDuration(callDuration)}
            </span>
          </div>

          <div className="flex gap-6 mt-4">
            <div
              onClick={() => activeCall && setActiveCall({ ...activeCall, isMuted: !isMuted })}
              title={isMuted ? t('calls.unmuteMicrophone') : t('calls.muteMicrophone')}
              className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:[transform:scale(1.05)_translateZ(15px)] active:[transform:scale(0.95)_translateZ(0px)] shadow-md ${
                isMuted
                  ? isDark
                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    : "bg-slate-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                  : isDark
                    ? "bg-[#13151b] text-gray-400 hover:bg-white/10 border border-white/5"
                    : "bg-[#f8fafc] text-slate-500 hover:bg-white border border-black/5"
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
              title={isSpeaker ? t('calls.disableSpeaker') : t('calls.enableSpeaker')}
              className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:[transform:scale(1.05)_translateZ(15px)] active:[transform:scale(0.95)_translateZ(0px)] shadow-md ${
                isSpeaker
                  ? isDark
                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    : "bg-slate-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                  : isDark
                    ? "bg-[#13151b] text-gray-400 hover:bg-white/10 border border-white/5"
                    : "bg-[#f8fafc] text-slate-500 hover:bg-white border border-black/5"
              }`}
            >
              {isSpeaker ? (
                <Volume2 size={22} className="text-current" />
              ) : (
                <Volume1 size={22} className="text-current" />
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full h-12 mb-6 flex items-center justify-center z-10 transition-colors">
            <Search
              size={18}
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-gray-500" : "text-slate-400"}`}
            />
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder={t('calls.searchDial')}
              className={`w-full h-full bg-transparent border-none outline-none text-center px-10 pr-[60px] text-[20px] font-medium tracking-[0.05em] transition-colors placeholder:text-[14px] ${
                isDark
                  ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] placeholder:text-gray-600"
                  : "text-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] placeholder:text-slate-400"
              }`}
            />
            <button
              onClick={() => setShowContactPicker(true)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" : "bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-800"}`}
              title={t('calls.selectContact')}
            >
              <Users size={18} />
            </button>
          </div>

          {number.length === 0 ? (
            <div className="w-full relative z-10 h-[360px] flex flex-col">
              <div className="flex items-center justify-between px-2 mb-4">
                <div
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-gray-500" : "text-slate-400"}`}
                >
                  {t('calls.recent')}
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
                  {[
                    { id: "all", label: t('calls.all') },
                    { id: "incoming", label: t('calls.incoming') },
                    { id: "outgoing", label: t('calls.outgoing') },
                    { id: "missed", label: t('calls.missed') },
                  ].map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setCallFilter(tab.id as any)}
                      className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2 py-1 rounded-md shrink-0 ${
                        callFilter === tab.id
                          ? isDark
                            ? "bg-white/10 text-white"
                            : "bg-black/10 text-slate-800"
                          : isDark
                            ? "text-gray-500 hover:text-gray-300"
                            : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>
              </div>
              <div
                className={`flex flex-col gap-1.5 flex-1 overflow-y-auto ${isDark ? "scrollbar-ios" : "scrollbar-ios"}`}
              >
                {filteredCalls.map((call) => (
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
                          duration: "10:32",
                        },
                      });
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors group ${isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-black/5 text-slate-700"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
                        call.type === "missed"
                          ? isDark
                            ? "bg-red-500/10 text-red-400"
                            : "bg-red-500/10 text-red-600"
                          : isDark
                            ? "bg-white/5 text-gray-400"
                            : "bg-black/5 text-slate-500"
                      }`}
                    >
                      {call.type === "incoming" && <PhoneIncoming size={16} />}
                      {call.type === "outgoing" && <PhoneOutgoing size={16} />}
                      {call.type === "missed" && <PhoneMissed size={16} />}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 pr-2">
                      <span
                        className={`text-[14px] font-bold truncate leading-snug ${call.type === "missed" ? (isDark ? "text-red-400" : "text-red-600") : isDark ? "text-white" : "text-slate-800"}`}
                      >
                        {call.name}
                      </span>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`text-[11px] font-semibold tracking-wide ${isDark ? "text-orange-400" : "text-orange-600"}`}
                        >
                          {call.time}
                        </span>
                        {call.duration && (
                          <span
                            className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-slate-400"}`}
                          >
                            • {call.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    {(call.name.startsWith("+") || call.name === "Unknown") && (
                      <div
                        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity click:scale-95 ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-700"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setContacts) {
                            const colors = ["from-teal-400 to-emerald-500", "from-pink-400 to-rose-500", "from-yellow-400 to-orange-500"];
                            const newColor = colors[contacts.length % colors.length];
                            setContacts([{ name: call.name, id: `contact_${Date.now()}`, color: newColor, lastSeen: Date.now() }, ...contacts]);
                            toast.success(t('contacts.contactAdded'), { description: t('contacts.creatingContact', { name: call.name }) });
                          }
                        }}
                        title={t('calls.addToContacts')}
                      >
                        <UserPlus size={14} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-6 gap-y-5 relative z-10 w-full justify-items-center h-[360px]">
              {keys.map((k) => (
                <div
                  key={k.num}
                  onClick={() => handlePress(k.num)}
                  className={`w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:[transform:scale(1.05)_translateZ(20px)] active:[transform:scale(0.95)_translateZ(0px)] select-none group ${
                    isDark
                      ? "bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04] active:shadow-[inset_0_10px_20px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(0,0,0,0.9)]"
                      : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),_8px_8px_16px_rgba(165,175,190,0.5),_inset_2px_2px_4px_rgba(255,255,255,1)] border border-white/80 active:shadow-[inset_4px_4px_12px_rgba(165,175,190,0.5),_inset_-3px_-3px_8px_rgba(255,255,255,0.9)]"
                  }`}
                >
                  <span
                    className={`text-[26px] font-semibold leading-none transition-colors duration-200 ${isDark ? "text-gray-200 group-hover:text-white" : "text-slate-700 group-hover:text-slate-900 group-active:scale-95"}`}
                  >
                    {k.num}
                  </span>
                  {k.letters.trim() && (
                    <span
                      className={`text-[9px] mt-[3px] font-bold tracking-widest transition-colors duration-200 ${isDark ? "text-orange-500/70 group-hover:text-orange-400" : "text-orange-600/70 group-hover:text-orange-700 group-active:scale-95"}`}
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
            if (number.length > 0 && setContacts) {
              const colors = ["from-teal-400 to-emerald-500", "from-pink-400 to-rose-500", "from-yellow-400 to-orange-500"];
              const newColor = colors[contacts.length % colors.length];
              setContacts([{ name: number, id: `contact_${Date.now()}`, color: newColor, lastSeen: Date.now() }, ...contacts]);
              toast.success(t('contacts.contactAdded'), { description: t('contacts.addedToContacts', { number }) });
            }
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:[transform:scale(1.1)_translateZ(15px)] active:[transform:scale(0.9)_translateZ(0px)] ${
            number.length > 0
              ? (isDark ? "opacity-80 hover:opacity-100 text-gray-400 hover:text-white" : "opacity-80 hover:opacity-100 text-slate-500 hover:text-slate-700")
              : "opacity-0 pointer-events-none"
          } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
          title={t('calls.addToContacts')}
        >
          <UserPlus size={22} className="text-current" />
        </div>
        <div
          onClick={handleCallToggle}
          title={isCalling ? t('calls.endCall') : t('calls.startCall')}
          className={`w-[76px] h-[76px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:[transform:scale(1.08)_translateZ(25px)_rotate(3deg)] active:[transform:scale(0.95)_translateZ(0px)] shadow-xl ${
            isCalling
              ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_12px_24px_rgba(239,68,68,0.3),_inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[inset_0_8px_16px_rgba(0,0,0,0.4)]"
              : isDark
                ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_12px_24px_rgba(249,115,22,0.3),_inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[inset_0_8px_16px_rgba(0,0,0,0.4)]"
                : "bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_12px_24px_rgba(249,115,22,0.3),_inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[inset_0_6px_12px_rgba(0,0,0,0.3)]"
          }`}
        >
          <Phone
            className={`text-white drop-shadow-sm fill-white/20 transition-transform ${isCalling ? "rotate-[135deg]" : ""}`}
            size={28}
            strokeWidth={2}
          />
        </div>
        <div
          onClick={handleDelete}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:[transform:scale(1.1)_translateZ(15px)] active:[transform:scale(0.9)_translateZ(0px)] opacity-80 hover:opacity-100 ${
            isDark
              ? "text-gray-400 hover:text-white"
              : "text-slate-500 hover:text-slate-700"
          } ${isCalling ? "pointer-events-none opacity-0" : ""}`}
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
        onMessage={() => {
          if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
          setSelectedContact(null);
        }}
        onDelete={() => {
          toast.info(t('contacts.deleteContact'), { description: t('contacts.deletedHistory', { name: selectedContact?.name }) });
          setSelectedContact(null);
        }}
        onEdit={() => {
          if (selectedContact) {
            const existingContact = contacts.find(c => c.name === selectedContact.name);
            setEditingContact(existingContact ? { ...existingContact } : {
              name: selectedContact.name,
              id: `contact_${Date.now()}`,
              color: selectedContact.color || "from-blue-400 to-indigo-500",
              lastSeen: Date.now(),
              localFields: selectedContact.localFields || [],
            });
            setShowEditForm(true);
          }
          setSelectedContact(null);
        }}
        onBlock={() => {
          toast.info(t('contacts.blockSpammer'), { description: t('contacts.blockedContact', { name: selectedContact?.name }) });
          setSelectedContact(null);
        }}
      />

      {showEditForm && editingContact && (
        <ContactCreateEditModal
          contact={editingContact}
          isDark={isDark}
          onClose={() => { setShowEditForm(false); setEditingContact(null); }}
          onSave={handleSaveContact}
        />
      )}

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
            className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl relative ${isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/10"}`}
          >
            <div
              className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
              onClick={() => setShowContactPicker(false)}
            >
              <X size={18} />
            </div>

            <div className="flex flex-col items-center mb-4 mt-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                <Users size={32} />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t('calls.selectContactTitle')}</h3>
              <p className={`text-xs text-center mt-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('calls.selectContactDesc')}</p>
            </div>

            <div className={`flex flex-col gap-2 max-h-[300px] overflow-y-auto ${isDark ? "scrollbar-ios" : "scrollbar-ios"}`}>
              {contacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setNumber(c.name);
                    setShowContactPicker(false);
                  }}
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${c.color} text-white font-bold text-lg shadow-md shrink-0`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className={`font-bold truncate ${isDark ? "text-gray-100" : "text-slate-800"}`}>{c.name}</span>
                    <span className={`font-mono text-[9px] tracking-wider truncate ${isDark ? "text-gray-500" : "text-slate-400"}`}>{c.id}</span>
                  </div>
                  <Phone className={`w-5 h-5 shrink-0 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
                </div>
              ))}
              {contacts.length === 0 && (
                <div className={`text-center py-8 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                  {t('calls.noContacts')}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
