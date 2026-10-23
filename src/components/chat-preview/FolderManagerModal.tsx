import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, ChevronDown, ChevronRight, FolderCog } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useAppStore } from "../../store";
import {
  sanitizeCustomFolderName,
  type ChatFolder,
} from "../../lib/chat/customFolders";
import { FolderChatPicker, type ChatOption } from "./FolderChatPicker";

type Translate = (key: string, options?: any) => string;

interface FolderManagerModalProps {
  open: boolean;
  onClose: () => void;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  t: Translate;
}

/**
 * Create / rename / delete custom folders and assign chats to them. Chat
 * assignment happens live in the per-folder picker. Deleting the folder that is
 * currently active falls back to "all" so the chat list never shows an empty,
 * orphaned tab.
 */
export const FolderManagerModal = ({
  open,
  onClose,
  activeFolder,
  setActiveFolder,
  t,
}: FolderManagerModalProps) => {
  const customFolders = useAppStore((s) => s.customFolders);
  const addCustomFolder = useAppStore((s) => s.addCustomFolder);
  const renameCustomFolder = useAppStore((s) => s.renameCustomFolder);
  const deleteCustomFolder = useAppStore((s) => s.deleteCustomFolder);
  const setCustomFolderChats = useAppStore((s) => s.setCustomFolderChats);
  const chats = useAppStore((s) => s.chats);
  const channels = useAppStore((s) => s.channels);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [openChatsId, setOpenChatsId] = useState<string | null>(null);

  const allChats = useMemo<ChatOption[]>(() => {
    const list: ChatOption[] = [
      ...chats.map((c: any) => ({ id: c.id, name: String(c.name ?? "") })),
      ...channels.map((c: any) => ({ id: c.id, name: String(c.name ?? "") })),
    ];
    // Channels without a name are not useful in a picker.
    return list.filter((c) => c.name.trim() !== "");
  }, [chats, channels]);

  const submitCreate = () => {
    if (sanitizeCustomFolderName(newName)) {
      addCustomFolder(newName);
      setNewName("");
    }
  };

  const submitEdit = (folder: ChatFolder) => {
    if (sanitizeCustomFolderName(editName)) renameCustomFolder(folder.id, editName);
    setEditingId(null);
  };

  const handleDelete = (folder: ChatFolder) => {
    if (folder.id === activeFolder) setActiveFolder("all");
    deleteCustomFolder(folder.id);
    if (openChatsId === folder.id) setOpenChatsId(null);
  };

  const rowClass =
    "min-h-11 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <Modal isOpen={open} onClose={onClose} size="md" ariaLabel={t("chat.folders.yourFolders", "Папки")}>
      <div className="w-full max-w-[560px]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <FolderCog size={18} />
          </span>
          <div className="text-base font-bold text-[var(--text-primary)]">
            {t("chat.folders.yourFolders", "Папки")}
          </div>
        </div>

        {/* Create row */}
        <div className="flex items-center gap-2 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCreate();
            }}
            placeholder={t("chat.folders.folderNamePlaceholder", "Название новой папки")}
            maxLength={30}
            aria-label={t("chat.folders.folderNamePlaceholder", "Название новой папки")}
            className={`${rowClass} flex-1`}
          />
          <button
            type="button"
            onClick={submitCreate}
            disabled={!sanitizeCustomFolderName(newName)}
            aria-label={t("chat.folders.create", "Создать")}
            className="min-w-11 min-h-11 px-4 rounded-xl bg-[var(--accent)] text-[var(--ink-on-saturate)] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all text-sm font-semibold"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t("chat.folders.create", "Создать")}</span>
          </button>
        </div>

        {customFolders.length === 0 ? (
          <div className="text-sm text-[var(--text-secondary)] py-6 text-center border border-dashed border-[var(--border-color)] rounded-xl">
            {t("chat.folders.empty", "Своих папок пока нет — создайте первую.")}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {customFolders.map((folder) => {
              const isEditing = editingId === folder.id;
              const isOpen = openChatsId === folder.id;
              return (
                <div
                  key={folder.id}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]"
                >
                  <div className="flex items-center gap-2 px-3 min-h-11">
                    <button
                      type="button"
                      onClick={() => setOpenChatsId(isOpen ? null : folder.id)}
                      aria-expanded={isOpen}
                      aria-label={`${folder.name} — ${t("chat.folders.chats", "Чаты")}`}
                      className="min-w-11 min-h-11 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)] transition-colors"
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {isEditing ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => submitEdit(folder)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitEdit(folder);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        maxLength={30}
                        aria-label={t("chat.folders.editFolder", "Переименовать")}
                        className={`${rowClass} flex-1`}
                      />
                    ) : (
                      <span className="flex-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                        {folder.name}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(folder.id);
                        setEditName(folder.name);
                      }}
                      aria-label={t("chat.folders.editFolder", "Переименовать")}
                      className="min-w-11 min-h-11 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--msg-bg-panel-hover)] transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(folder)}
                      aria-label={t("chat.folders.deleteFolder", "Удалить")}
                      className="min-w-11 min-h-11 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {isOpen && (
                    <FolderChatPicker
                      folder={folder}
                      chats={allChats}
                      onChange={(chatIds) => setCustomFolderChats(folder.id, chatIds)}
                      t={t}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
