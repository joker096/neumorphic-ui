import { useState } from 'react';
import { Image as ImageIcon, FileText, Link as LinkIcon, Mic } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { FTR_MAGIC } from '../../lib/fileTransfer/frames';
import { useFtrBlobUrl } from '../../hooks/useFtrBlobUrl';
import { DataState } from '../ui/DataState';
import { MEDIA_COVER_CLASS } from "../ui/mediaClasses";

interface SharedMediaTabsProps {
  messages: any[];
  onOpenChat?: () => void;
}

const TABS = [
  { id: 'media', label: 'profile.tab.media', fallback: 'Media', icon: <ImageIcon size={14} /> },
  { id: 'files', label: 'profile.tab.files', fallback: 'Files', icon: <FileText size={14} /> },
  { id: 'links', label: 'profile.tab.links', fallback: 'Links', icon: <LinkIcon size={14} /> },
  { id: 'voice', label: 'profile.tab.voice', fallback: 'Voice', icon: <Mic size={14} /> },
];

const BOX = 'rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-tertiary)]';
const ICON_BOX = 'bg-[var(--msg-bg-panel)]';

export const SharedMediaTabs = ({ messages, onOpenChat }: SharedMediaTabsProps) => {
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

  const emptyAction = onOpenChat ? { label: t('chat.openChat', 'Open chat'), onClick: onOpenChat } : undefined;

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            aria-pressed={active === tab.id}
            className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-xl cursor-pointer shrink-0"
          >
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${active === tab.id ? "bg-[var(--accent)] text-[var(--ink-on-saturate)]" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] group-hover:bg-[var(--msg-bg-panel-hover)]"}`}>
              {tab.icon} {t(tab.label, tab.fallback)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        {active === 'media' && (
          media.length === 0 ? (
            <DataState status="empty" title={t('profile.noMedia', 'No media yet')} action={emptyAction} />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {media.map((m: any) => (
                <MediaTile key={String(m.id)} msg={m} />
              ))}
            </div>
          )
        )}
        {active === 'files' && (
          files.length === 0 ? (
            <DataState status="empty" title={t('profile.noFiles', 'No files yet')} action={emptyAction} />
          ) : (
            <div className={BOX}>
              {files.map((m: any) => (
                <MediaRow key={String(m.id)} icon={<FileText size={16} />} label={m.fileName || m.text || t('profile.noFiles', 'File')} />
              ))}
            </div>
          )
        )}
        {active === 'links' && (
          links.length === 0 ? (
            <DataState status="empty" title={t('profile.noLinks', 'No links yet')} action={emptyAction} />
          ) : (
            <div className={BOX}>
              {links.map((l: any) => (
                <MediaRow key={l.id} icon={<LinkIcon size={16} />} label={l.url} />
              ))}
            </div>
          )
        )}
        {active === 'voice' && (
          voice.length === 0 ? (
            <DataState status="empty" title={t('profile.noVoice', 'No voice messages')} action={emptyAction} />
          ) : (
            <div className={BOX}>
              {voice.map((m: any) => (
                <MediaRow key={String(m.id)} icon={<Mic size={16} />} label={m.duration || t('profile.noVoice', 'Voice message')} />
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
};

const MediaTile = ({ msg }: { msg: any }) => {
  const { t } = useI18n();
  const ftrId =
    typeof msg.attachment === 'string' && msg.attachment.startsWith(FTR_MAGIC)
      ? (typeof msg.fileTransferId === 'string' ? msg.fileTransferId : msg.attachment.slice(FTR_MAGIC.length))
      : null;
  const ftrEntry = useFtrBlobUrl(ftrId);
  const src = ftrId ? ftrEntry?.url : (msg.attachment || msg.url || msg.thumb);
  return (
    <div className="aspect-square rounded-xl overflow-hidden border border-[var(--border-color)]">
      {src ? (
        <img src={src} alt={msg.text || t('profile.tab.media', 'Media')} className={MEDIA_COVER_CLASS} />
      ) : (
        <div className={`w-full h-full ${ICON_BOX}`} />
      )}
    </div>
  );
};

const MediaRow = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-[var(--border-color)]">
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ICON_BOX}`}>{icon}</div>
      <span className="text-sm truncate text-[var(--text-primary)]">{label}</span>
    </div>
  </div>
);
