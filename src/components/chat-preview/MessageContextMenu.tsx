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
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ open, onClose, title, actions, isDark = false }) => {
  const { t } = useI18n();
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const portalTarget =
    document.querySelector("[data-theme]") || document.body;

  return ReactDOM.createPortal(
    <div
      className={sheetOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={title || t("chat.messageActions", "Message actions")}
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
