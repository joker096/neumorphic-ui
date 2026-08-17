import React from "react";
import {
  sheetOverlay,
  sheetBackdrop,
  sheetSurface,
  sheetTitleClass,
  sheetActionClass,
  sheetCancelClass,
} from "../ui/modalShared";

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
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={sheetOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Message actions"}
    >
      <div className={sheetBackdrop} onClick={onClose} aria-hidden="true" />
      <div className={sheetSurface(isDark)}>
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
              className={sheetActionClass(isDark, a.danger)}
            >
              {a.icon && <span className="shrink-0">{a.icon}</span>}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className={sheetCancelClass(isDark)}>
          Cancel
        </button>
      </div>
    </div>
  );
};
