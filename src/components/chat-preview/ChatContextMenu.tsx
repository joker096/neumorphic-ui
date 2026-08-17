import React, { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { Pin, PinOff, BellOff, Bell, CheckCheck, Archive, ArchiveRestore, Trash2, CheckSquare } from "lucide-react";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface ChatContextMenuProps {
  anchor: { x: number; y: number } | null;
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

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({ anchor, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onTouch = (e: TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onTouch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [onClose]);

  if (anchor) {
    const width = 210;
    const height = items.length * 44 + 12;
    const x = Math.min(anchor.x, window.innerWidth - width - 8);
    const y = Math.min(anchor.y, window.innerHeight - height - 8);
    return (
      <div
        ref={ref}
        role="menu"
        style={{ position: "fixed", top: Math.max(8, y), left: Math.max(8, x), width }}
        className="z-[300] rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-2xl p-1.5 animate-fade-in"
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
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-left transition-colors min-h-[44px] cursor-pointer ${
                it.disabled
                  ? "opacity-40 cursor-not-allowed"
                  : it.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-[var(--text-primary)] hover:bg-white/[0.06]"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{it.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        role="menu"
        className="relative w-full max-w-[420px] rounded-t-2xl bg-[var(--bg-primary)] border-t border-[var(--border-color)] shadow-2xl p-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] animate-fade-in"
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-left transition-colors min-h-[48px] cursor-pointer ${
                it.disabled
                  ? "opacity-40 cursor-not-allowed"
                  : it.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-[var(--text-primary)] hover:bg-white/[0.05]"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { ICONS as CHAT_MENU_ICONS };
