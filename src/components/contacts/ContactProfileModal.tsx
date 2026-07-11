import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Video, MessageSquare, Edit, Trash2, Ban, Mail, Send, Star, StarOff, ShieldCheck, ShieldAlert, Globe } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { computeSafetyNumber, computeVerificationLevel, getVerificationColor } from '../../lib/crypto/safetyNumber';
import type { ContactField } from '../../types/contact';

export type ContactProfile = {
  id: string;
  name: string;
  color?: string;
  lastSeen?: number;
  online?: boolean;
  isFavorite?: boolean;
  localFields?: ContactField[];
  telegram?: string;
  whatsapp?: string;
  signal?: string;
  signalV2V?: string;
  email?: string;
  username?: string;
  callInfo?: {
    time: string;
    type: 'missed' | 'incoming' | 'outgoing' | 'returned';
    duration?: string;
  };
};

type Props = {
  contact: ContactProfile | null;
  myPeerId?: string;
  onClose: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBlock?: () => void;
  onRequestDelete?: () => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  theme?: 'light' | 'dark';
};

export const ContactProfileModal = ({ contact, myPeerId, onClose, onCall, onVideoCall, onMessage, onEdit, onDelete, onBlock, onRequestDelete, onToggleFavorite }: Props) => {
  const ghostViewMode = useAppStore(state => state.ghostViewMode);
  const { t } = useI18n();
  const [confirmAction, setConfirmAction] = useState<'delete' | 'block' | null>(null);
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);
  const [safetyNumber, setSafetyNumber] = useState('');
  const [verifyLevel, setVerifyLevel] = useState(0);

  useEffect(() => {
    if (showSafetyNumber && contact && myPeerId) {
      computeSafetyNumber(myPeerId, contact.id).then(setSafetyNumber)
    }
  }, [showSafetyNumber, contact, myPeerId])

  useEffect(() => {
    if (safetyNumber) {
      setVerifyLevel(computeVerificationLevel(safetyNumber))
    }
  }, [safetyNumber])

  const requestDelete = () => {
    onRequestDelete?.();
    setConfirmAction('delete');
  };

  const requestBlock = () => {
    setConfirmAction('block');
  };

  const handleDelete = () => {
    onDelete?.();
    onClose();
    setConfirmAction(null);
  };

  const handleBlock = () => {
    onBlock?.();
    onClose();
    setConfirmAction(null);
  };

  const handleToggleFavorite = (id: string, currentStatus: boolean) => {
    onToggleFavorite?.(id, !currentStatus);
  };

  return (
    <AnimatePresence>
      {confirmAction === 'delete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <motion.div
             initial={{ opacity: 0, scale: 0.92, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.92, y: 20 }}
             className="relative w-full max-w-sm rounded-md shadow-2xl p-6 border modal-surface"
             onClick={(event) => event.stopPropagation()}
           >
             <h3 className="text-lg font-bold mb-2 text-[--text-primary]">{t('contacts.deleteContact')}</h3>
             <p className="text-sm mb-6 leading-relaxed text-[--text-secondary]">{t('contacts.confirmDeleteMessage', { name: contact?.name || '' })}</p>
             <div className="flex gap-3">
               <button onClick={() => setConfirmAction(null)} className="flex-1 h-11 rounded-md text-sm font-bold transition-colors active:scale-95 neu-button">
                 {t('contacts.close')}
               </button>
               <button onClick={handleDelete} className="flex-1 h-11 rounded-md text-sm font-bold transition-colors active:scale-95 bg-red-500 hover:bg-red-600 text-white">
                 {t('contacts.deleteContact')}
               </button>
             </div>
           </motion.div>
        </motion.div>
      )}
      {confirmAction === 'block' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
         <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="relative w-full max-w-sm rounded-md shadow-2xl p-6 border modal-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2 text-[--text-primary]">{t('contacts.blockSpammer')}</h3>
            <p className="text-sm mb-6 leading-relaxed text-[--text-secondary]">{t('contacts.confirmBlockMessage', { name: contact?.name || '' })}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 h-11 rounded-md text-sm font-bold transition-colors active:scale-95 neu-button">
                {t('contacts.close')}
              </button>
              <button onClick={handleBlock} className="flex-1 h-11 rounded-md text-sm font-bold transition-colors active:scale-95 bg-red-500 hover:bg-red-600 text-white">
                {t('contacts.blockSpammer')}
              </button>
           </div>
         </motion.div>
       </motion.div>
      )}
      {contact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-[340px] md:max-w-[400px] lg:max-w-[440px] p-6 shadow-2xl relative flex flex-col items-center modal-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors neu-button"
              onClick={onClose}
              title={t('contacts.close')}
            >
              <X size={18} />
            </div>

            <div className={`w-24 h-24 mt-4 rounded-full flex items-center justify-center bg-gradient-to-br ${contact.color || 'from-gray-500 to-gray-600'} text-white font-bold text-4xl shadow-lg relative group`}>
              {(contact.name || 'U').charAt(0)}
              {!ghostViewMode && (contact.online || contact.lastSeen !== undefined) && !contact.callInfo && (
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white bg-green-500"></div>
              )}
              {onEdit && (
                <button
                  onClick={() => { onEdit?.(); onClose(); }}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                  aria-label={t('contacts.edit')}
                >
                  <Edit size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={requestDelete}
                  className="absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white shadow-lg"
                  aria-label={t('contacts.deleteContact')}
                >
                  <Trash2 size={14} />
                </button>
              )}
              {onBlock && (
                <button
                  onClick={requestBlock}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white shadow-lg"
                  aria-label={t('contacts.blockSpammer')}
                >
                  <Ban size={14} />
                </button>
              )}
            </div>

            <h2 className="text-2xl font-bold mt-4 text-center flex items-center justify-center gap-2 tracking-tight text-[--text-primary]">
              {contact.name}
              <button
                onClick={() => handleToggleFavorite(contact.id, contact.isFavorite || false)}
                className={`p-1.5 rounded-full transition-all active:scale-90 ${contact.isFavorite ? "text-yellow-400 bg-white/10" : "text-[--text-tertiary] hover:text-[--text-primary]"}`}
                title={contact.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                {contact.isFavorite ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
              </button>
            </h2>

            <div className="mt-1 font-mono text-[10px] tracking-wider px-3 py-1 rounded-full neu-badge">
              {contact.id}
            </div>

            {contact.callInfo ? (
              <div className="mt-4 w-full p-4 rounded-md flex flex-col items-center gap-1 bg-black/5">
                <div className={`text-sm font-semibold capitalize ${contact.callInfo.type === 'missed' ? 'text-red-500' : 'text-[--text-primary]'}`}>
                  {t('contacts.callType', { type: contact.callInfo.type })}
                </div>
                <div className="text-xs text-[--text-secondary]">
                  {contact.callInfo.time} {contact.callInfo.duration ? `• ${contact.callInfo.duration}` : ''}
                </div>
              </div>
            ) : (contact.online || contact.lastSeen !== undefined) && !ghostViewMode && (
              <div className="text-xs mt-2 font-medium text-[--text-tertiary]">
                {(() => {
                  if (contact.online) return t('contacts.activeNow');
                  if (!contact.lastSeen) return '—';
                  const delta = Date.now() - contact.lastSeen;
                  if (delta < 0 || isNaN(delta)) return '—';
                  if (delta < 60000) return t('contacts.activeNow');
                  if (delta < 3600000) return t('chat.minutesAgo', { count: Math.floor(delta / 60000) });
                  if (delta < 86400000) return t('chat.hoursAgo', { count: Math.floor(delta / 3600000) });
                  const days = Math.floor(delta / 86400000);
                  if (days > 365) return t('chat.yearsAgo', { count: Math.floor(days / 365) });
                  return t('chat.daysAgo', { count: days });
                })()}
              </div>
            )}

            {contact.localFields && contact.localFields.length > 0 && (
              <div className="w-full mt-4 p-4 rounded-md flex flex-col gap-2 bg-black/5">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[--text-secondary]">
                  {t('contacts.localInfo')}
                </div>
                {contact.localFields.map(field => (
                  <div key={field.id} className={`flex items-center gap-2 ${field.value ? '' : ''}`}>
                    {field.type === 'phone' && <Phone size={12} className="text-[--text-secondary]" />}
                    {field.type === 'email' && <Mail size={12} className="text-[--text-secondary]" />}
                    {field.type === 'telegram' && <MessageSquare size={12} className="text-[--text-secondary]" />}
                    {field.type === 'whatsapp' && <Send size={12} className="text-[--text-secondary]" />}
                    {field.type === 'signal' && <ShieldCheck size={12} className="text-[--text-secondary]" />}
                    {field.type === 'signalv2v' && <ShieldCheck size={12} className="text-[--text-secondary]" />}
                    {field.type === 'signalv2v' || field.type === 'signal' ? (
                      <span className="text-xs text-[--text-primary]">
                        {field.label || field.type}: {field.value}
                      </span>
                    ) : (
                      <span className="text-xs text-[--text-primary]">
                        {field.label || field.type}: {field.value}
                      </span>
                    )}
                    {(field.type === 'telegram' || field.type === 'whatsapp' || field.type === 'signal' || field.type === 'signalv2v') && field.value && (
                      <a
                        href={
                          field.type === 'telegram' ? `https://t.me/${field.value.replace('@', '')}` :
                          field.type === 'whatsapp' ? `https://wa.me/${field.value.replace(/[^0-9+]/g, '')}` :
                          field.type === 'signal' || field.type === 'signalv2v' ? `https://signal.me/invite/${field.value}` :
                          undefined
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all"
                      >
                        {t('contacts.open')}
                      </a>
                    )}
                  </div>
                ))}
                <div className="text-[9px] mt-1 text-[--text-tertiary]">
                  {t('contacts.localFieldsNotShared')}
                </div>
              </div>
            )}

            <div className="w-full mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { onCall?.(); onClose(); }} className="h-14 rounded-md flex flex-col items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white transition-colors active:scale-95 shadow-lg shadow-green-500/20">
                  <Phone size={20} fill="currentColor" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.call')}</span>
                </button>
                <button onClick={() => { onVideoCall?.(); onClose(); }} className="h-14 rounded-md flex flex-col items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors active:scale-95 shadow-lg shadow-emerald-500/20">
                  <Video size={20} fill="currentColor" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.videoCall')}</span>
                </button>
              </div>
              <button onClick={() => { onMessage?.(); onClose(); }} className="w-full h-14 rounded-md flex flex-col items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white transition-colors active:scale-95 shadow-lg shadow-blue-500/20">
                <MessageSquare size={20} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.message')}</span>
              </button>
              <button onClick={() => setShowSafetyNumber(true)} title={t('contacts.verifySecurityDesc')} className={`w-full h-10 rounded-md flex items-center justify-center gap-2 transition-colors active:scale-95 neu-card-inset`}>
                <ShieldCheck size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{t('contacts.verifySecurity')}</span>
              </button>
            </div>

            <AnimatePresence>
              {showSafetyNumber && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                >
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSafetyNumber(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    className="relative w-full max-w-sm rounded-md shadow-2xl p-6 border modal-surface"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h3 className="text-lg font-bold mb-2 text-[--text-primary]">{t('contacts.safetyNumbersTitle')}</h3>
                    <p className="text-xs mb-4 text-[--text-secondary]">
                      {t('contacts.safetyNumbersDesc', { name: contact?.name })}
                    </p>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-4">
                      {safetyNumber.split(' ').map((g, i) => (
                        <span key={i} className="font-mono text-sm tracking-wider px-2 py-0.5 rounded neu-badge">{g}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getVerificationColor(verifyLevel) }} />
                      <span className="text-xs text-[--text-secondary]">
                        {t('contacts.verificationLevel', { level: verifyLevel })}
                      </span>
                    </div>
                    {myPeerId && (
                      <div className="text-[10px] font-mono mb-4 p-2 rounded-lg neu-card-inset">
                        {t('contacts.yourId')} {myPeerId.slice(0, 16)}...
                        <br />
                        {t('contacts.theirId')} {contact?.id.slice(0, 16)}...
                      </div>
                    )}
                    <button onClick={() => setShowSafetyNumber(false)} className="w-full h-11 rounded-md text-sm font-bold transition-colors active:scale-95 neu-button">
                      {t('contacts.close')}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
