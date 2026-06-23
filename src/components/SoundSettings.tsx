import React from 'react';
import { useSound } from './SoundContext';
import type { SoundEventType } from '../lib/sounds/config';
import { useI18n } from '../lib/i18n';

type SoundSettingsProps = {
  isDark?: boolean;
};

export const SoundSettings: React.FC<SoundSettingsProps> = ({ isDark = true }) => {
  const { t } = useI18n();
  const { play } = useSound();
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [volume, setVolume] = React.useState(0.7);

  const playTestSound = (event: SoundEventType) => {
    play(event);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? "bg-[#13151b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),_0_4px_8px_rgba(0,0,0,0.3)]" : "bg-[#eaeff4] shadow-[-4px_-4px_8px_rgba(255,255,255,0.9),_6px_6px_12px_rgba(165,175,190,0.4)]"}`}>
        <span className={`text-sm font-bold tracking-wide ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('soundSettings.soundEnabled')}</span>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`relative w-12 h-7 rounded-full p-1 transition-all duration-300 ${soundEnabled ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : isDark ? 'bg-[#0a0b0e] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]' : 'bg-[#ced6e0] shadow-[inset_2px_2px_4px_rgba(165,175,190,0.5)]'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-[#13151b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),_0_4px_8px_rgba(0,0,0,0.3)]" : "bg-[#eaeff4] shadow-[-4px_-4px_8px_rgba(255,255,255,0.9),_6px_6px_12px_rgba(165,175,190,0.4)]"}`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-slate-500"}`}>{t('soundSettings.volume')}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${isDark ? '#f59e0b' : '#0d9488'} ${volume * 100}%, ${isDark ? '#2d3340' : '#cbd5e1'} ${volume * 100}%)`,
          }}
        />
      </div>
      <div className={`flex flex-wrap gap-2 p-3 rounded-2xl ${isDark ? "bg-[#13151b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),_0_4px_8px_rgba(0,0,0,0.3)]" : "bg-[#eaeff4] shadow-[-4px_-4px_8px_rgba(255,255,255,0.9),_6px_6px_12px_rgba(165,175,190,0.4)]"}`}>
        <button onClick={() => playTestSound('incoming-call')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_4px_12px_rgba(234,88,12,0.3)]' : 'bg-orange-500 text-white shadow-[0_4px_8px_rgba(249,115,22,0.3)]'}`}>{t('soundSettings.testCall')}</button>
        <button onClick={() => playTestSound('incoming-chat')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]' : 'bg-blue-500 text-white shadow-[0_4px_8px_rgba(59,130,246,0.3)]'}`}>{t('soundSettings.testChat')}</button>
        <button onClick={() => playTestSound('error')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_4px_12px_rgba(225,29,72,0.3)]' : 'bg-red-500 text-white shadow-[0_4px_8px_rgba(239,68,68,0.3)]'}`}>{t('soundSettings.testError')}</button>
      </div>
    </div>
  );
};
