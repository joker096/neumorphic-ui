import React from 'react';
import { useSound } from './SoundContext';
import type { SoundEventType } from '../../lib/sounds/config';
import { useI18n } from '../../lib/i18n';

type SoundSettingsProps = {};

export const SoundSettings: React.FC<SoundSettingsProps> = ({}) => {
  const { t } = useI18n();
  const { play } = useSound();
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [volume, setVolume] = React.useState(0.7);

  const playTestSound = (event: SoundEventType) => {
    play(event);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 rounded-md bg-[var(--bg-secondary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),_0_4px_8px_rgba(0,0,0,0.3)]">
        <span className="text-sm font-bold tracking-wide text-[var(--text-primary)]">{t('soundSettings.soundEnabled')}</span>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="relative w-12 h-7 rounded-full p-1 transition-all duration-300 bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--bg-secondary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),_0_4px_8px_rgba(0,0,0,0.3)]">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{t('soundSettings.volume')}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--accent) ${volume * 100}%, var(--bg-tertiary) ${volume * 100}%)`,
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2 p-3 rounded-md bg-[var(--bg-secondary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),_0_4px_8px_rgba(0,0,0,0.3)]">
        <button onClick={() => playTestSound('incoming-call')} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-orange-600 to-orange-500 text-[var(--text-primary)] shadow-[0_4px_12px_rgba(234,88,12,0.3)]">{t('soundSettings.testCall')}</button>
        <button onClick={() => playTestSound('incoming-chat')} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-sky-600 to-sky-500 text-[var(--text-primary)] shadow-[0_4px_12px_rgba(2,132,199,0.3)]">{t('soundSettings.testChat')}</button>
        <button onClick={() => playTestSound('error')} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-rose-600 to-rose-500 text-[var(--text-primary)] shadow-[0_4px_12px_rgba(225,29,72,0.3)]">{t('soundSettings.testError')}</button>
      </div>
    </div>
  );
};

