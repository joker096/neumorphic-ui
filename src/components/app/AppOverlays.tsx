import { lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import { AdvancedFilterModal } from "../AppChrome";
import { ContactProfileModal } from "../ContactProfileModal";
import { FloatingCallWidget } from "../FloatingCallWidget";
import { useTheme } from "../../contexts/ThemeContext";

const LazyCreateChannelModal = lazy(() => import("../CreateChannelModal").then(m => ({ default: m.CreateChannelModal })));
const LazyCreateBotModal = lazy(() => import("../CreateBotModal").then(m => ({ default: m.CreateBotModal })));
const LazyCreateGroupModal = lazy(() => import("../CreateGroupModal").then(m => ({ default: m.CreateGroupModal })));
const LazyContactCreateEditModal = lazy(() => import("../ContactCreateEditModal").then(m => ({ default: m.ContactCreateEditModal })));

type AppOverlaysProps = {
  isDark?: boolean;
  view: string;
  showCreateChannel: boolean;
  setShowCreateChannel: (show: boolean) => void;
  showCreateBot: boolean;
  setShowCreateBot: (show: boolean) => void;
  showCreateGroup?: boolean;
  setShowCreateGroup?: (show: boolean) => void;
  showAdvancedFilterModal: boolean;
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: Record<string, boolean>;
  setAdvancedFilters: (filters: Record<string, boolean>) => void;
  globalSelectedContact: any | null;
  setGlobalSelectedContact: (contact: any | null) => void;
  activeChat: any | null;
  setActiveChat: (chat: any | null) => void;
  editingContact: any | null;
  setEditingContact: (contact: any | null) => void;
  showAddContactFromChat: boolean;
  setShowAddContactFromChat: (show: boolean) => void;
  onAddContactFromChat: (name: string, id: string, color?: string, localFields?: any[]) => void;
  contacts: any[];
  setContacts: (contacts: any[]) => void;
  chats: any[];
  setChats: (chats: any[]) => void;
  t: (key: string, options?: string) => string;
  onProfileCall: () => void;
  onProfileVideoCall: () => void;
  onProfileMessage: () => void;
  onProfileDelete: () => void;
  onProfileEdit: () => void;
   onProfileBlock: () => void;
   onProfileToggleFavorite: (id: string, isFavorite: boolean) => void;
};

export const AppOverlays = ({
  isDark = false,
  view,
  showCreateChannel,
  setShowCreateChannel,
  showCreateBot,
  setShowCreateBot,
  showCreateGroup = false,
  setShowCreateGroup,
  showAdvancedFilterModal,
  setShowAdvancedFilterModal,
  advancedFilters,
  setAdvancedFilters,
  globalSelectedContact,
  setGlobalSelectedContact,
  activeChat,
  setActiveChat,
  editingContact,
  setEditingContact,
  showAddContactFromChat,
  setShowAddContactFromChat,
  onAddContactFromChat,
  contacts,
  setContacts,
  chats,
  setChats,
  t,
  onProfileCall,
  onProfileVideoCall,
  onProfileMessage,
  onProfileDelete,
  onProfileEdit,
   onProfileBlock,
   onProfileToggleFavorite,
}: AppOverlaysProps) => {
  const { theme } = useTheme();
  return (
    <>
      <AnimatePresence>
        {showCreateChannel && <Suspense fallback={null}><LazyCreateChannelModal theme={theme} onClose={() => setShowCreateChannel(false)} /></Suspense>}
        {showCreateBot && <Suspense fallback={null}><LazyCreateBotModal theme={theme} onClose={() => setShowCreateBot(false)} /></Suspense>}
        {showCreateGroup && <Suspense fallback={null}><LazyCreateGroupModal theme={theme} onClose={() => setShowCreateGroup?.(false)} /></Suspense>}
        {showAdvancedFilterModal && (
          <AdvancedFilterModal
            onClose={() => setShowAdvancedFilterModal(false)}
            isDark={isDark}
            filters={advancedFilters}
            setFilters={setAdvancedFilters}
            t={t}
          />
        )}
      </AnimatePresence>

      <ContactProfileModal
        contact={globalSelectedContact}
        theme={theme}
        onClose={() => setGlobalSelectedContact(null)}
        onCall={onProfileCall}
        onVideoCall={onProfileVideoCall}
        onMessage={onProfileMessage}
        onDelete={onProfileDelete}
        onEdit={onProfileEdit}
        onBlock={onProfileBlock}
        onToggleFavorite={onProfileToggleFavorite}
      />

      <AnimatePresence>
        {editingContact && (
          <Suspense fallback={null}>
          <LazyContactCreateEditModal
            contact={editingContact}
            isDark={isDark}
            onClose={() => setEditingContact(null)}
            onSave={(name: string, id: string, color: string, localFields: any) => {
              const existing = contacts.find((c) => c.id === editingContact.id);
              if (existing) {
                setContacts(contacts.map((contact) =>
                  contact.id === editingContact.id ? { ...contact, name, id, color: color || contact.color, localFields } : contact
                ));
              } else {
                setContacts([...contacts, { name, id, color: color || 'from-blue-400 to-indigo-500', lastSeen: Date.now(), localFields } as any]);
              }
              setEditingContact(null);
            }}
          />
          </Suspense>
        )}
        {showAddContactFromChat && !editingContact && (
          <Suspense fallback={null}>
          <LazyContactCreateEditModal
            contact={null}
            isDark={isDark}
            onClose={() => setShowAddContactFromChat(false)}
            onSave={(name: string, id: string, color?: string, localFields?: any[]) => {
              onAddContactFromChat?.(name, id, color, localFields);
            }}
          />
          </Suspense>
        )}
      </AnimatePresence>

      <FloatingCallWidget theme={theme} />
    </>
  );
};
