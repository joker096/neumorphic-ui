import { Play } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { VoiceWaveform } from "./VoiceWaveform";

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

  if (msg.type === "audio") {
    return <VoiceWaveform duration={msg.duration} isMe={isMe} isDark={isDark} audioUrl={msg.audioUrl} />;
  }

  if (msg.type === "sticker") {
    return (
      <div className="flex items-center justify-center">
        {stickerSrc ? (
          <img src={stickerSrc} alt="Sticker" className="w-auto h-auto max-w-[3rem] max-h-[3rem] sm:max-w-[3.5rem] sm:max-h-[3.5rem] object-contain" loading="eager" decoding="async" />
        ) : (
          <span className="text-3xl leading-none">{msg.text}</span>
        )}
      </div>
    );
  }

  if (msg.type === "image") {
    return (
      <>
        <div
          className="rounded-xl overflow-hidden mb-1 relative border border-[var(--border-color)] cursor-pointer"
          onClick={() => { onSetActivePhotoUrl(msg.attachment || msg.url); onSetPhotoOpen(true); }}
        >
          <img src={msg.attachment || msg.url} alt={msg.text ? `Shared image: ${msg.text}` : "Shared image"} className="w-full h-auto object-cover max-h-[240px] sm:max-h-[280px] md:max-h-[320px]" />
        </div>
        <div className={`mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}>
          <span>{t('chat.filters.photo')}</span>
          {msg.attachment && <span className="opacity-70">{t('chat.filters.ready')}</span>}
        </div>
      </>
    );
  }

  if (msg.type === "video") {
    return (
      <div
        className="rounded-[14px] overflow-hidden mb-1 relative border border-[var(--border-color)] group cursor-pointer"
        onClick={() => onSetVideoOpen(true)}
      >
        <img src={msg.thumb} alt="Video thumbnail" className="w-full h-auto sm:w-[180px] sm:h-[100px] md:w-[200px] md:h-[120px] object-cover opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform">
            <Play size={20} className="text-[var(--text-primary)] fill-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-xs font-bold text-[var(--text-primary)] tracking-wider">{msg.duration}</div>
      </div>
    );
  }

  return null;
}
