import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download } from 'lucide-react';

interface BatteryStatusProps {
  isDark: boolean;
}

export const BatteryStatus = ({ isDark }: BatteryStatusProps) => {
  const [level, setLevel] = useState<number>(100);
  const [charging, setCharging] = useState(false);

  React.useEffect(() => {
    let battery: any;
    const updateBattery = () => {
      if (battery) {
        setLevel(Math.round(battery.level * 100));
        setCharging(battery.charging);
      }
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        battery = b;
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', updateBattery);
        battery.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, []);

  return (
    <div className={`p-5 rounded-2xl w-full flex flex-col gap-4 mb-2 ${isDark ? 'bg-[#1a1d24] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,0.03)] border border-white/5' : 'bg-[#e2e8f0] shadow-[inset_4px_4px_8px_rgba(165,175,190,0.4),_inset_-4px_-4px_8px_rgba(255,255,255,0.8)] border border-black/5'}`}>
      <div className="flex justify-between items-center px-1">
        <div className={`text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          <Download size={12} className={charging ? 'text-emerald-500' : ''} />
          Battery
        </div>
        <div className={`text-xs font-bold font-mono ${level <= 20 && !charging ? 'text-red-500' : charging ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-800'}`}>
          {level}% {charging ? '⚡' : ''}
        </div>
      </div>
      <div className={`h-4 rounded-full w-full p-[2px] relative overflow-hidden ${isDark ? 'bg-[#11141c] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]' : 'bg-[#ced6e0] shadow-[inset_2px_2px_5px_rgba(165,175,190,0.5)]'}`}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={`h-full rounded-full shadow-sm ${level <= 20 && !charging ? 'bg-gradient-to-r from-red-600 to-red-400' : charging ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : isDark ? 'bg-gradient-to-r from-cyan-600 to-emerald-400' : 'bg-gradient-to-r from-cyan-400 to-emerald-400'}`}
        />
      </div>
    </div>
  );
};