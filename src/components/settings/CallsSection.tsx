import { Video, Phone, Clock, Trash2, Share2, History, FolderOpen, PhoneIncoming } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { useAppStore } from '../../store';
import { runRecordingRetention } from '../../lib/recordingRetention';
import { callManager } from '../../lib/call/CallManager';
import { MOCK_CALLS } from '../../constants/mockData';
import { toast } from 'sonner';

interface CallsSectionProps {
  isDark?: boolean;
  onBack: () => void;
  setSubView?: (view: string | null) => void;
}

type RetentionOption = 0 | 7 | 30 | 90;

export const CallsSection = ({ isDark = false, onBack, setSubView }: CallsSectionProps) => {
  const { t } = useI18n();
  const premium = useAppStore((s) => s.premiumEntitlement.premium);
  const saveAudioRecordings = useAppStore((s) => s.saveAudioRecordings);
  const setSaveAudioRecordings = useAppStore((s) => s.setSaveAudioRecordings);
  const saveVideoRecordings = useAppStore((s) => s.saveVideoRecordings);
  const setSaveVideoRecordings = useAppStore((s) => s.setSaveVideoRecordings);
  const shareRecording = useAppStore((s) => s.shareRecording);
  const setShareRecording = useAppStore((s) => s.setShareRecording);
  const recordingsRetentionDays = useAppStore((s) => s.recordingsRetentionDays);
  const setRecordingsRetentionDays = useAppStore((s) => s.setRecordingsRetentionDays);

  const retentionLabel =
    recordingsRetentionDays <= 0
      ? t('settings.retention.forever', 'Forever')
      : t('settings.retention.days', '{days} days').replace('{days}', String(recordingsRetentionDays));

  const retentionOptions: RetentionOption[] = premium ? [0, 7, 30, 90] : [7, 30, 90];

  const cycleRetention = () => {
    const idx = retentionOptions.indexOf(recordingsRetentionDays as RetentionOption);
    const next = retentionOptions[(idx + 1) % retentionOptions.length];
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
    <SubView title={t('call.callsSettings', 'Call settings')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.callNavSection', 'Call tools')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<History size={16} />}
          iconBg={isDark ? 'bg-sky-500/10' : 'bg-sky-100'}
          iconColor={isDark ? 'text-sky-400' : 'text-sky-600'}
          title={t('call.callHistory')}
          subtitle={t('call.callHistorySubtitle', 'Recent calls and meetings')}
          isDark={isDark}
          onClick={() => setSubView?.('callLog')}
        />
        <SettingsRow
          icon={<PhoneIncoming size={16} />}
          iconBg={isDark ? 'bg-cyan-500/10' : 'bg-cyan-100'}
          iconColor={isDark ? 'text-cyan-400' : 'text-cyan-600'}
          title={t('call.simulateIncoming')}
          subtitle={t('call.incomingCall')}
          isDark={isDark}
          onClick={() => callManager.startIncomingCall('incoming_demo', MOCK_CALLS[0].name, 'audio')}
        />
        <SettingsRow
          icon={<FolderOpen size={16} />}
          iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title={t('nav.recordings', 'Call Log')}
          subtitle={t('hub.recordingsSubtitle', 'Call Logs')}
          isDark={isDark}
          onClick={() => setSubView?.('recordings')}
        />
      </SettingsGroup>

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
        <SettingsToggleRow
          icon={<Share2 size={16} />}
          iconBg={isDark ? 'bg-violet-500/10' : 'bg-violet-100'}
          iconColor={isDark ? 'text-violet-400' : 'text-violet-600'}
          title={t('settings.shareRecording', 'Share recordings')}
          subtitle={t('settings.shareRecordingSubtitle', 'Allow sharing saved call recordings')}
          isOn={shareRecording}
          isDark={isDark}
          onToggle={() => setShareRecording(!shareRecording)}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.recordingsCleanupSection', 'Automatic cleanup')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Clock size={16} />}
          iconBg={isDark ? 'bg-purple-500/10' : 'bg-purple-100'}
          iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
          title={t('settings.recordingsRetention', 'Delete recordings older than')}
          subtitle={premium ? t('settings.recordingsRetentionSubtitle', 'Periodically remove old calls and video calls') : t('premium.gatingRetention', 'Longer retention is available with Premium')}
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
