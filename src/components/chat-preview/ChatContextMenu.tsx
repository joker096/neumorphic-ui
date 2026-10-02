import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ComponentType } from "react";
import { Pin, PinOff, BellOff, Bell, CheckCheck, Archive, ArchiveRestore, Trash2, CheckSquare } from "lucide-react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useCoarsePointer } from "../../hooks/useCoarsePointer";
import { MENU_WIDTH, MOUSE_ROW_HEIGHT, TOUCH_ROW_HEIGHT, VIEWPORT_MARGIN, resolveMenuPosition, type MenuAnchorRect } from "./menuPosition";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export type { MenuAnchorRect };

interface ChatContextMenuProps {
  anchor: { x: number; y: number } | null;
  /** Long-press anchor (row rect). Wins over `anchor` when provided. */
  anchorRect?: MenuAnchorRect | null;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  pin: Pin,
  unpin: PinOff,
  mute: BellOff,
  unmute: Bell,
  markRead: CheckCheck,
  archive: Archive,
  unarchive: ArchiveRestore,
  delete: Trash2,
  select: CheckSquare,
};

export const buildMenuIcon = (id: string) => ICONS[id] ?? Pin;

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({ anchor, anchorRect, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, setSizeTick] = useState(0);
  const coarse = useCoarsePointer();

  useEffect(() => {
    const onResize = () => setSizeTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, []);

  useEscapeKey(onClose);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onTouch = (e: TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onTouch);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [onClose]);

  if (anchor || anchorRect) {
    const rowHeight = coarse ? TOUCH_ROW_HEIGHT : MOUSE_ROW_HEIGHT;
    const height = items.length * rowHeight + 8;
    const { x, y } = resolveMenuPosition(anchor, anchorRect, height);
    return createPortal(
      <div
        ref={ref}
        role="menu"
        style={{ position: "fixed", top: Math.max(VIEWPORT_MARGIN, y), left: Math.max(VIEWPORT_MARGIN, x), width: MENU_WIDTH }}
        className="z-[var(--z-tooltip)] glass-menu rounded-xl p-1 animate-fade-in"
      >
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                it.onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                coarse ? "min-h-11 px-3 py-2" : "min-h-9 px-3 py-1"
              } ${it.disabled ? "opacity-40 cursor-not-allowed" : it.danger ? "text-red-400 hover:bg-red-500/10" : "text-[var(--text-primary)] hover:bg-white/[0.06]"}`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="min-w-0 truncate">{it.label}</span>
            </button>
          );
        })}
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-drawer)] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="menu"
        className="glass-menu relative w-full max-w-[420px] rounded-t-2xl p-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] animate-fade-in"
      >
        <div aria-hidden="true" className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-[var(--text-tertiary)] opacity-70" />
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                it.onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition-colors min-h-11 cursor-pointer ${
                it.disabled
                  ? "opacity-40 cursor-not-allowed"
                  : it.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-[var(--text-primary)] hover:bg-white/[0.05]"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="min-w-0 truncate">{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

export { ICONS as CHAT_MENU_ICONS };
