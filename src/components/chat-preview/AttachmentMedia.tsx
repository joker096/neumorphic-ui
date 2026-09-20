import { useEffect, useState } from "react";
import {
  Play, FileText, FileSpreadsheet, FileArchive, FileCode,
  Image as ImageIcon, Music, Film, ImageOff, VideoOff, Download,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useAppStore } from "../../store";
import { FTR_MAGIC } from "../../lib/fileTransfer/frames";
import { getTransferMeta, getTransferBlob } from "../../lib/fileTransfer/fileStore";
import { sha256Hex } from "../../lib/fileTransfer/integrity";
import { VoiceWaveform } from "./VoiceWaveform";
import { useVoiceBlobUrl } from "../../hooks/useVoiceBlobUrl";
import { formatSize } from "../../utils/formatSize";
import { getFileKind, type FileKind } from "../../utils/fileType";
import { StoryCard } from "../stories/StoryCard";

const FILE_KIND_STYLE: Record<FileKind, { Icon: LucideIcon; tint: string }> = {
  pdf: { Icon: FileText, tint: "bg-rose-500/15 text-rose-500" },
  doc: { Icon: FileText, tint: "bg-sky-500/15 text-sky-500" },
  sheet: { Icon: FileSpreadsheet, tint: "bg-emerald-500/15 text-emerald-500" },
  image: { Icon: ImageIcon, tint: "bg-violet-500/15 text-violet-500" },
  audio: { Icon: Music, tint: "bg-amber-500/15 text-amber-500" },
  video: { Icon: Film, tint: "bg-fuchsia-500/15 text-fuchsia-500" },
  archive: { Icon: FileArchive, tint: "bg-orange-500/15 text-orange-500" },
  code: { Icon: FileCode, tint: "bg-cyan-500/15 text-cyan-500" },
  other: { Icon: FileText, tint: "bg-slate-500/15 text-slate-400" },
};

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
  const voiceUrl = useVoiceBlobUrl(msg.voiceId, msg.audioUrl);
  const [albumFailed, setAlbumFailed] = useState<number[]>([]);

  const ftrId = typeof msg.attachment === "string" && msg.attachment.startsWith(FTR_MAGIC)
    ? (typeof msg.fileTransferId === "string" ? msg.fileTransferId : msg.attachment.slice(FTR_MAGIC.length))
    : null;

  useEffect(() => {
    setMediaErr(false);
    setRevealed(false);
    setFtrReady(false);
    setFtrUrl(null);
    setAlbumFailed([]);
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
    return <VoiceWaveform duration={msg.duration} isMe={isMe} isDark={isDark} audioUrl={voiceUrl} name={String(msg.sender || "")} />;
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
    const albumItems = Array.isArray(msg.album) && msg.album.length > 1
      ? (msg.album.filter((it: any) => it && typeof it.url === "string") as Array<{ url: string }>)
      : null;
    if (albumItems && albumItems.length > 1) {
      if (!shouldShowMedia) {
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
      const shown = albumItems.slice(0, 4);
      const remaining = albumItems.length - shown.length;
      return (
        <div
          className="grid grid-cols-2 gap-1 rounded-[var(--message-radius)] overflow-hidden mb-1 border border-[var(--border-color)] inline-block max-w-full cursor-pointer w-[260px] sm:w-[300px]"
          onClick={() => { onSetActivePhotoUrl(shown[0]!.url); onSetPhotoOpen(true); }}
        >
          {shown.map((it: any, i: number) => {
            const isFailed = albumFailed.includes(i);
            return (
              <div key={`${it.url}-${i}`} className="relative aspect-square overflow-hidden">
                {!isFailed ? (
                  <img
                    src={it.url}
                    alt={msg.text ? t("chat.sharedImageText", { text: msg.text }) : t("chat.sharedImage")}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => setAlbumFailed((prev) => (prev.includes(i) ? prev : [...prev, i]))}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--msg-bg-panel)]">
                    <ImageOff size={18} className="text-[var(--text-tertiary)]" />
                  </div>
                )}
                {i === shown.length - 1 && remaining > 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">+{remaining}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
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
      <div
        className="rounded-[var(--message-radius)] overflow-hidden mb-1 relative border border-[var(--border-color)] cursor-pointer inline-block max-w-full"
        onClick={() => { onSetActivePhotoUrl(src); onSetPhotoOpen(true); }}
      >
        <img
          src={src}
          alt={msg.text ? t("chat.sharedImageText", { text: msg.text }) : t("chat.sharedImage")}
          className="block w-auto h-auto max-w-[320px] sm:max-w-[360px] md:max-w-[420px] max-h-[240px] sm:max-h-[300px] md:max-h-[360px] object-contain"
          onError={() => setMediaErr(true)}
        />
        {ftrSize && (
          <div className="pointer-events-none absolute bottom-2 right-2 bg-[rgba(0,0,0,0.45)] backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-semibold text-white tracking-wider">
            {ftrSize}
          </div>
        )}
      </div>
    );
  }

  if (msg.type === "video") {
    if (ftrPending && !autoLoadBlocked) return ftrPendingRow;
    if (ftrReadyUrl) {
      return (
        <div className="rounded-[var(--message-radius)] overflow-hidden mb-1 border border-[var(--border-color)] inline-block max-w-full">
          <video
            src={ftrUrl || undefined}
            controls
            playsInline
            className="block w-[320px] sm:w-[400px] max-w-full h-auto max-h-[240px] sm:max-h-[300px] md:max-h-[360px] bg-black"
            onError={() => setMediaErr(true)}
          />
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
        className="rounded-[var(--message-radius)] overflow-hidden mb-1 relative border border-[var(--border-color)] group cursor-pointer inline-block max-w-full"
        onClick={() => onSetVideoOpen(true)}
      >
        <img
          src={thumb}
          alt={t("a11y.videoThumbnail")}
          className="block aspect-video object-cover w-[240px] sm:w-[300px] md:w-[360px] max-w-full"
          onError={() => setMediaErr(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
          <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
            <Play size={24} className="text-white fill-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-semibold text-white tracking-wider">{msg.duration}</div>
      </div>
    );
  }

  if (msg.type === "file") {
    const size = typeof msg.fileSize === "number" && msg.fileSize > 0 ? formatSize(msg.fileSize) : null;
    const sub = [msg.text, size].filter(Boolean).join("  ·  ");
    const ftrUnavailable = Boolean(ftrId) && !ftrReadyUrl && !ftrPending;
    const { Icon: KindIcon, tint: kindTint } = FILE_KIND_STYLE[getFileKind(msg.fileName, msg.mime)];
    return (
      <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-2 ${isDark ? "bg-white/5 border-[var(--border-color)]" : "bg-slate-100 border-[var(--border-color)]"}`}>
        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${kindTint}`}>
          <KindIcon size={20} />
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
