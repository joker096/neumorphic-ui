import { useState } from 'react';
import { Shield, Key, Lock, Unlock, Timer, ShieldCheck } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, ToggleSwitch, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import { cryptoCore } from '../../lib/crypto/cryptoCore';
import { useAppStore } from '../../store';

interface SecuritySectionProps {
  isDark?: boolean;
  onBack: () => void;
  t: (key: string) => string;
}

export const SecuritySection = ({ isDark = false, onBack, t }: SecuritySectionProps) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinMode, setPinMode] = useState<'set' | 'remove'>('set');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const setAppLock = useAppStore(s => s.setAppLock);
  const appLockHashedPIN = useAppStore(s => s.appLockHashedPIN);
  const hasPin = appLockHashedPIN !== null;
  const twoFactor = useAppStore(s => s.twoFactor);
  const setTwoFactor = useAppStore(s => s.setTwoFactor);
  const deadMansSwitch = useAppStore(s => s.deadMansSwitch);
  const setDeadMansSwitch = useAppStore(s => s.setDeadMansSwitch);

  const handlePinSet = async () => {
    if (pinValue.length < 4) {
      toast.error(t('settings.pinTooShort'));
      return;
    }
    const result = await cryptoCore.hashAppLockPIN(pinValue);
    setAppLock(result.hash, result.saltHex);
    setShowPinInput(false);
    setPinValue('');
    toast.success(t('settings.pinSet'));
  };

  const handlePinRemove = async () => {
    if (pinValue.length < 4) return;
    const currentSalt = useAppStore.getState().appLockSalt || '';
    const hashed = await cryptoCore.hashAppLockPIN(pinValue, currentSalt);
    if (hashed.hash !== useAppStore.getState().appLockHashedPIN) {
      toast.error(t('settings.pinIncorrect'));
      return;
    }
    setAppLock('', '');
    setShowPinInput(false);
    setPinValue('');
    toast.success(t('settings.pinRemoved'));
  };

  const startPinAction = (mode: 'set' | 'remove') => {
    setPinMode(mode);
    setPinValue('');
    setShowPinInput(true);
  };

  const confirmPinAction = () => {
    if (pinMode === 'set') handlePinSet();
    else handlePinRemove();
  };

  const handleWipeData = () => {
    setShowWipeConfirm(true);
  };

  const handleConfirmWipe = async () => {
    setShowWipeConfirm(false);
    try {
      await cryptoCore.secureWipe();
      toast.success(t('settings.dataWiped'));
    } catch {
      toast.error(t('settings.wipeFailed'));
    }
  };

  const cycleDeadMansSwitch = () => {
    const options = ['Off', '1 week', '1 month', '3 months', '6 months', '1 year'];
    const idx = options.indexOf(deadMansSwitch as string);
    const next = options[(idx + 1) % options.length];
    setDeadMansSwitch(next);
  };

  return (
    <SubView title={t('settings.security')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.appLock')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={hasPin ? <Lock size={16} /> : <Unlock size={16} />}
          iconBg={hasPin ? (isDark ? "bg-emerald-500/10" : "bg-emerald-100") : (isDark ? "bg-gray-500/10" : "bg-gray-100")}
          iconColor={hasPin ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-gray-400" : "text-gray-500")}
          title={t('settings.pinLock')}
          subtitle={hasPin ? t('settings.pinEnabled') : t('settings.pinDisabled')}
          isDark={isDark}
          rightElement={
            <ToggleSwitch
              isOn={hasPin}
              onToggle={() => {
                if (hasPin) startPinAction('remove');
                else startPinAction('set');
              }}
              isDark={isDark}
              onIcon={<Lock size={14} />}
              offIcon={<Unlock size={14} />}
            />
          }
          onClick={() => {
            if (hasPin) startPinAction('remove');
            else startPinAction('set');
          }}
        />
        {showPinInput && (
          <div className="px-4 py-3 border-t border-[var(--border-color)] dark:border-[var(--border-color)]">
            <label htmlFor="security-pin-input" className="sr-only">{t('settings.enterPin')}</label>
            <input
              id="security-pin-input"
              type="password"
              maxLength={10}
              placeholder={t('settings.enterPin')}
              value={pinValue}
              onChange={e => setPinValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmPinAction()}
              autoComplete={pinMode === 'set' ? 'new-password' : 'current-password'}
              inputMode="numeric"
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800"}`}
              autoFocus
            />
            <button
              onClick={confirmPinAction}
              className={`mt-2 w-full py-2 rounded-lg text-xs font-medium transition-colors ${isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
            >
              {pinMode === 'set' ? t('settings.confirmPin') : t('settings.removePin')}
            </button>
            <div aria-live="polite" role="status" className="sr-only">
              {pinValue.length > 0 && pinValue.length < 4 ? t('settings.pinTooShort') : ''}
            </div>
          </div>
        )}
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.twoFactor')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsToggleRow
          title={t('settings.twoFactorAuth')}
          subtitle={t('settings.twoFactorSubtitle')}
          isOn={twoFactor}
          onToggle={() => setTwoFactor(!twoFactor)}
          isDark={isDark}
          toggleOnIcon={<ShieldCheck size={14} />}
          toggleOffIcon={<ShieldCheck size={14} />}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.autoWipe')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Timer size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.deadMansSwitch')}
          subtitle={t('settings.deadMansSwitchSubtitle')}
          value={deadMansSwitch as string}
          isDark={isDark}
          onClick={cycleDeadMansSwitch}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.dangerZone')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Shield size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.wipeAllData')}
          subtitle={t('settings.wipeSubtitle')}
          isDark={isDark}
          onClick={handleWipeData}
        />
      </SettingsGroup>

      <ConfirmModal
        isOpen={showWipeConfirm}
        title={t('settings.wipeAllData')}
        message={t('settings.confirmWipe')}
        confirmLabel={t('settings.wipeAllData')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmWipe}
        onCancel={() => setShowWipeConfirm(false)}
      />
    </SubView>
  );
};




