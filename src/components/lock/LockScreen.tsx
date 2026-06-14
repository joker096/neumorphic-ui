import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { cryptoCore } from '../../lib/cryptoCore';
import { useAppStore } from '../../store';

interface LockScreenProps {
  onUnlocked: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlocked }) => {
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const appLockHashedPIN = useAppStore((s) => s.appLockHashedPIN);
  const appLockSalt = useAppStore((s) => s.appLockSalt);

  const handleSubmit = async () => {
    if (!appLockHashedPIN || !appLockSalt) {
      onUnlocked();
      return;
    }
    const { hash } = await cryptoCore.hashAppLockPIN(pin, appLockSalt);
    if (hash === appLockHashedPIN) {
      onUnlocked();
    } else {
      setError(t('lock.invalidPin'));
      setPin('');
    }
  };

  const handleDigit = (d: string) => {
    setError('');
    const next = pin + d;
    setPin(next);
  };

  React.useEffect(() => {
    if (pin.length >= 4) {
      handleSubmit();
    }
  }, [pin]);

  if (!appLockHashedPIN) {
    onUnlocked();
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0d0f12] text-white gap-6 p-8">
      <div className="text-2xl font-bold mb-4">{t('lock.enterPin')}</div>
      <div className="flex gap-2 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 ${pin.length > i ? 'bg-orange-500 border-orange-500' : 'border-gray-500'}`} />
        ))}
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9'].map((d) => (
          <button key={d} onClick={() => handleDigit(d)}
            className="w-16 h-16 rounded-full bg-[#1a1d23] text-white text-xl shadow-lg active:scale-95"
          >{d}</button>
        ))}
        <div />
        <button onClick={() => handleDigit('0')}
          className="w-16 h-16 rounded-full bg-[#1a1d23] text-white text-xl shadow-lg active:scale-95"
        >0</button>
        <button onClick={() => { setPin(p => p.slice(0, -1)); setError(''); }}
          className="w-16 h-16 rounded-full bg-[#1a1d23] text-orange-500 text-sm shadow-lg active:scale-95"
        >⌫</button>
      </div>
    </div>
  );
};
