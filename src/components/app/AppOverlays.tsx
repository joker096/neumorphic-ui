import { AnimatePresence } from "motion/react";
import { AdvancedFilterModal } from "../AppChrome";
import { ContactCreateEditModal } from "../ContactCreateEditModal";
import { ContactProfileModal } from "../ContactProfileModal";
import { CreateBotModal } from "../CreateBotModal";
import { CreateChannelModal } from "../CreateChannelModal";
import { FloatingCallWidget } from "../FloatingCallWidget";

type AppOverlaysProps = {
  theme: "light" | "dark";
  isDark: boolean;
  view: string;
  showCreateChannel: boolean;
  setShowCreateChannel: (show: boolean) => void;
  showCreateBot: boolean;
  setShowCreateBot: (show: boolean) => void;
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
  contacts: any[];
  setContacts: (contacts: any[]) => void;
  chats: any[];
  setChats: (chats: any[]) => void;
  t: (key: string, options?: any) => string;
  onProfileCall: () => void;
  onProfileVideoCall: () => void;
  onProfileMessage: () => void;
  onProfileDelete: () => void;
  onProfileEdit: () => void;
  onProfileBlock: () => void;
};

export const AppOverlays = ({
  theme,
  isDark,
  view,
  showCreateChannel,
  setShowCreateChannel,
  showCreateBot,
  setShowCreateBot,
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
}: AppOverlaysProps) => (
  <>
    <AnimatePresence>
      {showCreateChannel && <CreateChannelModal theme={theme} onClose={() => setShowCreateChannel(false)} />}
      {showCreateBot && <CreateBotModal theme={theme} onClose={() => setShowCreateBot(false)} />}
      <AdvancedFilterModal
        isOpen={showAdvancedFilterModal}
        onClose={() => setShowAdvancedFilterModal(false)}
        isDark={isDark}
        filters={advancedFilters}
        setFilters={setAdvancedFilters}
        t={t}
      />
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
    />

    <AnimatePresence>
      {editingContact && (
        <ContactCreateEditModal
          contact={editingContact}
          isDark={isDark}
          onClose={() => setEditingContact(null)}
          onSave={(name: string, id: string, color: string, localFields: any) => {
            setContacts(contacts.map((contact) =>
              contact.id === editingContact.id ? { ...contact, name, id, color: color || contact.color, localFields } : contact
            ));
            setEditingContact(null);
          }}
        />
      )}
    </AnimatePresence>

    {view !== "calls" && <FloatingCallWidget theme={theme} />}
  </>
);
