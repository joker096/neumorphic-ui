import React from "react";
import { ListFilter, Mic } from "lucide-react";
import { useI18n } from "../../lib/i18n";

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
  t: (key: string, options?: any) => string;
}

export const ChatMediaPanel = ({
  isDark, showMediaPanel, showFilterMenu, setShowFilterMenu,
  filterBySender, setFilterBySender, filterStartDate, setFilterStartDate,
  filterEndDate, setFilterEndDate, mediaTab, setMediaTab,
  mediaItems, setActivePhotoUrl, setPhotoOpen, t,
}: ChatMediaPanelProps) => {
  if (!showMediaPanel) return null;

  return (
    <>
      <div className={`px-3 sm:px-5 pt-3 sm:pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none ${isDark ? "bg-[var(--bg-tertiary)]/60" : "bg-[var(--bg-primary)]/60"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold whitespace-nowrap transition-colors ${showFilterMenu ? "bg-orange-500 text-[var(--text-primary)]" : isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}
          >
            <ListFilter size={14} />
          </button>
          {(filterBySender || filterStartDate || filterEndDate) && (
            <button onClick={() => { setFilterBySender(""); setFilterStartDate(""); setFilterEndDate(""); }}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-colors ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500"}`}
            >
              {t('chat.filters.clear')}
            </button>
          )}
          <div className={`ml-auto text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-slate-400"}`}>
            {t('chat.filters.items', { count: mediaItems.length })}
          </div>
        </div>

        {showFilterMenu && (
          <div className={`space-y-2 pb-2 border-b ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`}>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.filters.from')}</span>
              {['', 'me', 'them'].map((v) => (
                <button key={v} onClick={() => setFilterBySender(v)}
                  className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === v ? "bg-green-500 text-[var(--text-primary)]" : isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}
                >
                  {v === '' ? t('chat.filters.all') : v === 'me' ? t('chat.filters.me') : t('chat.filters.others')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('chat.filters.from')}</span>
              <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={`text-[10px] ${isDark ? "text-[var(--text-primary)] bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
              <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('chat.filters.to')}</span>
              <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={`text-[10px] ${isDark ? "text-[var(--text-primary)] bg-transparent" : "text-slate-700 bg-transparent"} outline-none`} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {['all', 'photos', 'audio', 'links'].map((tab) => (
            <button key={tab} onClick={() => setMediaTab(tab)}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-bold whitespace-nowrap transition-colors ${mediaTab === tab ? "bg-orange-500 text-[var(--text-primary)] shadow-md" : isDark ? "bg-white/5 text-gray-400 hover:text-[var(--text-primary)]" : "bg-black/5 text-slate-500 hover:text-slate-800"}`}
            >
              {tab === 'all' ? t('chat.filters.mediaTabs.all') : tab === 'photos' ? t('chat.filters.mediaTabs.photos') : tab === 'audio' ? t('chat.filters.mediaTabs.audio') : t('chat.filters.mediaTabs.links')}
            </button>
          ))}
        </div>
      </div>

      {mediaItems.length > 0 && (
        <div className="px-3 sm:px-5 pb-2 sm:pb-3 overflow-x-auto scrollbar-none" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          <div className="flex gap-3">
            {mediaItems.slice(0, 6).map((msg: any) => (
              <div key={msg.id}
                className={`w-[90px] h-[64px] sm:w-[110px] sm:h-[78px] md:w-[120px] md:h-[84px] rounded-2xl overflow-hidden flex-shrink-0 relative cursor-pointer border ${isDark ? "border-[var(--border-color)] bg-white/5" : "border-[var(--border-color)] bg-white"}`}
                onClick={() => { if (msg.type === 'image') setActivePhotoUrl(msg.attachment || msg.url); setPhotoOpen(true); }}
              >
                {msg.type === 'image' ? (
                  <img src={msg.attachment || msg.url} alt="media" className="w-full h-full object-cover" />
                ) : msg.type === 'audio' ? (
                  <div className={`w-full h-full flex flex-col items-start justify-between p-3 ${isDark ? "bg-[var(--bg-tertiary)]" : "bg-slate-50"}`}>
                    <Mic size={18} className={isDark ? "text-orange-400" : "text-orange-600"} />
                    <div className={`text-[11px] font-bold ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>{t('chat.filters.voiceNote')}</div>
                    <div className={`text-[10px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{msg.duration || '0:00'}</div>
                  </div>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center p-3 text-center text-[11px] ${isDark ? "bg-[var(--bg-tertiary)] text-gray-300" : "bg-white text-slate-600"}`}>
                    <span className="break-all line-clamp-3">{msg.text}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};




