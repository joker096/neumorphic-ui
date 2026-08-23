import { Video, Phone, Clock, Trash2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { useAppStore } from '../../store';
import { runRecordingRetention } from '../../lib/recordingRetention';
import { toast } from 'sonner';

interface CallRecordingsSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

const RETENTION_OPTIONS = [0, 7, 30, 90] as const;
type RetentionOption = typeof RETENTION_OPTIONS[number];

export const CallRecordingsSection = ({ isDark = false, onBack }: CallRecordingsSectionProps) => {
  const { t } = useI18n();
  const saveAudioRecordings = useAppStore((s) => s.saveAudioRecordings);
  const setSaveAudioRecordings = useAppStore((s) => s.setSaveAudioRecordings);
  const saveVideoRecordings = useAppStore((s) => s.saveVideoRecordings);
  const setSaveVideoRecordings = useAppStore((s) => s.setSaveVideoRecordings);
  const recordingsRetentionDays = useAppStore((s) => s.recordingsRetentionDays);
  const setRecordingsRetentionDays = useAppStore((s) => s.setRecordingsRetentionDays);

  const retentionLabel =
    recordingsRetentionDays <= 0
      ? t('settings.retention.forever', 'Forever')
      : t('settings.retention.days', '{days} days').replace('{days}', String(recordingsRetentionDays));

  const cycleRetention = () => {
    const idx = RETENTION_OPTIONS.indexOf(recordingsRetentionDays as RetentionOption);
    const next = RETENTION_OPTIONS[(idx + 1) % RETENTION_OPTIONS.length];
    setRecordingsRetentionDays(next);
  };

  const handleCleanNow = async () => {
    const removed = await runRecordingRetention();
    if (removed > 0) {
      toast.success(t('settings.recordingsCleaned', 'Removed {n} old recordings').replace('{n}', String(removed)));
    } else {
      toast(t('settings.recordingsNothingToClean', 'No recordings to remove'));
    }
  };

  return (
    <SubView title={t('settings.callRecordings', 'Call recordings')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.recordingsSaveSection', 'Save recordings')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsToggleRow
          icon={<Phone size={16} />}
          iconBg={isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}
          iconColor={isDark ? 'text-emerald-400' : 'text-emerald-600'}
          title={t('settings.saveAudioCalls', 'Save audio calls')}
          subtitle={t('settings.saveAudioCallsSubtitle', 'Keep audio call recordings on this device')}
          isOn={saveAudioRecordings}
          isDark={isDark}
          onToggle={() => setSaveAudioRecordings(!saveAudioRecordings)}
        />
        <SettingsToggleRow
          icon={<Video size={16} />}
          iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title={t('settings.saveVideoCalls', 'Save video calls')}
          subtitle={t('settings.saveVideoCallsSubtitle', 'Video recordings use a lot of storage space')}
          isOn={saveVideoRecordings}
          isDark={isDark}
          onToggle={() => setSaveVideoRecordings(!saveVideoRecordings)}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.recordingsCleanupSection', 'Automatic cleanup')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Clock size={16} />}
          iconBg={isDark ? 'bg-purple-500/10' : 'bg-purple-100'}
          iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
          title={t('settings.recordingsRetention', 'Delete recordings older than')}
          subtitle={t('settings.recordingsRetentionSubtitle', 'Periodically remove old calls and video calls')}
          isDark={isDark}
          value={retentionLabel}
          onClick={cycleRetention}
        />
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg={isDark ? 'bg-rose-500/10' : 'bg-rose-100'}
          iconColor={isDark ? 'text-rose-400' : 'text-rose-600'}
          title={t('settings.recordingsCleanNow', 'Delete old recordings now')}
          subtitle={t('settings.recordingsCleanNowSubtitle', 'Remove recordings past the retention period immediately')}
          isDark={isDark}
          onClick={handleCleanNow}
        />
      </SettingsGroup>
    </SubView>
  );
};
