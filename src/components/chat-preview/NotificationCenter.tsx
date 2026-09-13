import React from "react";
import { createPortal } from "react-dom";
import { Bell, BellOff, Check, Trash2, X, MessageSquare, Phone, AtSign, Reply, Users, Megaphone, Info } from "lucide-react";
import { useAppStore } from "../../store";
import { useI18n } from "../../lib/i18n";
import type { NotificationKind, NotificationSettings } from "../../store/slices/notificationSlice";
import { DataState } from "../ui/DataState";

const KIND_ICON: Record<NotificationKind, React.ComponentType<{ size?: number; className?: string }>> = {
  message: MessageSquare,
  mention: AtSign,
  reply: Reply,
  call: Phone,
  group: Users,
  channel: Megaphone,
  system: Info,
};

const SETTING_KEYS: { key: keyof NotificationSettings; labelKey: string; label: string }[] = [
  { key: "allMessages", labelKey: "notif.settings.allMessages", label: "All messages" },
  { key: "mentions", labelKey: "notif.settings.mentions", label: "Mentions" },
  { key: "replies", labelKey: "notif.settings.replies", label: "Replies" },
  { key: "calls", labelKey: "notif.settings.calls", label: "Calls" },
  { key: "groups", labelKey: "notif.settings.groups", label: "Groups" },
  { key: "channels", labelKey: "notif.settings.channels", label: "Channels" },
  { key: "sounds", labelKey: "notif.settings.sounds", label: "Sounds" },
  { key: "desktop", labelKey: "notif.settings.desktop", label: "Desktop" },
  { key: "mobile", labelKey: "notif.settings.mobile", label: "Mobile" },
];

function relTime(ts: number, t: (k: string, o?: any) => string): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return t("notif.relNow", "now");
  if (s < 3600) return t("notif.relMin", { n: Math.floor(s / 60) });
  if (s < 86400) return t("notif.relHour", { n: Math.floor(s / 3600) });
  return t("notif.relDay", { n: Math.floor(s / 86400) });
}

export function NotificationCenter({ isDark, t }: { isDark: boolean; t: (k: string, o?: any) => string }) {
  const notificationItems = useAppStore((s) => s.notificationItems);
  const unreadCount = useAppStore((s) => s.unreadCount);
  const settings = useAppStore((s) => s.notificationSettings);
  const browserPermission = useAppStore((s) => s.browserPermission);
  const markRead = useAppStore((s) => s.markNotificationsRead);
  const clearAll = useAppStore((s) => s.clearNotifications);
  const setSettings = useAppStore((s) => s.setNotificationSettings);
  const setBrowserPermission = useAppStore((s) => s.setBrowserPermission);
  const [open, setOpen] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ top: number; right: number; flip: boolean } | null>(null);

  // Fixed positioning (escapes ancestor overflow-hidden clipping) with
  // up/down flip when there is no room below the bell button.
  React.useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const calc = () => {
      const b = btnRef.current;
      if (!b) return;
      const r = b.getBoundingClientRect();
      const flip = r.bottom + 400 > window.innerHeight;
      setPos({ top: flip ? r.top - 8 : r.bottom + 8, right: Math.max(8, window.innerWidth - r.right), flip });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [open]);

  const requestPerm = () => {
    if (typeof Notification === "undefined" || !("requestPermission" in Notification)) return;
    (Notification as any).requestPermission?.().then((p: NotificationPermission) => setBrowserPermission(p)).catch(() => {});
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        aria-label={t("notif.title", "Notifications")}
        title={t("notif.title", "Notifications")}
        onClick={() => setOpen((o) => !o)}
        className={`min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 flex-shrink-0 relative ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-white/5 text-[var(--text-secondary)]" : "bg-white border border-[var(--border-color)] hover:bg-black/5 text-slate-600 shadow-sm"}`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-[2px] border-[var(--bg-secondary)] dark:border-[var(--bg-primary)] px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {open &&
        createPortal(
        <>
          <div className="fixed inset-0 z-[var(--z-tooltip)]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={`fixed z-[var(--z-toast)] w-[320px] max-w-[90vw] rounded-2xl shadow-2xl border border-black/10 ${isDark ? "bg-[var(--bg-secondary)] text-gray-100" : "bg-white text-slate-800"}`}
            style={{ top: pos?.top, right: pos?.right, transform: pos?.flip ? "translateY(-100%)" : undefined }}
            role="dialog"
            aria-label={t("notif.title", "Notifications")}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-black/10 dark:border-white/10">
              <span className="font-semibold text-[14px]">{t("notif.title", "Notifications")}</span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label={t("notif.settingsTitle", "Settings")} onClick={() => setShowSettings((s) => !s)} className="flex items-center justify-center min-w-11 min-h-11 -my-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                  {showSettings ? <X size={16} /> : <BellOff size={16} />}
                </button>
                {unreadCount > 0 && (
                  <button type="button" aria-label={t("notif.markRead", "Mark all read")} onClick={markRead} className="flex items-center justify-center min-w-11 min-h-11 -my-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                    <Check size={16} />
                  </button>
                )}
                {notificationItems.length > 0 && (
                  <button type="button" aria-label={t("notif.clear", "Clear")} onClick={clearAll} className="flex items-center justify-center min-w-11 min-h-11 -my-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {showSettings ? (
              <div className="p-3 space-y-1 max-h-[320px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium opacity-70">{t("notif.browser", "Browser notifications")}</span>
                  <button
                    type="button"
                    onClick={requestPerm}
                    disabled={browserPermission === "granted" || browserPermission === "denied"}
                    className={`text-[12px] px-2 py-1 rounded-lg ${browserPermission === "granted" ? "bg-green-500/20 text-green-400" : browserPermission === "denied" ? "bg-red-500/20 text-red-400" : "bg-[var(--accent)]/20 text-[var(--accent)]"}`}
                  >
                    {browserPermission === "granted" ? t("notif.enabled", "Enabled") : browserPermission === "denied" ? t("notif.blocked", "Blocked") : t("notif.enable", "Enable")}
                  </button>
                </div>
                {browserPermission === "denied" && (
                  <p className="pb-2 text-[11px] opacity-60">{t("notif.blockedHint", "Blocked in browser settings. Enable notifications for this site there, then reload.")}</p>
                )}
                {SETTING_KEYS.map((s) => (
                  <label key={s.key} className="flex items-center justify-between py-1 text-[13px] cursor-pointer">
                    <span>{t(s.labelKey, s.label)}</span>
                    <input
                      type="checkbox"
                      checked={settings[s.key]}
                      onChange={(e) => setSettings({ [s.key]: e.target.checked })}
                      className="w-4 h-4 accent-[var(--accent)]"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto">
                {notificationItems.length === 0 ? (
                  <DataState status="empty" isDark={isDark} title={t("notif.empty", "No notifications")} description={t("notif.emptyHint")} action={{ label: t("notif.settingsTitle", "Settings"), onClick: () => setShowSettings(true) }} />
                ) : (
                  notificationItems.map((n) => {
                    const Icon = KIND_ICON[n.kind];
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={markRead}
                        className={`w-full flex items-start gap-2 px-3 py-2 text-left border-b border-black/5 dark:border-white/5 ${n.read ? "opacity-50" : "bg-[var(--accent)]/5"}`}
                      >
                        <Icon size={16} className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium truncate">{n.title}</div>
                          {n.body && <div className="text-[12px] opacity-70 truncate">{n.body}</div>}
                        </div>
                        <span className="text-[11px] opacity-50 flex-shrink-0">{relTime(n.createdAt, t)}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </>,
        document.body
        )}
    </div>
  );
}
