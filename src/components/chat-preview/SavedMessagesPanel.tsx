import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bookmark } from "lucide-react";
import { sheetSurface, modalCloseClass } from "../ui/modalShared";

interface SavedMessagesPanelProps {
  show: boolean;
  isDark?: boolean;
  chatSavedMessages: any[];
  chatName: string;
  onClose: () => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
  t: (key: string, options?: any) => string;
}

export const SavedMessagesPanel = ({ show, isDark = false, chatSavedMessages, chatName, onClose, onToggleSavedMessage, t }: SavedMessagesPanelProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[var(--z-dropdown)] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${sheetSurface(isDark, "max-w-[760px] max-h-[78%] overflow-hidden border-x")}`}
            >
            <div className={`p-4 flex items-center justify-between ${"border-b border-[var(--border-color)]"}`}>
              <div>
                <div className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? "text-orange-400" : "text-orange-600"}`}>{t('chat.savedMessages')}</div>
                <div className="text-sm mt-1 text-[var(--text-secondary)]">{t('chat.savedItems', { n: chatSavedMessages.length, chatName })}</div>
              </div>
<button
  type="button"
  aria-label={t('common.close')}
  onClick={onClose}
  className={modalCloseClass(isDark)}
>
  <X size={16} />
</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(78vh-76px)]">
              {chatSavedMessages.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {chatSavedMessages.slice().reverse().map((saved: any) => (
                    <div key={saved.key} className={`p-4 border ${isDark ? "bg-[var(--bg-tertiary)] border-[var(--border-color)]" : "bg-white border-[var(--border-color)]"}`}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                          {saved.sourceLabel || chatName}
                        </div>
                        <button
                          onClick={() => onToggleSavedMessage?.({ id: chatName }, { id: saved.messageId })}
                          aria-label={t('chat.unsave')}
                          title={t('chat.unsave')}
                          className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-full ${isDark ? "bg-white/5 text-[var(--text-secondary)]" : "bg-black/5 text-[var(--text-secondary)]"}`}
                        >
                          <Bookmark size={16} />
                          <span className="sr-only">{t('chat.unsave')}</span>
                        </button>
                      </div>
                      <div className={`text-sm text-[var(--text-primary)]`}>
                        {saved.preview}
                      </div>
                      <div className={`mt-2 text-xs font-semibold ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                        {saved.time}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className={`py-12 text-center ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                  {t('chat.noSavedMessages')}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};




