import { Bell, BellOff, Cloud } from "lucide-react";
import { SettingsCard, SettingsDivider } from "./SettingsMenuPrimitives";
import { ToggleSwitch } from "../ui/SettingsRow";
import { ROW_SHELL_CLASS } from '../ui/rowClasses';
import { MEDIUM_LABEL_CLASS, MUTED_CAPTION_CLASS, SECONDARY_TEXT_CLASS, SUBTLE_TEXT_CLASS } from '../ui/textClasses';
import { formatClockTime } from "../../utils/chatUtils";
import type { CloudSyncState } from "../../store/types";

type T = (key: string, options?: any) => string;

interface NotificationsCardProps {
  t: T;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
  cloudSync: CloudSyncState;
  setCloudSyncEnabled: (v: boolean) => void;
  lang?: string;
  onOpen: () => void;
  visible: {
    notif: boolean;
    sound: boolean;
    volume: boolean;
    cloudSync: boolean;
  };
}

export function NotificationsCard({
  t, notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled,
  soundVolume, setSoundVolume, cloudSync, setCloudSyncEnabled, lang, onOpen, visible,
}: NotificationsCardProps) {
  return (
    <SettingsCard onClick={onOpen}>
      {visible.notif && (
        <>
          <div className={`flex items-center justify-between px-4 py-3 ${notificationsEnabled ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-500/10">
                <Bell size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={MEDIUM_LABEL_CLASS}>{t('settings.notifications')}</div>
                {t('settings.notificationsSubtitle') && <div className={MUTED_CAPTION_CLASS}>{t('settings.notificationsSubtitle')}</div>}
              </div>
            </div>
            <ToggleSwitch isOn={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} ariaLabel={t('settings.notifications')} />
          </div>
          {(visible.sound || visible.volume || visible.cloudSync) && <SettingsDivider />}
        </>
      )}
      {visible.sound && (
        <>
          <div className={ROW_SHELL_CLASS}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/10">
                {soundEnabled ? <Bell size={16} className="text-emerald-600 dark:text-emerald-400" /> : <BellOff size={16} className={SUBTLE_TEXT_CLASS} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={SECONDARY_TEXT_CLASS}>{t('settings.sound')}</div>
              </div>
            </div>
            <ToggleSwitch isOn={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} ariaLabel={t('settings.sound')} />
          </div>
          {(visible.volume || visible.cloudSync) && <SettingsDivider />}
        </>
      )}
      {visible.volume && (
        <>
          <div className="flex items-center justify-between px-4 py-3 min-h-11">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-500/10">
                <Bell size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={SECONDARY_TEXT_CLASS}>{t('settings.soundVolume', 'Volume')}</div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
              aria-label={t('settings.soundVolume', 'Volume')}
              className="w-32 accent-[var(--accent)]"
            />
          </div>
          {visible.cloudSync && <SettingsDivider />}
        </>
      )}
      {visible.cloudSync && (
        <div className={ROW_SHELL_CLASS}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--accent-soft)]">
              <Cloud size={16} className="t-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={SECONDARY_TEXT_CLASS}>{t('settings.cloudSyncOption')}</div>
              {cloudSync.enabled && (
                <div className={`text-xs truncate ${cloudSync.status === "error" ? "text-red-600 dark:text-red-400" : "text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]"}`}>
                  {cloudSync.status === "error"
                    ? t('settings.cloudSyncError', 'Sync failed')
                    : cloudSync.status === "syncing"
                      ? t('settings.cloudSyncSyncing', 'Syncing…')
                      : cloudSync.pendingChanges > 0
                        ? t('settings.cloudSyncPending', { count: cloudSync.pendingChanges })
                        : cloudSync.lastSync
                          ? t('settings.cloudSyncLastSync', { time: formatClockTime(cloudSync.lastSync, lang) })
                          : t('settings.cloudSyncSubtitle')}
                </div>
              )}
            </div>
          </div>
          <ToggleSwitch isOn={cloudSync.enabled} onToggle={() => setCloudSyncEnabled(!cloudSync.enabled)} ariaLabel={t('settings.cloudSyncOption')} />
        </div>
      )}
    </SettingsCard>
  );
}
