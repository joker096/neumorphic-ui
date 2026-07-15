/**
 * Media gallery/tabs component
 * Extracted from ChatPreviewLayer.tsx
 */
import React from "react";
import { ListFilter, Mic } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export interface MediaItem {
  id: number;
  sender: string;
  type: string;
  text?: string;
  attachment?: string;
  url?: string;
  duration?: string;
  thumb?: string;
}

export interface MediaGalleryProps {
  showMediaPanel: boolean;
  mediaItems: MediaItem[];
  mediaTab: "all" | "photos" | "audio" | "links";
  setMediaTab: (tab: "all" | "photos" | "audio" | "links") => void;
  filterBySender: string;
  setFilterBySender: (v: string) => void;
  filterStartDate: string;
  filterEndDate: string;
  setFilterStartDate: (v: string) => void;
  setFilterEndDate: (v: string) => void;
  showFilterMenu: boolean;
  setShowFilterMenu: (v: boolean) => void;
  setShowMediaPanel: (v: boolean) => void;
  activePhotoUrl: string | null;
  setActivePhotoUrl: (url: string | null) => void;
  setPhotoOpen: (v: boolean) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  showMediaPanel,
  mediaItems,
  mediaTab,
  setMediaTab,
  filterBySender,
  setFilterBySender,
  filterStartDate,
  filterEndDate,
  setFilterStartDate,
  setFilterEndDate,
  showFilterMenu,
  setShowFilterMenu,
  setShowMediaPanel,
  setActivePhotoUrl,
  setPhotoOpen,
}) => {
  const { t } = useI18n();

  if (!showMediaPanel) return null;

  return (
    <>
      {/* Filter buttons row */}
      <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none bg-[var(--bg-secondary)]/60" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            title={t("chat.filters.button")}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold whitespace-nowrap transition-colors`}
            aria-label={t("chat.filters.button")}
          >
            <ListFilter size={14} />
          </button>
          {(filterBySender || filterStartDate || filterEndDate) && (
            <button
              onClick={() => {
                setFilterBySender("");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-colors bg-red-500/20 text-red-400"
            >
              {t("chat.filters.clear")}
            </button>
          )}
          <div className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
            {t("chat.filters.items", { count: mediaItems.length })}
          </div>
        </div>

        {/* Filter menu */}
        {showFilterMenu && (
          <div className="space-y-2 pb-2 border-b border-[var(--border-color)]">
            {/* Sender filter */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                {t("chat.filters.from")}
              </span>
              <button
                onClick={() => setFilterBySender("")}
                className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === "" ? "bg-green-500 text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"}`}
              >
                {t("chat.filters.all")}
              </button>
              <button
                onClick={() => setFilterBySender("me")}
                className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === "me" ? "bg-green-500 text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"}`}
              >
                {t("chat.filters.me")}
              </button>
              <button
                onClick={() => setFilterBySender("them")}
                className={`px-2 py-0.5 rounded-full text-[10px] ${filterBySender === "them" ? "bg-green-500 text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"}`}
              >
                {t("chat.filters.others")}
              </button>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                {t("chat.filters.from")}
              </span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="text-[10px] text-[var(--text-primary)] bg-transparent outline-none"
              />
              <span className="text-[10px] text-[var(--text-tertiary)]">{t("chat.filters.to")}</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="text-[10px] text-[var(--text-primary)] bg-transparent outline-none"
              />
            </div>
          </div>
        )}

        {/* Media Tabs */}
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: t("chat.filters.mediaTabs.all") },
            { id: "photos", label: t("chat.filters.mediaTabs.photos") },
            { id: "audio", label: t("chat.filters.mediaTabs.audio") },
            { id: "links", label: t("chat.filters.mediaTabs.links") },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMediaTab(tab.id as "all" | "photos" | "audio" | "links")}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-bold whitespace-nowrap transition-colors ${mediaTab === tab.id ? "bg-orange-500 text-white shadow-md" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media items grid */}
      {mediaItems.length > 0 && (
        <div className="px-3 sm:px-5 pb-2 sm:pb-3 overflow-x-auto scrollbar-none" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          <div className="flex gap-3">
            {mediaItems.slice(0, 6).map((msg: any) => (
              <div
                key={msg.id}
                className="w-[90px] h-[64px] sm:w-[110px] sm:h-[78px] md:w-[120px] md:h-[84px] rounded-md overflow-hidden flex-shrink-0 relative cursor-pointer border border-[var(--border-color)] bg-[var(--bg-elevated)]"
                onClick={() => {
                  if (msg.type === "image" && (msg.attachment || msg.url)) {
                    setActivePhotoUrl(msg.attachment || msg.url);
                    setPhotoOpen(true);
                  }
                }}
              >
                {msg.type === "image" ? (
                  <img src={msg.attachment || msg.url} alt="media" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : msg.type === "audio" ? (
                  <div className="w-full h-full flex flex-col items-start justify-between p-3 bg-[var(--bg-secondary)]">
                    <Mic size={18} className="text-[var(--accent)]" />
                    <div className="text-[11px] font-bold text-[var(--text-primary)]">
                      {t("chat.filters.voiceNote")}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {msg.duration || "0:00"}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 text-center text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
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
