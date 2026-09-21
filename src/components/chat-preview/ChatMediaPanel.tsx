import React from "react";
import { ListFilter, Mic } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { FTR_MAGIC } from "../../lib/fileTransfer/frames";
import { useFtrBlobUrl } from "../../hooks/useFtrBlobUrl";

interface ChatMediaPanelProps {
  isDark: boolean;
  showMediaPanel: boolean;
  showFilterMenu: boolean;
  setShowFilterMenu: (v: any) => void;
  filterBySender: string;
  setFilterBySender: (v: any) => void;
  filterStartDate: string;
  setFilterStartDate: (v: any) => void;
  filterEndDate: string;
  setFilterEndDate: (v: any) => void;
  mediaTab: string;
  setMediaTab: (v: any) => void;
  mediaItems: any[];
  setActivePhotoUrl: (v: any) => void;
  setPhotoOpen: (v: any) => void;
  setActiveMediaMsg?: (msg: any) => void;
  t: (key: string, options?: any) => string;
}

export const ChatMediaPanel = ({
  isDark, showMediaPanel, showFilterMenu, setShowFilterMenu,
  filterBySender, setFilterBySender, filterStartDate, setFilterStartDate,
  filterEndDate, setFilterEndDate, mediaTab, setMediaTab,
  mediaItems, setActivePhotoUrl, setPhotoOpen, setActiveMediaMsg, t,
}: ChatMediaPanelProps) => {
  if (!showMediaPanel) return null;

  const openImage = (msg: any, url: string) => { setActiveMediaMsg?.(msg); setActivePhotoUrl(url); setPhotoOpen(true); };

  return (
    <>
      <div className={`px-3 sm:px-5 pt-3 sm:pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none ${isDark ? "bg-[var(--bg-tertiary)]/60" : "bg-[var(--bg-primary)]/60"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        <div className="flex items-center gap-2">
           <button
             onClick={() => setShowFilterMenu(!showFilterMenu)}
             aria-label={t('chat.filters.button')}
             title={t('chat.filters.button')}
             className={`min-w-11 min-h-11 rounded-full flex items-center justify-center text-xs font-bold whitespace-nowrap transition-colors ${showFilterMenu ? "bg-[var(--accent)] text-[var(--ink-on-saturate)]" : isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}
          >
            <ListFilter size={14} />
          </button>
          {(filterBySender || filterStartDate || filterEndDate) && (
            <button onClick={() => { setFilterBySender(""); setFilterStartDate(""); setFilterEndDate(""); }}
              className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full cursor-pointer transition-transform active:scale-95"
            >
              <span className={`flex items-center px-2 sm:px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500"}`}>
                {t('chat.filters.clear')}
              </span>
            </button>
          )}
          <div className={`ml-auto text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-slate-400"}`}>
            {t('chat.filters.items', { count: mediaItems.length })}
          </div>
        </div>

        {showFilterMenu && (
          <div className={`space-y-2 pb-2 border-b ${"border-[var(--border-color)]"}`}>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className={`text-xs font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.filters.from')}</span>
              {['', 'me', 'them'].map((v) => (
                <button key={v} onClick={() => setFilterBySender(v)} aria-pressed={filterBySender === v}
                  className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full cursor-pointer transition-transform active:scale-95"
                >
                  <span className={`flex items-center px-3 py-0.5 rounded-full text-xs transition-colors ${filterBySender === v ? "bg-green-500 text-[var(--ink-on-saturate)]" : isDark ? "bg-white/5 text-gray-400 group-hover:bg-white/10" : "bg-black/5 text-slate-500 group-hover:bg-black/10"}`}>
                    {v === '' ? t('chat.filters.all') : v === 'me' ? t('chat.filters.me') : t('chat.filters.others')}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.filters.from')}</span>
              <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={`text-xs ${isDark ? "text-[var(--text-primary)] bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
              <span className={`text-xs ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('chat.filters.to')}</span>
              <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={`text-xs ${isDark ? "text-[var(--text-primary)] bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {['all', 'photos', 'audio', 'links'].map((tab) => (
            <button key={tab} onClick={() => setMediaTab(tab)} aria-pressed={mediaTab === tab}
              className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full cursor-pointer transition-transform active:scale-95"
            >
              <span className={`flex items-center px-3 sm:px-4 py-0.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${mediaTab === tab ? "bg-[var(--accent)] text-[var(--ink-on-saturate)] shadow-md" : isDark ? "bg-white/5 text-gray-400 group-hover:text-[var(--text-primary)] group-hover:bg-white/10" : "bg-black/5 text-slate-500 group-hover:text-slate-800 group-hover:bg-black/10"}`}>
                {tab === 'all' ? t('chat.filters.mediaTabs.all') : tab === 'photos' ? t('chat.filters.mediaTabs.photos') : tab === 'audio' ? t('chat.filters.mediaTabs.audio') : t('chat.filters.mediaTabs.links')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {mediaItems.length > 0 && (
        <div className="px-3 sm:px-5 pb-2 sm:pb-3 overflow-x-auto scrollbar-none" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          <div className="flex gap-3">
{mediaItems.slice(0, 6).map((msg: any) => {
              if (msg.type === 'image') {
                return (
                  <MediaImageTile
                    key={msg.id}
                    msg={msg}
                    onOpen={openImage}
                  />
                );
              }
              return (
              <div key={msg.id}
                role="button"
                tabIndex={0}
                aria-label={t('chat.filters.openItem')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPhotoOpen(true);
                  }
                }}
                className={`w-[90px] h-[64px] sm:w-[110px] sm:h-[78px] md:w-[120px] md:h-[84px] rounded-2xl overflow-hidden flex-shrink-0 relative cursor-pointer border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${isDark ? "border-[var(--border-color)] bg-white/5" : "border-[var(--border-color)] bg-white"}`}
                onClick={() => setPhotoOpen(true)}
              >
                {msg.type === 'audio' ? (
                  <div className={`w-full h-full flex flex-col items-start justify-between p-3 ${isDark ? "bg-[var(--bg-tertiary)]" : "bg-slate-50"}`}>
                     <Mic size={18} className={"text-[var(--accent)]"} />
                    <div className={`text-xs font-bold ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{t('chat.filters.voiceNote')}</div>
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{msg.duration || '0:00'}</div>
                  </div>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center p-3 text-center text-xs ${isDark ? "bg-[var(--bg-tertiary)] text-gray-300" : "bg-white text-slate-600"}`}>
                    <span className="break-all line-clamp-3">{msg.text}</span>
                  </div>
                )}
              </div>
);
            })}
          </div>
        </div>
      )}
    </>
  );
};

const MediaImageTile = ({ msg, onOpen }: { msg: any; onOpen: (msg: any, url: string) => void }) => {
  const { t } = useI18n();
  const ftrId =
    typeof msg.attachment === 'string' && msg.attachment.startsWith(FTR_MAGIC)
      ? (typeof msg.fileTransferId === 'string' ? msg.fileTransferId : msg.attachment.slice(FTR_MAGIC.length))
      : null;
  const ftrUrl = useFtrBlobUrl(ftrId);
  const src = ftrId ? ftrUrl : (msg.attachment || msg.url);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('chat.filters.openImage')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (src) onOpen(msg, src);
        }
      }}
      className="w-[90px] h-[64px] sm:w-[110px] sm:h-[78px] md:w-[120px] md:h-[84px] rounded-2xl overflow-hidden flex-shrink-0 relative cursor-pointer border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] border-[var(--border-color)]"
      onClick={() => { if (src) onOpen(msg, src); }}
    >
      {src ? (
        <img src={src} alt={msg.text ? `Shared image: ${msg.text}` : "Shared image"} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full animate-pulse bg-white/10" />
      )}
    </div>
  );
};




