import React from "react";
import { BarChart3, ChevronRight, FileText, Image as ImageIcon, Link2, MapPin, Music, Radio, Video as VideoIcon, X } from "lucide-react";
import { LiveLocationSheet } from "./LiveLocationSheet";
import { PollComposerModal } from "./PollComposerModal";

export interface ChatAttachLayerProps {
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
  sendPoll?: (question: string, optionTexts: string[], multiple: boolean) => void;
  t: (key: string, opts?: any) => string;
}

const GEO_TIMEOUT_MS = 10_000;
const GEO_MAX_AGE_MS = 60_000;

/** Telegram-style tile: icon above a short label, one 76px cell of the grid. */
const tileClass =
  "flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-center text-xs font-semibold leading-tight text-[var(--text-secondary)] transition-colors hover:bg-[var(--msg-bg-panel-hover)] active:scale-95";

/**
 * Attach menu: photo, document, audio, video note, location, live location, article.
 *
 * Laid out as a compact icon grid (Telegram parity) instead of a vertical list:
 * seven tiles fit two rows, so the menu never covers the composer.
 *
 * Owns the article sub-input and the failure notice. Location and article both
 * fail asynchronously or by user input, so the notice is rendered outside the
 * (dismissible) menu — picking an item closes the menu, but the error it caused
 * has to stay readable.
 */
export function ChatAttachLayer({
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
  sendPoll,
  t,
}: ChatAttachLayerProps) {
  const [showArticleInput, setShowArticleInput] = React.useState(false);
  const [showLiveSheet, setShowLiveSheet] = React.useState(false);
  const [showPollComposer, setShowPollComposer] = React.useState(false);
  const [articleUrl, setArticleUrl] = React.useState("");
  const [error, setError] = React.useState("");
  const articleInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showArticleInput) articleInputRef.current?.focus();
  }, [showArticleInput]);

  // The consent sheet is a separate overlay, so it must not be hidden by the
  // menu-closed early return below.
  if (showPollComposer) {
    return (
      <PollComposerModal
        open
        onClose={() => setShowPollComposer(false)}
        onSubmit={(question, optionTexts, multiple) => sendPoll?.(question, optionTexts, multiple)}
      />
    );
  }

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
        <div className="mx-2 sm:mx-3 mb-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2">
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => pick(() => mediaInputRef.current?.click())}
              className={tileClass}
            >
              <ImageIcon size={24} className="text-[var(--accent)]" />
              {t("chat.photo")}
            </button>
            <button
              type="button"
              onClick={() => pick(() => docInputRef.current?.click())}
              className={tileClass}
            >
              <FileText size={24} className="text-[var(--accent)]" />
              {t("media.document")}
            </button>
            <button
              type="button"
              onClick={() => pick(() => audioInputRef.current?.click())}
              className={tileClass}
            >
              <Music size={24} className="text-[var(--accent)]" />
              {t("media.audio")}
            </button>
            <button
              type="button"
              onClick={() => pick(onOpenVideoRecorder)}
              className={tileClass}
            >
              <VideoIcon size={24} className="text-[var(--accent)]" />
              {t("chat.videoNote", "Video note")}
            </button>
            <button type="button" onClick={() => pick(requestGeo)} className={tileClass}>
              <MapPin size={24} className="text-[var(--accent)]" />
              {t("chat.location")}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowArticleInput(false);
                // Already sharing: this tile becomes the stop affordance, so an
                // ongoing share is always cancellable from where it started.
                if (isSharingLiveLocation) {
                  onClose();
                  stopLiveLocationShare?.();
                  return;
                }
                setShowLiveSheet(true);
              }}
              className={tileClass}
            >
              <Radio size={24} className="text-[var(--danger)]" />
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
              className={tileClass}
            >
              <Link2 size={24} className="text-[var(--accent)]" />
              {t("chat.article")}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowArticleInput(false);
                onClose();
                setShowPollComposer(true);
              }}
              className={tileClass}
            >
              <BarChart3 size={24} className="text-[var(--accent)]" />
              {t("chat.createPoll")}
            </button>
          </div>

          {showArticleInput && (
            <div className="mt-1 flex items-center gap-1.5 px-1 pb-1">
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
                className="min-h-11 min-w-0 flex-1 rounded-lg bg-[var(--bg-tertiary)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)]"
              />
              <button
                type="button"
                onClick={submitArticle}
                aria-label={t("chat.sendMessage")}
                className="icon-button primary min-w-11 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mx-2 sm:mx-3 mb-2 flex items-center gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
          <X
            size={16}
            className="-mx-2 -my-1 min-h-11 min-w-11 flex-shrink-0 cursor-pointer p-3"
            onClick={() => setError("")}
            aria-label="Dismiss"
          />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
