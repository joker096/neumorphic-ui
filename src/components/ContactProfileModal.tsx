import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, MessageSquare, Edit, Trash2, Ban } from 'lucide-react';
import { useAppStore } from '../store';
import { useI18n } from '../lib/i18n';

export type ContactProfile = {
  id: string;
  name: string;
  color?: string;
  lastSeen?: number;
  online?: boolean;
  callInfo?: {
    time: string;
    type: 'missed' | 'incoming' | 'outgoing' | 'returned';
    duration?: string;
  };
};

type Props = {
  contact: ContactProfile | null;
  onClose: () => void;
  onCall?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBlock?: () => void;
  theme: 'light' | 'dark';
};

export const ContactProfileModal = ({ contact, onClose, onCall, onMessage, onEdit, onDelete, onBlock, theme }: Props) => {
  const ghostViewMode = useAppStore(state => state.ghostViewMode);
  const isDark = theme === 'dark';
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {contact && (
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
            className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl relative flex flex-col items-center ${isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/10"}`}
          >
            <div 
              className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
              onClick={onClose}
              title={t('contacts.close')}
            >
              <X size={18} />
            </div>
            
            <div className={`w-24 h-24 mt-4 rounded-full flex items-center justify-center bg-gradient-to-br ${contact.color || 'from-gray-500 to-gray-600'} text-white font-bold text-4xl shadow-lg relative`}>
              {contact.name.charAt(0)}
              {!ghostViewMode && (contact.online || contact.lastSeen !== undefined) && !contact.callInfo && (
                <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 ${isDark ? "border-[#1a1d24]" : "border-white"} ${(contact.online || contact.lastSeen < 60000) ? "bg-green-500" : "bg-gray-400"}`}></div>
              )}
            </div>
            
            <h2 className={`text-2xl font-bold mt-4 text-center ${isDark ? "text-white" : "text-slate-800"}`}>{contact.name}</h2>
            
            <div className={`mt-1 font-mono text-[10px] tracking-wider px-3 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}>
              {contact.id}
            </div>
            
            {contact.callInfo ? (
              <div className={`mt-4 w-full p-4 rounded-2xl flex flex-col items-center gap-1 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                <div className={`text-sm font-semibold capitalize ${contact.callInfo.type === 'missed' ? 'text-red-500' : isDark ? 'text-white' : 'text-slate-800'}`}>
                  {t('contacts.callType', { type: contact.callInfo.type })}
                </div>
                <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  {contact.callInfo.time} {contact.callInfo.duration ? `• ${contact.callInfo.duration}` : ''}
                </div>
              </div>
            ) : (contact.online || contact.lastSeen !== undefined) && !ghostViewMode && (
              <div className={`text-xs mt-2 font-medium ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                {contact.online ? t('contacts.activeNow') : t('contacts.lastSeenAgo', { time: contact.lastSeen && contact.lastSeen < 60000 ? t('contacts.activeNow') : contact.lastSeen && contact.lastSeen < 3600000 ? t('chat.minutesAgo', { count: Math.floor(contact.lastSeen / 60000) }) : contact.lastSeen && contact.lastSeen < 86400000 ? t('chat.hoursAgo', { count: Math.floor(contact.lastSeen / 3600000) }) : t('chat.daysAgo', { count: Math.floor((contact.lastSeen || 0) / 86400000) }) })}
              </div>
            )}

            <div className="flex w-full gap-3 mt-6">
               <button onClick={() => { onCall?.(); onClose(); }} className="flex-1 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white transition-colors active:scale-95 shadow-lg shadow-green-500/20">
                  <Phone size={20} fill="currentColor" />
                   <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.call')}</span>
               </button>
               <button onClick={() => { onMessage?.(); onClose(); }} className="flex-1 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white transition-colors active:scale-95 shadow-lg shadow-blue-500/20">
                  <MessageSquare size={20} fill="currentColor" />
                   <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.message')}</span>
               </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 w-full">
               <button onClick={() => { onEdit?.(); onClose(); }} className={`col-span-1 h-12 rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"}`}>
                  <Edit size={16} />
                   <span className="text-xs font-bold">{t('contacts.edit')}</span>
               </button>
               <button onClick={() => { 
                   if (window.confirm(t('contacts.confirmDeleteMessage', { name: contact.name }))) {
                     onDelete?.();
                     onClose();
                  }
               }} className={`col-span-1 h-12 rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-95 ${isDark ? "bg-red-500/10 hover:bg-red-500/20 text-red-500" : "bg-red-50 hover:bg-red-100 text-red-600"}`}>
                  <Trash2 size={16} />
                   <span className="text-xs font-bold">{t('contacts.deleteContact')}</span>
               </button>
               <button onClick={() => { 
                   if (window.confirm(t('contacts.confirmBlockMessage', { name: contact.name }))) {
                     onBlock?.();
                     onClose();
                  }
               }} className={`col-span-2 h-12 rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-95 ${isDark ? "bg-white/5 hover:bg-red-500/20 text-red-400" : "bg-slate-100 hover:bg-red-100 text-red-600"}`}>
                  <Ban size={16} />
                   <span className="text-xs font-bold">{t('contacts.blockSpammer')}</span>
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
