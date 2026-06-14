interface EditContactModalProps {
  show: boolean;
  editContactName: string;
  editingContactId: string | null;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const EditContactModal = ({ show, editContactName, editingContactId, onNameChange, onSave, onClose, t }: EditContactModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl p-6 w-80 shadow-2xl bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold mb-4">{t('contacts.editContact')}</h3>
        <input
          value={editContactName}
          onChange={e => onNameChange(e.target.value)}
          placeholder={t('contacts.contactName')}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-2 outline-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-xl px-4 py-2 bg-gray-200 dark:bg-gray-700">{t('common.cancel')}</button>
          <button onClick={onSave} className="rounded-xl px-4 py-2 bg-blue-500 text-white">{t('contacts.saveChanges')}</button>
        </div>
      </div>
    </div>
  );
};
