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
  isDark?: boolean;
  /**
   * Long-press anchor (bubble rect). Renders the menu next to the pressed
   * message instead of a bottom sheet; without it the sheet stays the default.
   */
  anchorRect?: MenuAnchorRect | null;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ open, onClose, title, actions, isDark = false, anchorRect = null }) => {
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

  if (anchorRect) {
    const rowHeight = coarse ? TOUCH_ROW_HEIGHT : MOUSE_ROW_HEIGHT;
    const height = actions.length * rowHeight + 8;
    const { x, y } = resolveMenuPosition(null, anchorRect, height);
    return ReactDOM.createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label={label}
        style={{ position: "fixed", top: Math.max(VIEWPORT_MARGIN, y), left: Math.max(VIEWPORT_MARGIN, x), width: MENU_WIDTH }}
        className="z-[var(--z-tooltip)] glass-menu rounded-xl p-1 animate-fade-in"
      >
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
              coarse ? "min-h-11 px-3 py-2" : "min-h-9 px-3 py-1"
            } ${a.danger ? "text-red-400 hover:bg-red-500/10" : "text-[var(--text-primary)] hover:bg-white/[0.06]"}`}
          >
            {a.icon && <span className="shrink-0 text-[16px]">{a.icon}</span>}
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
      <div className={sheetSurface(isDark, 'p-1.5')}>
        {title && <div className={sheetTitleClass(isDark)}>{title}</div>}
        <div className="flex flex-col">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                a.onClick();
                onClose();
              }}
              className={sheetActionClass(isDark, a.danger, true)}
            >
              {a.icon && <span className="shrink-0 text-[16px]">{a.icon}</span>}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className={sheetCancelClass(isDark, true)}>
          {t("common.cancel", "Cancel")}
        </button>
      </div>
    </div>,
    portalTarget
  );
};
