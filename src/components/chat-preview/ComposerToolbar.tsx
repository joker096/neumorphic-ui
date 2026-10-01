import React from "react";
import { Clock, Plus, Smile, Timer } from "lucide-react";

export interface ComposerToolbarProps {
  isDark: boolean;
  /** Hidden while the hold-to-record gesture owns the row. */
  hidden: boolean;
  attachOpen: boolean;
  onToggleAttach: () => void;
  scheduleActive: boolean;
  onToggleSchedule: () => void;
  stickersOpen: boolean;
  onToggleStickers: () => void;
  mediaInputRef: React.RefObject<HTMLInputElement | null>;
  docInputRef: React.RefObject<HTMLInputElement | null>;
  audioInputRef: React.RefObject<HTMLInputElement | null>;
  onPickFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Per-chat self-destruct timer. `onCycleTimer` is absent when the current
   * chat has no stable id — the control is then hidden rather than disabled,
   * so there is never a live-looking button that cannot write anything.
   */
  timerActive?: boolean;
  timerLabel?: string;
  onCycleTimer?: () => void;
  t: (key: string, opts?: any) => string;
}

/**
 * Left side of the DM composer: attach, schedule and sticker buttons.
 *
 * The three file inputs live here rather than next to the popover so that
 * `ChatAttachLayer` can only reach them through refs — the layer renders an item
 * and never owns a `<input>` of its own.
 */
export function ComposerToolbar({
  isDark,
  hidden,
  attachOpen,
  onToggleAttach,
  scheduleActive,
  onToggleSchedule,
  stickersOpen,
  onToggleStickers,
  mediaInputRef,
  docInputRef,
  audioInputRef,
  onPickFiles,
  timerActive,
  timerLabel,
  onCycleTimer,
  t,
}: ComposerToolbarProps) {
  if (hidden) return null;
  return (
    <>
      <div className="relative group">
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          id="dm-media-input"
          className="hidden"
          onChange={onPickFiles}
          aria-label={t("chat.attachFile")}
        />
        <input
          ref={docInputRef}
          type="file"
          accept="application/*,text/*"
          id="dm-doc-input"
          className="hidden"
          onChange={onPickFiles}
          aria-label={t("media.document")}
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          id="dm-audio-input"
          className="hidden"
          onChange={onPickFiles}
          aria-label={t("media.audio")}
        />
        <button
          type="button"
          aria-label={t("chat.attachFile")}
          aria-haspopup="menu"
          aria-expanded={attachOpen}
          onClick={onToggleAttach}
          className={`icon-button cursor-pointer ${
            isDark ? "text-gray-400" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Plus size={16} />
        </button>
      </div>

      <button
        type="button"
        aria-label={t("chat.scheduleMessage")}
        className={`icon-button ${
          scheduleActive ? "bg-[var(--accent)]/20 text-[var(--accent)]" : ""
        }`}
        onClick={onToggleSchedule}
      >
        <Clock size={16} />
      </button>

      {onCycleTimer && (
        <button
          type="button"
          aria-label={t("chat.selfDestructTimer", "Self-destruct timer")}
          title={timerLabel}
          className={`icon-button ${
            timerActive ? "bg-[var(--accent)]/20 text-[var(--accent)]" : ""
          }`}
          onClick={onCycleTimer}
        >
          <Timer size={16} />
        </button>
      )}

      <button
        type="button"
        aria-label={t("stickers.title")}
        className={`icon-button ${
          stickersOpen ? "bg-[var(--accent)]/20 text-[var(--accent)]" : ""
        }`}
        onClick={onToggleStickers}
      >
        <Smile size={16} />
      </button>
    </>
  );
}
