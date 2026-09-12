import { useEffect, useState } from "react";
import { Play, FileText, ImageOff, VideoOff } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useAppStore } from "../../store";
import { VoiceWaveform } from "./VoiceWaveform";
import { formatSize } from "../../utils/formatSize";
import { StoryCard } from "../stories/StoryCard";

interface AttachmentMediaProps {
  msg: any;
  isMe: boolean;
  isDark: boolean;
  stickerSrc: string | null;
  onSetActivePhotoUrl: (url: string) => void;
  onSetPhotoOpen: (open: boolean) => void;
  onSetVideoOpen: (open: boolean) => void;
}

export function AttachmentMedia({
  msg, isMe, isDark, stickerSrc,
  onSetActivePhotoUrl, onSetPhotoOpen, onSetVideoOpen,
}: AttachmentMediaProps) {
  const { t } = useI18n();
  const mediaAutoLoad = useAppStore((s) => s.mediaAutoLoad);
  const [mediaErr, setMediaErr] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setMediaErr(false);
    setRevealed(false);
  }, [msg.attachment, msg.url, msg.thumb]);

  const autoLoadBlocked =
    mediaAutoLoad === "Off" || (mediaAutoLoad === "Wi-Fi" && !navigator.onLine);
  const shouldShowMedia = !autoLoadBlocked || revealed;

  if (msg.type === "story") {
    return <StoryCard story={msg.story} />;
  }

  if (msg.type === "audio") {
    return <VoiceWaveform duration={msg.duration} isMe={isMe} isDark={isDark} audioUrl={msg.audioUrl} />;
  }

  if (msg.type === "sticker") {
    return (
      <div className="flex items-center justify-center">
        {stickerSrc ? (
          <img src={stickerSrc} alt={t("a11y.sticker")} className="w-auto h-auto max-w-[3rem] max-h-[3rem] sm:max-w-[3.5rem] sm:max-h-[3.5rem] object-contain" loading="eager" decoding="async" />
        ) : (
          <span className="text-[32px] leading-none">{msg.text}</span>
        )}
      </div>
    );
  }

  if (msg.type === "image") {
    const src = msg.attachment || msg.url;
    if (!src || mediaErr || !shouldShowMedia) {
      return (
        <div className={`flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] mb-1 py-6 text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          <ImageOff size={18} />
          <span>{t("chat.attachmentUnavailable", "Attachment unavailable")}</span>
          {autoLoadBlocked && (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="min-h-11 px-3 rounded-lg bg-[var(--accent)] text-[var(--ink-on-saturate)] text-xs font-semibold"
            >
              {t("chat.loadAttachment", "Load")}
            </button>
          )}
        </div>
      );
    }
    return (
      <>
        <div
          className="rounded-xl overflow-hidden mb-1 relative border border-[var(--border-color)] cursor-pointer"
          onClick={() => { onSetActivePhotoUrl(src); onSetPhotoOpen(true); }}
        >
          <img src={src} alt={msg.text ? t("chat.sharedImageText", { text: msg.text }) : t("chat.sharedImage")} className="w-full h-auto object-cover max-h-[240px] sm:max-h-[280px] md:max-h-[320px]" onError={() => setMediaErr(true)} />
        </div>
        <div className={`mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}>
          <span>{t('chat.filters.photo')}</span>
          {src && <span className="opacity-70">{t('chat.filters.ready')}</span>}
        </div>
      </>
    );
  }

  if (msg.type === "video") {
    const thumb = msg.thumb;
    if (!thumb || mediaErr || !shouldShowMedia) {
      return (
        <div className={`flex items-center justify-center gap-2 rounded-[12px] border border-[var(--border-color)] mb-1 py-6 text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          <VideoOff size={18} />
          <span>{t("chat.attachmentUnavailable", "Attachment unavailable")}</span>
          {autoLoadBlocked && (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="min-h-11 px-3 rounded-lg bg-[var(--accent)] text-[var(--ink-on-saturate)] text-xs font-semibold"
            >
              {t("chat.loadAttachment", "Load")}
            </button>
          )}
        </div>
      );
    }
    return (
      <div
        className="rounded-[12px] overflow-hidden mb-1 relative border border-[var(--border-color)] group cursor-pointer"
        onClick={() => onSetVideoOpen(true)}
      >
        <img src={thumb} alt={t("a11y.videoThumbnail")} className="w-full h-auto sm:w-[180px] sm:h-[100px] md:w-[200px] md:h-[120px] object-cover opacity-80" onError={() => setMediaErr(true)} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform">
            <Play size={20} className="text-[var(--text-primary)] fill-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-xs font-bold text-[var(--text-primary)] tracking-wider">{msg.duration}</div>
      </div>
    );
  }

  if (msg.type === "file") {
    const size = typeof msg.fileSize === "number" && msg.fileSize > 0 ? formatSize(msg.fileSize) : null;
    const sub = [msg.text, size].filter(Boolean).join("  ·  ");
    return (
      <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-2 ${isDark ? "bg-white/5 border-[var(--border-color)]" : "bg-slate-100 border-[var(--border-color)]"}`}>
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10 text-gray-300" : "bg-white text-slate-500"}`}>
          <FileText size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{msg.fileName || t("chat.file")}</div>
          {sub && <div className={`text-xs truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{sub}</div>}
          {!msg.attachment && (
            <div className={`text-xs truncate ${isDark ? "text-rose-400" : "text-rose-500"}`}>{t("chat.attachmentUnavailable", "Attachment unavailable")}</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
