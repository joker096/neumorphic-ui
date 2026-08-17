import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
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
          className="absolute inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${sheetSurface(isDark, "max-w-[760px] max-h-[78%] overflow-hidden border-x")}`}
            >
            <div className={`p-4 flex items-center justify-between ${isDark ? "border-b border-[var(--border-color)]" : "border-b border-[var(--border-color)]"}`}>
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-orange-400" : "text-orange-600"}`}>{t('chat.savedMessages')}</div>
                <div className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>{t('chat.savedItems', { n: chatSavedMessages.length, chatName })}</div>
              </div>
              <button
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
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                          {saved.sourceLabel || chatName}
                        </div>
                        <button
                          onClick={() => onToggleSavedMessage?.({ id: chatName }, { id: saved.messageId })}
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-300" : "bg-slate-100 text-slate-600"}`}
                        >
                          {t('chat.unsave')}
                        </button>
                      </div>
                      <div className={`text-sm ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
                        {saved.preview}
                      </div>
                      <div className={`mt-2 text-[10px] font-semibold ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                        {saved.time}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className={`py-12 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
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




