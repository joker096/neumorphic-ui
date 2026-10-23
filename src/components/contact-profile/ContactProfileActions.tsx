import { Phone, Video, MessageSquare, ShieldCheck } from 'lucide-react';

type Translate = (key: string, options?: any) => string;

interface ContactProfileActionsProps {
  onCall?: () => void;
  onVideoCall?: () => void;
  onMessage?: () => void;
  onShowSafetyNumber: () => void;
  t: Translate;
}

export const ContactProfileActions = ({
  onCall,
  onVideoCall,
  onMessage,
  onShowSafetyNumber,
  t,
}: ContactProfileActionsProps) => {
  return (
    <div className="w-full mt-6 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { onCall?.(); }}
          className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 bg-[var(--color-success-soft)] hover:bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/25"
        >
          <Phone size={20} fill="currentColor" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">{t('contacts.call')}</span>
        </button>
        <button
          onClick={() => { onVideoCall?.(); }}
          className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 bg-[var(--blue)]/15 hover:bg-[var(--blue)]/25 text-[var(--blue)] border border-[var(--blue)]/25"
        >
          <Video size={20} fill="currentColor" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">{t('contacts.videoCall')}</span>
        </button>
      </div>
      <button
        onClick={() => { onMessage?.(); }}
        className="w-full h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-[var(--ink-on-saturate)] text-[var(--accent)] border border-[var(--accent-soft)]"
      >
        <MessageSquare size={20} fill="currentColor" />
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">{t('contacts.message')}</span>
      </button>
      <button
        onClick={onShowSafetyNumber}
        title={t('contacts.verifySecurityDesc')}
        className="w-full min-h-11 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 bg-[var(--msg-bg-panel)] hover:bg-[var(--msg-bg-panel-hover)] text-[var(--text-secondary)]"
      >
        <ShieldCheck size={16} />
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">{t('contacts.verifySecurity')}</span>
      </button>
    </div>
  );
};