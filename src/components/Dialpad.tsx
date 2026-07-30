import React, { useEffect, useRef, useState } from "react";
import { UserPlus, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ContactProfileModal, type ContactProfile } from "./ContactProfileModal";
import { useAppStore } from "../store";
import { useI18n } from "../lib/i18n";
import type { Contact } from "../types/contact";
import { toast } from "sonner";
import { MOCK_CALLS } from "../constants";
import { DialpadAddContactModal, DialpadContactPicker, DialpadCreateFolderModal } from "./call/DialpadModals";
import { SearchInput } from "./ui/SearchInput";
import { KeyButton } from "./ui/KeyButton";
import { ActiveCallOverlay } from "./call/ActiveCallOverlay";
import { CallFilterTabs } from "./call/CallFilterTabs";
import { CallFolderBar } from "./call/CallFolderBar";
import { CallHistoryList } from "./call/CallHistoryList";
import { CallActions } from "./call/CallActions";

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
      isDark ? "bg-[var(--bg-tertiary)]" : "bg-[var(--bg-secondary)]"
    }`}>
      <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${
        isDark ? "bg-orange-500/8" : "bg-orange-400/15"
      }`} />

      <AnimatePresence mode="wait">
        {isCalling ? (
          <ActiveCallOverlay
            isDark={isDark}
            number={number}
            callDuration={formatDuration(callDuration)}
            isMuted={isMuted}
            isVideoCall={isVideoCall}
            isSpeaker={isSpeaker}
            t={t}
            onToggleMute={() => activeCall && setActiveCall({ ...activeCall, isMuted: !isMuted })}
            onToggleSpeaker={() => activeCall && setActiveCall({ ...activeCall, isSpeaker: !isSpeaker })}
            onToggleVideo={() => activeCall && setActiveCall({ ...activeCall, isVideoEnabled: !isVideoCall, isVideo: !isVideoCall })}
            onEndCall={handleCallToggle}
          />
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
                      isDark ? "text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-black/10"
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
              <CallFilterTabs
                callFilter={callFilter}
                activeFolder={activeFolder}
                isDark={isDark}
                t={t}
                onFilterChange={(f) => { setCallFilter(f); setActiveFolder('all'); }}
              />
            </div>

            <CallFolderBar
              activeFolder={activeFolder}
              callFolders={callFolders}
              isDark={isDark}
              t={t}
              onFolderChange={setActiveFolder}
              onDeleteFolder={deleteFolder}
              onShowCreateFolder={() => setShowCreateFolder(true)}
            />

            <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
              <CallHistoryList
                calls={folderCalls}
                isDark={isDark}
                t={t}
                onCallClick={(call) => {
                  setSelectedContact({
                    id: `hash_${call.id}`,
                    name: call.name,
                    color: call.name === "Unknown" ? "from-gray-500 to-gray-600" : "from-blue-400 to-indigo-500",
                    callInfo: { time: call.time, type: call.type as any, duration: "10:32" },
                  });
                }}
                onQuickAddContact={handleQuickAddContact}
              />
            </div>

            <div className="grid w-full justify-items-center pt-3 gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {keys.map((k) => (
                <KeyButton key={k.num} num={k.num} letters={k.letters} isDark={isDark} onPress={handlePress} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CallActions
        number={number}
        isCalling={isCalling}
        isDark={isDark}
        t={t}
        onAddContact={() => { if (number.length > 0) handleQuickAddContact(number); }}
        onCallToggle={handleCallToggle}
        onDelete={handleDelete}
      />

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




