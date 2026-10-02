import { AnimatePresence, motion } from "motion/react";
import { Ban, Edit, MoreVertical, ShieldOff, Trash2 } from "lucide-react";

type Translate = (key: string, options?: any) => string;

interface ContactActionsMenuProps {
  isDark: boolean;
  t: Translate;
  open: boolean;
  onToggle: () => void;
  canEdit: boolean;
  canDelete: boolean;
  canBlock: boolean;
  canUnblock: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onBlock: () => void;
  onUnblock: () => void;
}

/** Overflow popover with the destructive and edit actions of the contact profile. */
export function ContactActionsMenu({ isDark, t, open, onToggle, canEdit, canDelete, canBlock, canUnblock, onEdit, onDelete, onBlock, onUnblock }: ContactActionsMenuProps) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="relative">
        <button
          onClick={onToggle}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} text-[var(--text-tertiary)] hover:text-[var(--text-primary)] min-w-11 min-h-11`}
          aria-label={t("contacts.moreActions")}
        >
          <MoreVertical size={18} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={`absolute left-10 top-0 flex gap-2 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]"} rounded-xl p-2 shadow-lg`}
            >
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="w-10 h-10 min-w-11 min-h-11 rounded-lg flex items-center justify-center cursor-pointer transition-all bg-orange-500/15 hover:bg-orange-500/25 text-orange-500"
                  aria-label={t("contacts.edit")}
                >
                  <Edit size={16} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="w-10 h-10 min-w-11 min-h-11 rounded-lg flex items-center justify-center cursor-pointer transition-all bg-red-500/10 hover:bg-red-500/20 text-red-500"
                  aria-label={t("contacts.deleteContact")}
                >
                  <Trash2 size={16} />
                </button>
              )}
              {canBlock && (
                <button
                  onClick={onBlock}
                  className="w-10 h-10 min-w-11 min-h-11 rounded-lg flex items-center justify-center cursor-pointer transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400"
                  aria-label={t("contacts.blockSpammer")}
                >
                  <Ban size={16} />
                </button>
              )}
              {canUnblock && (
                <button
                  onClick={onUnblock}
                  className="w-10 h-10 min-w-11 min-h-11 rounded-lg flex items-center justify-center cursor-pointer transition-all bg-green-500/10 hover:bg-green-500/20 text-green-500"
                  aria-label={t("profile.unblock")}
                >
                  <ShieldOff size={16} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
