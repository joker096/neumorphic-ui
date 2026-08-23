import React from "react";
import { ChevronRight, Search, Phone, Video } from "lucide-react";
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
  const canCall = !(chat.type === "group" || chat.type === "channel" || chat.type === "bot" || chat.isChannel);
  const overrideAvatar = useAppStore((state) => state.contactAvatars)[chat.name];
  return (
    <div
      className={`px-2 sm:px-3 py-2 flex items-center gap-2 sm:gap-3 relative z-10 ${
        isDark
          ? "bg-[var(--bg-tertiary)]/90 border-b border-[var(--border-color)] backdrop-blur-md"
          : "bg-[var(--bg-primary)]/90 border-b border-[var(--border-color)] backdrop-blur-md"
      }`}
    >
      <IconButton
        icon={<ChevronRight className="rotate-180" strokeWidth={2} />}
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
        {chat.online && (
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
              className={`font-bold text-[12px] sm:text-[13px] tracking-tight truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}
            >
              {chat.name}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${chat.online ? "bg-[var(--success)]" : "bg-gray-500"}`}
            />
            <span
              className={`text-xs sm:text-xs font-semibold tracking-wider uppercase shrink-0 ${isDark ? "text-[var(--accent)]/90" : "text-[var(--accent)]/90"}`}
            >
              {chat.online ? t("chat.filters.online") : t("chat.filters.offline")}
            </span>
          </div>
          {typing && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-xs italic animate-pulse ${isDark ? "text-[var(--success)]" : "text-[var(--success)]"}`}
              >
                {t("chat.typing")}
              </span>
              <span className="flex gap-0.5">
                <span
                  className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-[var(--success)]" : "bg-[var(--success)]"}`}
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-[var(--success)]" : "bg-[var(--success)]"}`}
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-[var(--success)]" : "bg-[var(--success)]"}`}
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          )}
        </div>
      </div>

      {canCall && onCall && (
        <IconButton
          icon={<Phone strokeWidth={2} />}
          aria-label={t("chat.startCall")}
          onClick={() => onCall(chat.name, chat.color)}
          isDark={isDark}
          variant="ghost"
          size="md"
          className="shrink-0"
        />
      )}

      {canCall && onVideoCall && (
        <IconButton
          icon={<Video strokeWidth={2} />}
          aria-label={t("chat.startVideoCall")}
          onClick={() => onVideoCall(chat.name, chat.color)}
          isDark={isDark}
          variant="ghost"
          size="md"
          className="shrink-0"
        />
      )}

      {onSearchToggle && (
        <IconButton
          icon={<Search strokeWidth={2} />}
          aria-label={t("chat.searchMessages")}
          onClick={onSearchToggle}
          isDark={isDark}
          variant="ghost"
          size="md"
          className="shrink-0"
        />
      )}
    </div>
  );
};
