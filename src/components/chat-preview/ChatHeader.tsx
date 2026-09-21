import React, { useState } from "react";
import { ChevronRight, Search, Phone, Video, Users, MoreVertical } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { useAppStore } from "../../store";

interface ChatHeaderProps {
  chat: {
    name: string;
    color: string;
    online: boolean;
    isFavorite?: boolean;
    id: string | number;
    type?: string;
    isChannel?: boolean;
    subscriberCount?: number;
    subscribers?: number;
    postCount?: number;
    history?: any[];
  };
  isDark?: boolean;
  onClose: () => void;
  onProfileClick: () => void;
  onSearchToggle?: () => void;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  t: (key: string, options?: any) => string;
  typing?: boolean;
}

export const ChatHeader = ({ chat, isDark = false, onClose, onProfileClick, onSearchToggle, onCall, onVideoCall, t, typing }: ChatHeaderProps) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const canCall = !(chat.type === "group" || chat.type === "channel" || chat.type === "bot" || chat.isChannel);
  const isChannelChat = chat.isChannel || chat.type === "channel";
  const subscriberCount = chat.subscriberCount ?? chat.subscribers ?? 0;
  const overrideAvatar = useAppStore((state) => state.contactAvatars)[chat.name];

  const secondaryActions = [
    canCall && onCall && { key: "call", icon: <Phone />, label: t("chat.startCall"), onClick: () => onCall(chat.name, chat.color) },
    canCall && onVideoCall && { key: "video", icon: <Video />, label: t("chat.startVideoCall"), onClick: () => onVideoCall(chat.name, chat.color) },
    onSearchToggle && { key: "search", icon: <Search />, label: t("chat.searchMessages"), onClick: () => onSearchToggle() },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; label: string; onClick: () => void }[];
  return (
    <div
      className={`px-2 sm:px-3 py-2 flex items-center gap-2 sm:gap-3 relative z-10 ${
        isDark
          ? "bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-tertiary)]/80 border-b border-[var(--border-color)]/70 backdrop-blur-md"
          : "bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-primary)]/80 border-b border-[var(--border-color)]/70 backdrop-blur-md"
      }`}
    >
      <IconButton
        icon={<ChevronRight className="rotate-180" />}
        aria-label={t("chat.goBack")}
        onClick={onClose}
        isDark={isDark}
        variant="ghost"
        size="md"
        className="shrink-0"
      />

      <div
        role="button"
        tabIndex={0}
        onClick={onProfileClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onProfileClick();
          }
        }}
        aria-label={`${chat.name} ${t("contacts.profile")}`}
        className={`w-11 h-11 rounded-full bg-gradient-to-br shrink-0 ${chat.color} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shadow-sm relative cursor-pointer overflow-hidden`}
      >
        {overrideAvatar ? (
          <img src={overrideAvatar} alt="" role="presentation" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        ) : (
          chat.name.charAt(0)
        )}
        {chat.online && !isChannelChat && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-[2px] ${
              isDark ? "bg-[var(--success)] border-[var(--bg-tertiary)]" : "bg-[var(--success)] border-[var(--bg-primary)]"
            }`}
          />
        )}
      </div>

      <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span
              className={`font-bold text-[16px] tracking-tight truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}
            >
              {chat.name}
            </span>
            {typing ? (
              <span
                className="flex items-center gap-1.5 shrink-0"
                aria-live="polite"
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                </span>
                <span
                  className={`text-xs sm:text-xs font-medium tracking-wide italic truncate ${"text-[var(--success)]"}`}
                >
                  {t("chat.typing")}
                </span>
                <span className="flex items-end gap-0.5 h-3">
                  <span
                    className="w-1 h-1 rounded-full bg-[var(--success)] animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full bg-[var(--success)] animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full bg-[var(--success)] animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </span>
            ) : isChannelChat ? (
              <>
                <Users size={12} className={`shrink-0 ${"text-[var(--accent)]"}`} />
                <span
                  className={`text-xs sm:text-xs font-semibold shrink-0 ${"text-[var(--accent)]/90"}`}
                >
                  {t("chat.subscribers", { count: subscriberCount })}
                </span>
                <span
                  className={`text-xs sm:text-xs font-semibold shrink-0 ${"text-[var(--accent)]/90"}`}
                >
                  ·
                </span>
                <span
                  className={`text-xs sm:text-xs font-semibold shrink-0 ${"text-[var(--accent)]/90"}`}
                >
                  {t("chat.posts", { count: chat.postCount ?? chat.history?.length ?? 0 })}
                </span>
              </>
            ) : (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${chat.online ? "bg-[var(--success)]" : "bg-gray-500"}`}
                />
                <span
                  className={`text-xs sm:text-xs font-semibold shrink-0 ${"text-[var(--accent)]/90"}`}
                >
                  {chat.online ? t("chat.filters.online") : t("chat.filters.offline")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {canCall && onCall && (
        <div className="shrink-0 hidden sm:block">
          <IconButton
            icon={<Phone />}
            aria-label={t("chat.startCall")}
            onClick={() => onCall(chat.name, chat.color)}
            isDark={isDark}
            variant="ghost"
            size="md"
            className="shadow-md shadow-black/10 dark:shadow-black/30"
          />
        </div>
      )}

      {canCall && onVideoCall && (
        <div className="shrink-0 hidden sm:block">
          <IconButton
            icon={<Video />}
            aria-label={t("chat.startVideoCall")}
            onClick={() => onVideoCall(chat.name, chat.color)}
            isDark={isDark}
            variant="ghost"
            size="md"
            className="shadow-md shadow-black/10 dark:shadow-black/30"
          />
        </div>
      )}

      {onSearchToggle && (
        <div className="shrink-0 hidden sm:block">
          <IconButton
            icon={<Search />}
            aria-label={t("chat.searchMessages")}
            onClick={onSearchToggle}
            isDark={isDark}
            variant="ghost"
            size="md"
            className="shadow-md shadow-black/10 dark:shadow-black/30"
          />
        </div>
      )}

      {secondaryActions.length > 0 && (
        <div className="relative shrink-0 sm:hidden">
          <IconButton
            icon={<MoreVertical />}
            aria-label={t("chat.more")}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((o) => !o)}
            isDark={isDark}
            variant="ghost"
            size="md"
            className="shadow-md shadow-black/10 dark:shadow-black/30"
          />
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} aria-hidden="true" />
              <div
                className="glass-menu absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-xl p-1 overflow-hidden"
                role="menu"
              >
                {secondaryActions.map((action) => (
                  <button
                    key={action.key}
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      action.onClick();
                    }}
                    className="w-full min-h-11 flex items-center gap-2.5 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-hover)] cursor-pointer"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
