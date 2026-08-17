import React, { useState } from 'react';
import { Download, Upload, Database, FileJson, Trash2, Cloud, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle, SettingsRow, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from '../ui/Toast';

interface BackupExportSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

export const BackupExportSection = ({ isDark = false, onBack }: BackupExportSectionProps) => {
  const { t } = useI18n();
  const [autoBackup, setAutoBackup] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [lastBackup, setLastBackup] = useState('2026-08-11 21:40');
  const [busy, setBusy] = useState<string | null>(null);

  const simulate = (key: string, done: string) => {
    setBusy(key);
    setTimeout(() => { setBusy(null); toast(done, 'success'); if (key === 'backup') setLastBackup(new Date().toISOString().slice(0, 16).replace('T', ' ')); }, 1200);
  };

  return (
    <SubView title={t('settings.backupExport', 'Backup & Export')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.cloudBackup', 'Cloud backup')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsToggleRow
          icon={<Cloud size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.autoBackup', 'Automatic backup')}
          subtitle={t('settings.autoBackupSub', 'Daily encrypted snapshot')}
          isOn={autoBackup}
          isDark={isDark}
          onToggle={() => { setAutoBackup(v => !v); toast(t('settings.saved', 'Saved'), 'success'); }}
        />
        <SettingsToggleRow
          icon={<ShieldCheck size={16} />}
          iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
          iconColor={isDark ? "text-blue-400" : "text-blue-600"}
          title={t('settings.wifiOnly', 'Back up over Wi-Fi only')}
          subtitle={t('settings.wifiOnlySub', 'Avoid mobile data')}
          isOn={wifiOnly}
          isDark={isDark}
          onToggle={() => setWifiOnly(v => !v)}
        />
        <SettingsRow
          icon={<Database size={16} />}
          iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
          iconColor={isDark ? "text-purple-400" : "text-purple-600"}
          title={t('settings.lastBackup', 'Last backup')}
          subtitle={lastBackup}
          isDark={isDark}
        />
        <button
          onClick={() => simulate('backup', t('settings.backupDone', 'Backup complete'))}
          disabled={busy === 'backup'}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors active:scale-[0.99] ${isDark ? "text-[var(--accent)] hover:bg-white/5" : "text-[var(--accent)] hover:bg-black/5"} disabled:opacity-50`}
        >
          <Upload size={16} /> {busy === 'backup' ? t('settings.working', 'Working…') : t('settings.createBackup', 'Back up now')}
        </button>
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.exportData', 'Export data')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <button
          onClick={() => simulate('export', t('settings.exportDone', 'Export ready'))}
          disabled={busy === 'export'}
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] hover:opacity-80"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-cyan-500/10" : "bg-cyan-100"}`}>
            <FileJson size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
          </div>
          <div className="flex-1">
            <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.exportJson', 'Export chat history (JSON)')}</div>
            <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{busy === 'export' ? t('settings.working', 'Working…') : t('settings.exportJsonSub', 'Messages, media links, settings')}</div>
          </div>
          <Download size={16} className={`shrink-0 opacity-40 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
        </button>
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.dangerZone', 'Danger zone')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <button
          onClick={() => { simulate('clear', t('settings.cacheCleared', 'Local cache cleared')); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] hover:opacity-80"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-rose-500/10" : "bg-rose-100"}`}>
            <Trash2 size={16} className="text-rose-400" />
          </div>
          <div className="flex-1">
            <div className={`text-sm font-medium text-rose-400`}>{t('settings.clearCache', 'Clear local cache')}</div>
            <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.clearCacheSub', 'Remove stored media and drafts')}</div>
          </div>
        </button>
      </SettingsGroup>
    </SubView>
  );
};
