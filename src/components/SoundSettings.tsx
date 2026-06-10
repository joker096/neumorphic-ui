import React from 'react';
import { useSound } from './SoundContext';
import type { SoundEventType } from '../lib/sounds/config';

export const SoundSettings: React.FC = () => {
  const { play } = useSound();
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [volume, setVolume] = React.useState(0.7);

  const playTestSound = (event: SoundEventType) => {
    play(event);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Звук включен</span>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`w-10 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-gray-500'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs">Громкость:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="flex-1 h-2 bg-gray-500 rounded-full appearance-none"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => playTestSound('incoming-call')} className="px-3 py-1 rounded-full text-xs bg-orange-500 text-white">Тест звонка</button>
        <button onClick={() => playTestSound('incoming-chat')} className="px-3 py-1 rounded-full text-xs bg-blue-500 text-white">Тест чата</button>
        <button onClick={() => playTestSound('error')} className="px-3 py-1 rounded-full text-xs bg-red-500 text-white">Тест ошибки</button>
      </div>
    </div>
  );
};
