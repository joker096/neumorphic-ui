import React from "react";
import { UserPlus, Users, Folder, X } from "lucide-react";
import { FormModal } from "../ui/FormModal";
import { FormField } from "../ui/FormField";
import { FormActions } from "../ui/FormActions";
import { useI18n } from "../../lib/i18n";

interface DialpadModalsProps {
  theme: "light" | "dark";
  showAddContact: boolean;
  onCloseAddContact: () => void;
  addName: string;
  onAddNameChange: (v: string) => void;
  addId: string;
  onAddIdChange: (v: string) => void;
  onSaveContact: () => void;
  canSaveContact: boolean;
  showContactPicker: boolean;
  onCloseContactPicker: () => void;
  contacts: Array<{ id: string; name: string; color: string }>;
  onSelectContact: (name: string) => void;
  showCreateFolder: boolean;
  onCloseCreateFolder: () => void;
  newFolderName: string;
  onNewFolderNameChange: (v: string) => void;
  onCreateFolder: () => void;
  canCreateFolder: boolean;
  callFolders: Array<{ id: string; name: string }>;
  onDeleteFolder: (id: string) => void;
}

export const DialpadAddContactModal = ({
  theme, showAddContact, onCloseAddContact,
  addName, onAddNameChange, addId, onAddIdChange,
  onSaveContact, canSaveContact,
}: Pick<DialpadModalsProps, 'theme' | 'showAddContact' | 'onCloseAddContact' | 'addName' | 'onAddNameChange' | 'addId' | 'onAddIdChange' | 'onSaveContact' | 'canSaveContact'>) => {
  const { t } = useI18n();
  return (
    <FormModal isOpen={showAddContact} onClose={onCloseAddContact} title={t('contacts.addContact')} subtitle="Enter name and network ID to add to contacts" icon={UserPlus} theme={theme}>
      <div className="flex flex-col gap-3 mt-2">
        <FormField theme={theme} autoFocus placeholder={t('contacts.contactName')} value={addName} onChange={onAddNameChange} />
        <FormField theme={theme} placeholder={t('contacts.networkId')} value={addId} onChange={onAddIdChange} monospace />
      </div>
      <FormActions theme={theme} submitLabel={t('contacts.saveContact')} cancelLabel={t('contacts.close')} onSubmit={onSaveContact} onCancel={onCloseAddContact} disabled={!canSaveContact} />
    </FormModal>
  );
};

export const DialpadContactPicker = ({
  theme, showContactPicker, onCloseContactPicker,
  contacts, onSelectContact,
}: Pick<DialpadModalsProps, 'theme' | 'showContactPicker' | 'onCloseContactPicker' | 'contacts' | 'onSelectContact'>) => {
  const { t } = useI18n();
  return (
    <FormModal isOpen={showContactPicker} onClose={onCloseContactPicker} title={t('chat.selectContact')} subtitle={t('chat.chooseContact')} icon={Users} theme={theme}>
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mt-2">
        {contacts.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectContact(c.name)}
            className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${c.color} text-white font-bold text-lg shadow-md shrink-0`}>
              {c.name.charAt(0)}
            </div>
            <div className={`flex-1 flex flex-col min-w-0`}>
              <span className={`font-bold truncate ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>{c.name}</span>
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
            {t('chat.noContactsAvailable')}
          </div>
        )}
      </div>
    </FormModal>
  );
};

export const DialpadCreateFolderModal = ({
  theme, showCreateFolder, onCloseCreateFolder,
  newFolderName, onNewFolderNameChange,
  onCreateFolder, canCreateFolder,
  callFolders, onDeleteFolder,
}: Pick<DialpadModalsProps, 'theme' | 'showCreateFolder' | 'onCloseCreateFolder' | 'newFolderName' | 'onNewFolderNameChange' | 'onCreateFolder' | 'canCreateFolder' | 'callFolders' | 'onDeleteFolder'>) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  return (
    <FormModal isOpen={showCreateFolder} onClose={onCloseCreateFolder} title={t('chat.createFolder')} subtitle={t('chat.folderNameHint')} icon={Folder} theme={theme}>
      <div className="mt-2">
        <FormField theme={theme} autoFocus placeholder={t('chat.folderPlaceholder')} value={newFolderName} onChange={onNewFolderNameChange} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') onCreateFolder() }} />
      </div>
      <FormActions theme={theme} submitLabel={t('chat.create')} cancelLabel={t('chat.cancel')} onSubmit={onCreateFolder} onCancel={onCloseCreateFolder} disabled={!canCreateFolder} />
      {callFolders.length > 0 && (
        <div className="mt-6">
          <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('chat.yourFolders')}</div>
          <div className="flex flex-col gap-2">
            {callFolders.map(folder => (
              <div key={folder.id} className={`flex items-center gap-3 p-2.5 rounded-md ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <Folder size={14} className={isDark ? 'text-gray-400' : 'text-slate-500'} />
                <span className={`flex-1 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{folder.name}</span>
                 <button onClick={() => onDeleteFolder(folder.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'text-red-400 hover:bg-white/10' : 'text-red-500 hover:bg-black/10'}`}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </FormModal>
  );
};
