import React from "react";
import ReactDOM from "react-dom";
import {
  sheetOverlay,
  sheetBackdrop,
  sheetSurface,
  sheetTitleClass,
  sheetActionClass,
  sheetCancelClass,
} from "../ui/modalShared";
import { useI18n } from "../../lib/i18n";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useCoarsePointer } from "../../hooks/useCoarsePointer";
import { MENU_WIDTH, MOUSE_ROW_HEIGHT, TOUCH_ROW_HEIGHT, VIEWPORT_MARGIN, resolveMenuPosition, type MenuAnchorRect } from "./menuPosition";
import { CONTEXT_MENU_CLASS } from "./chatPreviewClasses";

export interface MessageContextAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

interface MessageContextMenuProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: MessageContextAction[];
  /**
   * Long-press anchor (bubble rect). Renders the menu next to the pressed
   * message instead of a bottom sheet; without it the sheet stays the default.
   */
  anchorRect?: MenuAnchorRect | null;
  /** Emojis for the quick-reaction strip; the strip is hidden without an `onReact`. */
  reactionEmojis?: string[];
  myReactions?: Record<string, boolean>;
  onReact?: (emoji: string) => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ open, onClose, title, actions, anchorRect = null, reactionEmojis = [], myReactions = {}, onReact }) => {
  const { t } = useI18n();
  const coarse = useCoarsePointer();
  const menuRef = React.useRef<HTMLDivElement>(null);
  useEscapeKey(onClose, open);

  const anchored = Boolean(open && anchorRect);

  React.useEffect(() => {
    if (!anchored) return;
    const dismiss = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("mousedown", dismiss);
    window.addEventListener("touchstart", dismiss);
    return () => {
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("touchstart", dismiss);
    };
  }, [anchored, onClose]);

  if (!open) return null;

  const portalTarget =
    document.querySelector("[data-theme]") || document.body;

  const label = title || t("chat.messageActions", "Message actions");

  const reactionStrip =
    onReact && reactionEmojis.length > 0 ? (
      <div
        role="group"
        aria-label={t("chat.reactions", "Reactions")}
        className="flex gap-0.5 overflow-x-auto border-b border-[var(--border-color)] px-1 pb-1 mb-1"
      >
        {reactionEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            role="menuitem"
            aria-label={emoji}
            aria-pressed={!!myReactions[emoji]}
            onClick={() => { onReact(emoji); onClose(); }}
            className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-lg text-lg cursor-pointer transition-colors hover:bg-[var(--msg-bg-panel-hover)] active:scale-95 ${
              myReactions[emoji] ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    ) : null;

  if (anchorRect) {
    const rowHeight = coarse ? TOUCH_ROW_HEIGHT : MOUSE_ROW_HEIGHT;
    const height = actions.length * rowHeight + 8 + (reactionStrip ? 52 : 0);
    const { x, y } = resolveMenuPosition(null, anchorRect, height);
    return ReactDOM.createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label={label}
        style={{ position: "fixed", top: Math.max(VIEWPORT_MARGIN, y), left: Math.max(VIEWPORT_MARGIN, x), width: MENU_WIDTH }}
        className={CONTEXT_MENU_CLASS}
      >
        {reactionStrip}
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            role="menuitem"
            onClick={() => {
              a.onClick();
              onClose();
            }}
            className={`w-full flex items-center gap-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
              coarse ? "min-h-11 px-3 py-2" : "min-h-11 px-3 py-2"
            } ${a.danger ? "text-[var(--danger)] hover:bg-[var(--danger-soft)]" : "text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)]"}`}
          >
            {a.icon && <span className="shrink-0 text-base">{a.icon}</span>}
            <span className="truncate">{a.label}</span>
          </button>
        ))}
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div
      className={sheetOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className={sheetBackdrop} onClick={onClose} aria-hidden="true" />
      <div className={sheetSurface(false, 'p-1.5')}>
        {title && <div className={sheetTitleClass(false)}>{title}</div>}
        {reactionStrip}
        <div className="flex flex-col">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                a.onClick();
                onClose();
              }}
              className={sheetActionClass(false, a.danger, true)}
            >
              {a.icon && <span className="shrink-0 text-base">{a.icon}</span>}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className={sheetCancelClass(false, true)}>
          {t("common.cancel", "Cancel")}
        </button>
      </div>
    </div>,
    portalTarget
  );
};
