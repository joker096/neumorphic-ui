import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smartphone, Monitor, Tablet, Globe, Trash2, ShieldCheck, Clock, LogOut } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { useAppStore } from '../../store';

interface DevicesSectionProps {
  isDark: boolean;
  onBack: () => void;
  t: (key: string, options?: any) => string;
}

const platformIcons: Record<string, React.ReactNode> = {
  web: <Globe size={18} />,
  ios: <Smartphone size={18} />,
  android: <Smartphone size={18} />,
  desktop: <Monitor size={18} />,
  tablet: <Tablet size={18} />,
};

const platformColors: Record<string, string> = {
  web: 'bg-blue-500/20 text-blue-400',
  ios: 'bg-gray-500/20 text-gray-300',
  android: 'bg-green-500/20 text-green-400',
  desktop: 'bg-purple-500/20 text-purple-400',
  tablet: 'bg-orange-500/20 text-orange-400',
};

function formatRelativeTime(t: (key: string, options?: any) => string, timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minutesAgo', { count: minutes });
  if (hours < 24) return t('time.hoursAgo', { count: hours });
  if (days < 7) return t('time.daysAgo', { count: days });
  return new Date(timestamp).toLocaleDateString();
}

export const DevicesSection = ({ isDark, onBack, t }: DevicesSectionProps) => {
  const { devices, currentSession, removeDevice, updateSettings } = useAppStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmLogoutOthers, setConfirmLogoutOthers] = useState(false);

  const otherDevices = devices.filter(d => !d.isCurrent);
  const currentDevice = devices.find(d => d.isCurrent);

  const handleTerminateSession = (deviceId: string) => {
    removeDevice(deviceId);
    setConfirmDeleteId(null);
  };

  const handleTerminateAllOthers = () => {
    otherDevices.forEach(d => removeDevice(d.id));
    setConfirmLogoutOthers(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="w-full flex-1 flex flex-col items-center min-h-0"
    >
      <div className="w-full max-w-full md:max-w-[640px] flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-3 shrink-0 pt-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-tertiary)]"
            style={{ touchAction: 'none' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)]"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="font-sans text-xl font-bold tracking-wide text-[var(--text-primary)]">
            {t('settings.devices')}
          </h2>
        </div>

        <div className="w-full flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 pr-1 pb-4 flex flex-col gap-6 items-center">
          <div className="w-full max-w-full">
            <div className="mb-2">
              <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 px-2 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
                {t('settings.currentDevice')}
              </div>
              <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
                {currentDevice && (
                  <div className="flex items-center gap-3 px-4 py-3.5 min-h-[44px]">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${platformColors[currentDevice.platform] || 'bg-gray-500/20 text-gray-400'}`}>
                      {platformIcons[currentDevice.platform] || <Smartphone size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{currentDevice.name}</div>
                      <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                        {t('settings.lastActive')}: {formatRelativeTime(t, currentDevice.lastActive)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck size={12} />
                      {t('settings.active')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className={`font-mono text-[10px] uppercase tracking-widest font-bold ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
                  {t('settings.otherDevices')} ({otherDevices.length})
                </div>
                {otherDevices.length > 0 && (
                  <button
                    onClick={() => setConfirmLogoutOthers(true)}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                  >
                    {t('settings.terminateAllSessions')}
                  </button>
                )}
              </div>
              <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
                {otherDevices.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <div className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                      {t('settings.noOtherDevices')}
                    </div>
                  </div>
                ) : (
                  otherDevices.map((device) => (
                    <div key={device.id}>
                      <div className="flex items-center gap-3 px-4 py-3.5 min-h-[44px]">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${platformColors[device.platform] || 'bg-gray-500/20 text-gray-400'}`}>
                          {platformIcons[device.platform] || <Smartphone size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{device.name}</div>
                          <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                            {t('settings.lastActive')}: {formatRelativeTime(t, device.lastActive)}
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmDeleteId(device.id)}
                          className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center shrink-0 text-red-400 hover:bg-red-500/20 transition-colors"
                          aria-label={t('settings.terminateSession')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {device.id !== otherDevices[otherDevices.length - 1]?.id && (
                        <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
                <div className="flex items-center gap-3 px-4 py-3.5 min-h-[44px]">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-gray-500/20 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                    <Clock size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>
                      {t('settings.currentSession')}
                    </div>
                    <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                      {t('settings.startedAt')}: {new Date(currentSession.startTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title={t('settings.confirmTerminateTitle')}
        message={t('settings.confirmTerminateMessage')}
        confirmLabel={t('settings.terminate')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={() => confirmDeleteId && handleTerminateSession(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmModal
        isOpen={confirmLogoutOthers}
        title={t('settings.confirmTerminateAllTitle')}
        message={t('settings.confirmTerminateAllMessage')}
        confirmLabel={t('settings.terminateAll')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleTerminateAllOthers}
        onCancel={() => setConfirmLogoutOthers(false)}
      />
    </motion.div>
  );
};
