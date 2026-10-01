import React from "react";
import { ChevronRight, FileText, Image as ImageIcon, Link2, MapPin, Music, Radio, Video as VideoIcon, X } from "lucide-react";
import { LiveLocationSheet } from "./LiveLocationSheet";

export interface ChatAttachLayerProps {
  isDark: boolean;
  /** Whether the attach menu is open. The layer itself stays mounted so a
   *  failure notice survives the menu closing. */
  open: boolean;
  onClose: () => void;
  onOpenVideoRecorder: () => void;
  /** Hidden inputs live in the composer toolbar; the menu only triggers them. */
  mediaInputRef: React.RefObject<HTMLInputElement | null>;
  docInputRef: React.RefObject<HTMLInputElement | null>;
  audioInputRef: React.RefObject<HTMLInputElement | null>;
  sendGeoMessage?: (lat: number, lng: number) => void;
  /** Live share: kept separate from the one-shot pin because it needs consent
   *  for both duration and precision, and it can be stopped after it starts. */
  startLiveLocationShare?: (opts?: { durationMs?: number; approximate?: boolean }) => void;
  isSharingLiveLocation?: boolean;
  stopLiveLocationShare?: () => void;
  sendArticleMessage?: (url: string, title?: string) => void;
  t: (key: string, opts?: any) => string;
}

const GEO_TIMEOUT_MS = 10_000;
const GEO_MAX_AGE_MS = 60_000;

const itemClass = (isDark: boolean) =>
  `min-w-11 min-h-11 w-full flex items-center gap-3 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
    isDark ? "text-[var(--text-primary)] hover:bg-white/5" : "text-slate-700 hover:bg-black/5"
  }`;

/**
 * Attach popover: photo/video, document, audio, video note, location, article.
 *
 * Owns the article sub-input and the failure notice. Location and article both
 * fail asynchronously or by user input, so the notice is rendered outside the
 * (dismissible) menu — picking an item closes the menu, but the error it caused
 * has to stay readable.
 */
export function ChatAttachLayer({
  isDark,
  open,
  onClose,
  onOpenVideoRecorder,
  mediaInputRef,
  docInputRef,
  audioInputRef,
  sendGeoMessage,
  startLiveLocationShare,
  isSharingLiveLocation,
  stopLiveLocationShare,
  sendArticleMessage,
  t,
}: ChatAttachLayerProps) {
  const [showArticleInput, setShowArticleInput] = React.useState(false);
  const [showLiveSheet, setShowLiveSheet] = React.useState(false);
  const [articleUrl, setArticleUrl] = React.useState("");
  const [error, setError] = React.useState("");
  const articleInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showArticleInput) articleInputRef.current?.focus();
  }, [showArticleInput]);

  // The consent sheet is a separate overlay, so it must not be hidden by the
  // menu-closed early return below.
  if (showLiveSheet) {
    return (
      <LiveLocationSheet
        t={t}
        onCancel={() => setShowLiveSheet(false)}
        onStart={(opts) => {
          setShowLiveSheet(false);
          startLiveLocationShare?.(opts);
        }}
      />
    );
  }

  if (!open && !error) return null;

  const pick = (trigger: () => void) => {
    setShowArticleInput(false);
    onClose();
    trigger();
  };

  const requestGeo = () => {
    setError("");
    if (!("geolocation" in navigator)) {
      setError(t("chat.locationDenied", "Location access denied"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => sendGeoMessage?.(pos.coords.latitude, pos.coords.longitude),
      () => setError(t("chat.locationDenied", "Location access denied")),
      { timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS },
    );
  };

  const submitArticle = () => {
    const url = articleUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setError(t("chat.articleInvalid", "Enter a valid URL (https://…)"));
      return;
    }
    setError("");
    setShowArticleInput(false);
    onClose();
    sendArticleMessage?.(url);
  };

  return (
    <>
      {open && (
        <div className={`mx-2 sm:mx-3 mb-2 p-1.5 sm:p-2 rounded-xl flex flex-col gap-0.5 ${
          isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"
        }`}>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] px-3 py-1.5">
            {t("chat.attachFile")}
          </span>
          <button
            type="button"
            onClick={() => pick(() => mediaInputRef.current?.click())}
            className={itemClass(isDark)}
          >
            <ImageIcon size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("chat.photo")} / {t("chat.video")}
          </button>
          <button
            type="button"
            onClick={() => pick(() => docInputRef.current?.click())}
            className={itemClass(isDark)}
          >
            <FileText size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("media.document")}
          </button>
          <button
            type="button"
            onClick={() => pick(() => audioInputRef.current?.click())}
            className={itemClass(isDark)}
          >
            <Music size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("media.audio")}
          </button>
          <button
            type="button"
            onClick={() => pick(onOpenVideoRecorder)}
            className={itemClass(isDark)}
          >
            <VideoIcon size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("chat.videoNote", "Video note")}
          </button>
          <button
            type="button"
            onClick={() => pick(requestGeo)}
            className={itemClass(isDark)}
          >
  <MapPin size={18} className="text-[var(--accent)] flex-shrink-0" />
  {t("chat.location")}
  </button>
  <button
  type="button"
  onClick={() => {
    setError("");
    setShowArticleInput(false);
    // Already sharing: this row becomes the stop affordance, so an ongoing
    // share is always cancellable from the same place that started it.
    if (isSharingLiveLocation) { onClose(); stopLiveLocationShare?.(); return; }
    setShowLiveSheet(true);
  }}
  className={itemClass(isDark)}
  >
  <Radio size={18} className="text-rose-500 flex-shrink-0" />
  {isSharingLiveLocation
    ? t("chat.stopLiveLocation", "Stop live location")
    : t("chat.liveLocation", "Live location")}
  </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setArticleUrl("");
              setShowArticleInput((v) => !v);
            }}
            aria-expanded={showArticleInput}
            className={itemClass(isDark)}
          >
            <Link2 size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("chat.article")}
          </button>
          {showArticleInput && (
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <input
                aria-label={t("chat.articleUrl", "https://…")}
                ref={articleInputRef}
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitArticle();
                  }
                }}
                placeholder={t("chat.articleUrl", "https://…")}
                className={`min-h-11 flex-1 min-w-0 px-3 rounded-lg text-sm outline-none transition-colors ${
                  isDark
                    ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    : "bg-slate-100 text-slate-800 placeholder:text-slate-400"
                }`}
              />
              <button
                type="button"
                onClick={submitArticle}
                aria-label={t("chat.sendMessage")}
                className="icon-button primary cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mx-2 sm:mx-3 mb-2 px-3 py-2 rounded-lg text-xs border border-rose-500/40 bg-rose-500/10 text-rose-500 flex items-center gap-2">
          <X
            size={14}
            className="flex-shrink-0 cursor-pointer min-h-11 min-w-11 -my-1 -mx-2 p-3"
            onClick={() => setError("")}
            aria-label="Dismiss"
          />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
