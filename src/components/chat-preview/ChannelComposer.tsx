import React from "react";
import { ChevronRight, Plus, Volume2, VolumeX, X } from "lucide-react";
import { composerInputStyle, growTextarea } from "./composerInput";

/** Media staged for a not-yet-posted channel update. */
export interface PendingMedia {
  url: string;
  type: 'image' | 'video';
}

export interface ChannelComposerProps {
  isDark: boolean;
  /** Only the channel owner may post; everyone else gets a mute/unmute control. */
  isOwner: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  msgText: string;
  onMsgTextChange: (value: string) => void;
  morseMode: boolean;
  onSend: (media: PendingMedia[] | undefined) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  t: (key: string, opts?: any) => string;
}

const MEDIA_INPUT_ID = "channel-post-media-input";
const MAX_STAGED_FILES = 10;

/**
 * Composer for a channel update.
 *
 * Channels are post-only: no mentions, stickers, voice notes, articles or
 * location — the owner stages media as local object URLs and posts the batch.
 *
 * Object URL ownership: every URL this component mints while a file is *staged*
 * belongs to it and is revoked when the user drops the thumbnail or leaves the
 * composer. A URL that was **sent** is not revoked here — the posted message
 * keeps rendering that thumbnail, so ownership passes to the consumer that
 * persists it (same hand-off as the video-note recorder's URL).
 */
export function ChannelComposer({
  isDark,
  isOwner,
  isMuted,
  onToggleMute,
  msgText,
  onMsgTextChange,
  morseMode,
  onSend,
  inputRef,
  t,
}: ChannelComposerProps) {
  const [pendingMedia, setPendingMedia] = React.useState<PendingMedia[]>([]);
  /** Mirror of the staged batch, readable from the unmount cleanup. */
  const stagedRef = React.useRef<PendingMedia[]>([]);
  stagedRef.current = pendingMedia;

  React.useEffect(
    () => () => {
      for (const staged of stagedRef.current) URL.revokeObjectURL(staged.url);
    },
    [],
  );

  if (!isOwner) {
    return (
      <div className="px-4 pb-3 pt-1">
        <button
          type="button"
          onClick={onToggleMute}
          className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium text-sm tracking-wide min-w-11 min-h-11 ${
            isDark
              ? "bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg-dark)] text-[var(--accent)] border border-[var(--border-color)]"
              : "bg-white hover:bg-slate-50 text-[var(--accent)] border border-[var(--border-color)] shadow-sm"
          }`}
          aria-label={isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}
          title={isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}
        >
          {isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}</span>
        </button>
      </div>
    );
  }

  const sendPost = () => {
    if (!msgText.trim() && pendingMedia.length === 0) return;
    onSend(pendingMedia.length ? pendingMedia : undefined);
    // Ownership of these URLs moves to the sent post; the unmount cleanup must
    // not revoke them, or the posted thumbnail breaks.
    stagedRef.current = [];
    setPendingMedia([]);
  };

  const dropStaged = (index: number) => {
    const dropped = pendingMedia[index];
    if (dropped) URL.revokeObjectURL(dropped.url);
    setPendingMedia((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="px-4 pb-3 pt-1">
      {pendingMedia.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingMedia.map((media, i) => (
            <div key={`${media.url}-${i}`} className="relative w-fit">
              {media.type === 'image' ? (
                <img src={media.url} alt="" className="h-20 w-20 object-cover rounded-lg" />
              ) : (
                <video src={media.url} className="h-20 w-20 object-cover rounded-lg" />
              )}
              <button
                type="button"
                onClick={() => dropStaged(i)}
                aria-label={t('chat.removeMedia')}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="message-composer w-full flex-shrink-0 min-h-11 max-h-[132px] flex items-center gap-1">
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          id={MEDIA_INPUT_ID}
          onChange={(e) => {
            const files = [...(e.target.files || [])].slice(0, MAX_STAGED_FILES);
            if (files.length) {
              setPendingMedia((prev) => [
                ...prev,
                ...files.map((f) => ({ url: URL.createObjectURL(f), type: (f.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video' })),
              ]);
            }
            e.target.value = "";
          }}
          aria-label={t('chat.attachFile')}
        />
        <label
          htmlFor={MEDIA_INPUT_ID}
          aria-label={t('chat.attachFile')}
          className={`icon-button shrink-0 ${
            isDark ? "text-gray-400" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Plus size={16} />
        </label>
        <textarea
          ref={inputRef}
          rows={1}
          value={msgText}
          onChange={(e) => {
            onMsgTextChange(e.target.value);
            growTextarea(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendPost();
            }
          }}
          placeholder={t("channelComposer.placeholder")}
          aria-label={t("channelComposer.placeholder")}
          autoComplete="off"
          inputMode="text"
          enterKeyHint="send"
          spellCheck={!morseMode}
          className={`flex-1 min-w-0 bg-transparent outline-none border-none resize-none text-sm px-2 py-1.5 max-h-[120px] overflow-y-auto ${
            isDark ? "text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" : "text-slate-800 placeholder:text-slate-400"
          } ${morseMode ? "font-mono" : ""}`}
          style={composerInputStyle(morseMode, isDark)}
        />
        <button
          type="button"
          onClick={sendPost}
          disabled={!msgText.trim() && pendingMedia.length === 0}
          aria-label={t("channelComposer.send")}
          title={t("channelComposer.send")}
          className={`icon-button ${((msgText.trim() || pendingMedia.length > 0)) ? "primary" : ""}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
