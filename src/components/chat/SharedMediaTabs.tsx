import { useState } from 'react';
import { Image as ImageIcon, FileText, Link as LinkIcon, Mic } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { DataState } from '../ui/DataState';

interface SharedMediaTabsProps {
  messages: any[];
  isDark: boolean;
  onOpenChat?: () => void;
}

const TABS = [
  { id: 'media', label: 'profile.tab.media', fallback: 'Media', icon: <ImageIcon size={14} /> },
  { id: 'files', label: 'profile.tab.files', fallback: 'Files', icon: <FileText size={14} /> },
  { id: 'links', label: 'profile.tab.links', fallback: 'Links', icon: <LinkIcon size={14} /> },
  { id: 'voice', label: 'profile.tab.voice', fallback: 'Voice', icon: <Mic size={14} /> },
];

export const SharedMediaTabs = ({ messages, isDark, onOpenChat }: SharedMediaTabsProps) => {
  const { t } = useI18n();
  const [active, setActive] = useState('media');

  const media = messages.filter((m: any) => m.type === 'image' || m.type === 'video');
  const files = messages.filter((m: any) => m.type === 'file');
  const voice = messages.filter((m: any) => m.type === 'audio');
  const links = messages.flatMap((m: any) =>
    typeof m.text === 'string'
      ? (m.text.match(/https?:\/\/[^\s]+/gi) ?? []).map((url: string) => ({ id: `${m.id}_${url}`, url }))
      : [],
  );

  const boxClass = isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm";
  const textClass = isDark ? "text-[var(--text-primary)]" : "text-slate-900";
  const iconBoxClass = isDark ? "bg-white/5" : "bg-slate-100";

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-xl cursor-pointer shrink-0"
          >
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${active === tab.id ? "bg-[var(--accent)] text-[var(--button-primary-text)]" : (isDark ? "bg-white/5 text-gray-300 group-hover:bg-white/10" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200")}`}>
              {tab.icon} {t(tab.label, tab.fallback)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        {active === 'media' && (
          media.length === 0 ? (
            <DataState status="empty" isDark={isDark} title={t('profile.noMedia', 'No media yet')} action={onOpenChat ? { label: t('chat.openChat', 'Open chat'), onClick: onOpenChat } : undefined} />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {media.map((m: any) => {
                const src = m.attachment || m.url || m.thumb;
                return (
                  <div key={String(m.id)} className="aspect-square rounded-xl overflow-hidden border border-[var(--border-color)]">
                    {src ? (
                      <img src={src} alt={m.text || t('profile.tab.media', 'Media')} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full ${iconBoxClass}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
        {active === 'files' && (
          files.length === 0 ? (
            <DataState status="empty" isDark={isDark} title={t('profile.noFiles', 'No files yet')} action={onOpenChat ? { label: t('chat.openChat', 'Open chat'), onClick: onOpenChat } : undefined} />
          ) : (
            <div className={`rounded-xl overflow-hidden ${boxClass}`}>
              {files.map((m: any) => (
                <MediaRow key={String(m.id)} icon={<FileText size={16} />} label={m.fileName || m.text || t('profile.noFiles', 'File')} isDark={isDark} iconBoxClass={iconBoxClass} textClass={textClass} />
              ))}
            </div>
          )
        )}
        {active === 'links' && (
          links.length === 0 ? (
            <DataState status="empty" isDark={isDark} title={t('profile.noLinks', 'No links yet')} action={onOpenChat ? { label: t('chat.openChat', 'Open chat'), onClick: onOpenChat } : undefined} />
          ) : (
            <div className={`rounded-xl overflow-hidden ${boxClass}`}>
              {links.map((l: any) => (
                <MediaRow key={l.id} icon={<LinkIcon size={16} />} label={l.url} isDark={isDark} iconBoxClass={iconBoxClass} textClass={textClass} />
              ))}
            </div>
          )
        )}
        {active === 'voice' && (
          voice.length === 0 ? (
            <DataState status="empty" isDark={isDark} title={t('profile.noVoice', 'No voice messages')} action={onOpenChat ? { label: t('chat.openChat', 'Open chat'), onClick: onOpenChat } : undefined} />
          ) : (
            <div className={`rounded-xl overflow-hidden ${boxClass}`}>
              {voice.map((m: any) => (
                <MediaRow key={String(m.id)} icon={<Mic size={16} />} label={m.duration || t('profile.noVoice', 'Voice message')} isDark={isDark} iconBoxClass={iconBoxClass} textClass={textClass} />
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
};

const MediaRow = ({ icon, label, isDark, iconBoxClass, textClass }: { icon: React.ReactNode; label: string; isDark: boolean; iconBoxClass: string; textClass: string }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBoxClass}`}>{icon}</div>
      <span className={`text-sm truncate ${textClass}`}>{label}</span>
    </div>
  </div>
);


