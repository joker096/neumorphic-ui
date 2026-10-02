import { useEffect, useState } from "react";
import { Play, ImageOff, VideoOff } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useAppStore } from "../../store";
import { FTR_MAGIC } from "../../lib/fileTransfer/frames";
import { VoiceWaveform } from "./VoiceWaveform";
import { GeoMessageCard } from "./GeoMessageCard";
import { useVoiceBlobUrl } from "../../hooks/useVoiceBlobUrl";
import { useFtrBlobUrl } from "../../hooks/useFtrBlobUrl";
import { formatSize } from "../../utils/formatSize";
import { StoryCard } from "../stories/StoryCard";
import { AlbumGrid } from "./attachments/AlbumGrid";
import { AttachmentUnavailable } from "./attachments/AttachmentUnavailable";
import { FileAttachmentRow } from "./attachments/FileAttachmentRow";
import { ArticleMessageCard } from "./attachments/ArticleMessageCard";

interface AttachmentMediaProps {
  msg: any;
  isMe: boolean;
  isDark: boolean;
  stickerSrc: string | null;
  onSetActivePhotoUrl: (url: string) => void;
  onSetPhotoOpen: (open: boolean) => void;
  onSetVideoOpen: (open: boolean) => void;
  onSetActiveMediaMsg?: (msg: any) => void;
}

export function AttachmentMedia({
  msg, isMe, isDark, stickerSrc,
  onSetActivePhotoUrl, onSetPhotoOpen, onSetVideoOpen, onSetActiveMediaMsg,
}: AttachmentMediaProps) {
  const { t } = useI18n();
  const mediaAutoLoad = useAppStore((s) => s.mediaAutoLoad);
  const [mediaErr, setMediaErr] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const voiceUrl = useVoiceBlobUrl(msg.voiceId, msg.audioUrl);
  const [albumFailed, setAlbumFailed] = useState<number[]>([]);

  const ftrId = typeof msg.attachment === "string" && msg.attachment.startsWith(FTR_MAGIC)
    ? (typeof msg.fileTransferId === "string" ? msg.fileTransferId : msg.attachment.slice(FTR_MAGIC.length))
    : null;

  const autoLoadBlocked =
    mediaAutoLoad === "Off" || (mediaAutoLoad === "Wi-Fi" && !navigator.onLine);
  const shouldShowMedia = !autoLoadBlocked || revealed;
  const reveal = () => setRevealed(true);

  // one shared cache (fileStore) serves every consumer, so the blob behind a
  // resolved transfer is assembled once per page instead of once per call site
  const ftrEntry = useFtrBlobUrl(ftrId, Boolean(ftrId) && (!autoLoadBlocked || revealed));
  const ftrReady = ftrEntry !== null;
  const ftrUrl = ftrEntry?.url ?? null;

  useEffect(() => {
    if (ftrEntry && !ftrEntry.shaOk) setMediaErr(true);
  }, [ftrEntry]);

  useEffect(() => {
    setMediaErr(false);
    setRevealed(false);
    setAlbumFailed([]);
  }, [msg.attachment, msg.url, msg.thumb]);

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
        return <AttachmentUnavailable icon={ImageOff} isDark={isDark} onReveal={autoLoadBlocked ? reveal : undefined} />;
      }
      return (
        <AlbumGrid
          items={albumItems}
          alt={msg.text ? t("chat.sharedImageText", { text: msg.text }) : t("chat.sharedImage")}
          failed={albumFailed}
          onItemError={(i) => setAlbumFailed((prev) => (prev.includes(i) ? prev : [...prev, i]))}
          onOpen={(url) => { onSetActiveMediaMsg?.(msg); onSetActivePhotoUrl(url); onSetPhotoOpen(true); }}
        />
      );
    }
    if (ftrPending && !autoLoadBlocked) return ftrPendingRow;
    const src = ftrId ? (ftrReadyUrl ? ftrUrl : null) : (msg.attachment || msg.url);
    if (!src || mediaErr || !shouldShowMedia) {
      return <AttachmentUnavailable icon={ImageOff} isDark={isDark} onReveal={autoLoadBlocked ? reveal : undefined} />;
    }
    return (
      <div
        className="rounded-[var(--message-radius)] overflow-hidden mb-1 relative border border-[var(--border-color)] cursor-pointer inline-block max-w-full"
        onClick={() => { onSetActiveMediaMsg?.(msg); onSetActivePhotoUrl(src); onSetPhotoOpen(true); }}
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
    if (msg.videoNote) {
      if (ftrPending && !autoLoadBlocked) return ftrPendingRow;
      if (ftrReadyUrl) {
        return (
          <div className="rounded-full overflow-hidden mb-1 border border-[var(--border-color)] inline-block">
            <video
              src={ftrUrl || undefined}
              controls
              playsInline
              loop
              className="block w-48 sm:w-56 aspect-square object-cover bg-black rounded-full"
              onError={() => setMediaErr(true)}
            />
          </div>
        );
      }
      if (mediaErr || !shouldShowMedia) {
        return <AttachmentUnavailable icon={VideoOff} isDark={isDark} radiusClass="rounded-full" onReveal={autoLoadBlocked ? reveal : undefined} />;
      }
      return (
        <div
          className="rounded-full overflow-hidden mb-1 relative border border-[var(--border-color)] group cursor-pointer inline-block"
          onClick={() => { onSetActiveMediaMsg?.(msg); onSetVideoOpen(true); }}
        >
          <img
            src={msg.thumb || ftrUrl || undefined}
            alt={t("a11y.videoThumbnail")}
            className="block w-48 sm:w-56 aspect-square object-cover max-w-full"
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
      return <AttachmentUnavailable icon={VideoOff} isDark={isDark} radiusClass="rounded-[12px]" onReveal={autoLoadBlocked ? reveal : undefined} />;
    }
    return (
      <div
        className="rounded-[var(--message-radius)] overflow-hidden mb-1 relative border border-[var(--border-color)] group cursor-pointer inline-block max-w-full"
        onClick={() => { onSetActiveMediaMsg?.(msg); onSetVideoOpen(true); }}
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
    return (
      <FileAttachmentRow
        msg={msg}
        isDark={isDark}
        hasTransfer={Boolean(ftrId)}
        pending={Boolean(ftrPending)}
        ready={Boolean(ftrReadyUrl)}
        url={ftrUrl}
      />
    );
  }

  if (msg.type === "location") {
    return <GeoMessageCard msg={msg} t={t} />;
  }

  if (msg.type === "article") {
    return <ArticleMessageCard msg={msg} />;
  }

  return null;
}
