import { useEffect, useState } from "react";
import { Play, FileText, ImageOff, VideoOff, Download } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useAppStore } from "../../store";
import { FTR_MAGIC } from "../../lib/fileTransfer/frames";
import { getTransferMeta, getTransferBlob } from "../../lib/fileTransfer/fileStore";
import { sha256Hex } from "../../lib/fileTransfer/integrity";
import { VoiceWaveform } from "./VoiceWaveform";
import { formatSize } from "../../utils/formatSize";
import { StoryCard } from "../stories/StoryCard";

/**
 * Page-level blob URL cache for `ftr1:` P2P transfers. The blob is assembled
 * from IndexedDB once per page; URLs are intentionally not revoked on unmount
 * (the media viewer may outlive the message row).
 */
const ftrBlobCache = new Map<string, { url: string; shaOk: boolean }>();

const FTR_POLL_MS = 500;
const FTR_POLL_MAX = 60;

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
  const [ftrReady, setFtrReady] = useState(false);
  const [ftrUrl, setFtrUrl] = useState<string | null>(null);

  const ftrId = typeof msg.attachment === "string" && msg.attachment.startsWith(FTR_MAGIC)
    ? (typeof msg.fileTransferId === "string" ? msg.fileTransferId : msg.attachment.slice(FTR_MAGIC.length))
    : null;

  useEffect(() => {
    setMediaErr(false);
    setRevealed(false);
    setFtrReady(false);
    setFtrUrl(null);
  }, [msg.attachment, msg.url, msg.thumb]);

  const autoLoadBlocked =
    mediaAutoLoad === "Off" || (mediaAutoLoad === "Wi-Fi" && !navigator.onLine);
  const shouldShowMedia = !autoLoadBlocked || revealed;

  const ftrActive = Boolean(ftrId) && (!autoLoadBlocked || revealed);

  useEffect(() => {
    if (!ftrId || !ftrActive) return;
    const cached = ftrBlobCache.get(ftrId);
    if (cached) {
      setFtrReady(true);
      setFtrUrl(cached.url);
      if (!cached.shaOk) setMediaErr(true);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;
    const assemble = async () => {
      try {
        const meta = await getTransferMeta(ftrId);
        if (cancelled || !meta) return;
        if (!meta.completed) {
          attempts += 1;
          if (attempts < FTR_POLL_MAX) timer = window.setTimeout(() => { void assemble(); }, FTR_POLL_MS);
          return;
        }
        const blob = await getTransferBlob(ftrId, meta.totalChunks);
        if (!blob || cancelled) return;
        let shaOk = true;
        if (meta.sha256) {
          try {
            shaOk = (await sha256Hex(await blob.arrayBuffer())) === meta.sha256;
          } catch {
            shaOk = false;
          }
        }
        const entry = { url: URL.createObjectURL(blob), shaOk };
        ftrBlobCache.set(ftrId, entry);
        if (cancelled) return;
        setFtrReady(true);
        setFtrUrl(entry.url);
        if (!shaOk) setMediaErr(true);
      } catch {
        if (!cancelled) setMediaErr(true);
      }
    };
    void assemble();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [ftrId, ftrActive]);

  const ftrSize = typeof msg.fileSize === "number" && msg.fileSize > 0 ? formatSize(msg.fileSize) : null;
  const ftrPendingRow = (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-2 ${isDark ? "bg-white/5 border-[var(--border-color)]" : "bg-slate-100 border-[var(--border-color)]"}`}>
      <span aria-hidden="true" className={`shrink-0 w-5 h-5 border-2 rounded-full animate-spin border-t-transparent ${isDark ? "border-gray-400" : "border-slate-400"}`} />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{msg.fileName || t("chat.file")}</div>
        {ftrSize && <div className={`text-xs truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{ftrSize}</div>}
      </div>
    </div>
  );

  const ftrPending = Boolean(ftrId) && !ftrReady && !mediaErr;
  const ftrReadyUrl = Boolean(ftrId) && ftrReady && ftrUrl && !mediaErr;

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
    if (ftrPending && !autoLoadBlocked) return ftrPendingRow;
    const src = ftrId ? (ftrReadyUrl ? ftrUrl : null) : (msg.attachment || msg.url);
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
    if (ftrPending && !autoLoadBlocked) return ftrPendingRow;
    if (ftrReadyUrl) {
      return (
        <div className="rounded-[12px] overflow-hidden mb-1 border border-[var(--border-color)]">
          <video src={ftrUrl || undefined} controls playsInline className="w-full h-auto max-h-[240px] sm:max-h-[280px] md:max-h-[320px]" onError={() => setMediaErr(true)} />
        </div>
      );
    }
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
    const ftrUnavailable = Boolean(ftrId) && !ftrReadyUrl && !ftrPending;
    return (
      <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-2 ${isDark ? "bg-white/5 border-[var(--border-color)]" : "bg-slate-100 border-[var(--border-color)]"}`}>
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10 text-gray-300" : "bg-white text-slate-500"}`}>
          <FileText size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{msg.fileName || t("chat.file")}</div>
          {sub && <div className={`text-xs truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{sub}</div>}
          {(!msg.attachment || ftrUnavailable) && (
            <div className={`text-xs truncate ${isDark ? "text-rose-400" : "text-rose-500"}`}>{t("chat.attachmentUnavailable", "Attachment unavailable")}</div>
          )}
        </div>
        {ftrPending ? (
          <span aria-hidden="true" className={`shrink-0 w-5 h-5 border-2 rounded-full animate-spin border-t-transparent ${isDark ? "border-gray-400" : "border-slate-400"}`} />
        ) : ftrReadyUrl ? (
          <a
            href={ftrUrl || undefined}
            download={msg.fileName || undefined}
            aria-label={t("media.downloadDoc", "Download")}
            className={`min-h-11 min-w-11 shrink-0 flex items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--ink-on-saturate)]`}
          >
            <Download size={16} />
          </a>
        ) : null}
      </div>
    );
  }

  return null;
}
