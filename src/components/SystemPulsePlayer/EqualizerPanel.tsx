import React from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX, ArrowLeft } from "lucide-react";
import type { EQPreset } from "./utils";

type EqualizerPanelProps = {
  isDark?: boolean;
  isRadioMode: boolean;
  textColor?: string;
  volume: number;
  setVolume: (v: number) => void;
  eqGains: number[];
  setEqGains: (v: number[] | ((prev: number[]) => number[])) => void;
  showEq: boolean;
  setShowEq: (v: boolean) => void;
  currentPreset: string;
  setCurrentPreset: (v: string) => void;
  savedPresets: EQPreset[];
  setSavedPresets: (v: EQPreset[] | ((prev: EQPreset[]) => EQPreset[])) => void;
  applyPreset: (preset: EQPreset) => void;
  savePreset: () => void;
  deletePreset: (id: string) => void;
};

export const EqualizerPanel = ({
  isDark = false, isRadioMode, textColor, volume, setVolume, eqGains, setEqGains,
  showEq, setShowEq, currentPreset, setCurrentPreset, savedPresets, setSavedPresets,
  applyPreset, savePreset, deletePreset
}: EqualizerPanelProps) => {
  const resetEq = () => setEqGains([0, 0, 0, 0, 0]);

  return (
    <motion.div
      key="eq-view"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col w-full h-[60vh] sm:h-[500px] md:h-[450px] relative z-10"
    >
      <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)]/[0.05] pb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowEq(false)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setShowEq(false); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-white/5 text-[#e6d6b8] hover:bg-white/10" : "bg-black/5 text-slate-700 hover:bg-black/10"} transition-colors`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span className={`text-[13px] font-bold tracking-[0.1em] uppercase ${textColor}`}>Audio Settings</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col gap-6 px-2 overflow-y-auto">
        <div>
          <div className={`text-[11px] font-bold tracking-widest uppercase mb-3 ${textColor} opacity-70`}>Master Volume</div>
          <div className="flex items-center gap-4">
            <div className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 shadow-[4px_4px_8px_rgba(0,0,0,0.4),_-2px_-2px_4px_rgba(255,255,255,0.05)]" : "bg-black/5 hover:bg-black/10 shadow-[4px_4px_8px_rgba(165,175,190,0.4),_-2px_-2px_4px_rgba(255,255,255,0.8)]"}`} title="Volume Min" onClick={() => setVolume(0)}>
              <VolumeX size={16} className={textColor} />
            </div>
            <input
              type="range"
              min="0" max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className={`flex-1 h-3 rounded-full appearance-none outline-none ${isDark ? "bg-black/20" : "bg-black/10"}`}
              style={{
                background: `linear-gradient(to right, ${isRadioMode ? (isDark ? '#5cc25c' : '#2cab50') : (isDark ? '#e2845c' : '#ab502c')} ${volume}%, ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'} ${volume}%)`
              }}
            />
            <div className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 shadow-[4px_4px_8px_rgba(0,0,0,0.4),_-2px_-2px_4px_rgba(255,255,255,0.05)]" : "bg-black/5 hover:bg-black/10 shadow-[4px_4px_8px_rgba(165,175,190,0.4),_-2px_-2px_4px_rgba(255,255,255,0.8)]"}`} title="Volume Max" onClick={() => setVolume(100)}>
              <Volume2 size={16} className={textColor} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className={`text-[11px] font-bold tracking-widest uppercase mb-6 ${textColor} opacity-70`}>5-Band Equalizer</div>
          <div className="flex items-end justify-between h-[150px] px-2 gap-2">
            {[60, 230, 910, "3.6k", "14k"].map((freq, i) => (
              <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-[10px] font-mono opacity-50">{eqGains[i] > 0 ? `+${eqGains[i]}` : eqGains[i]}</div>
                <input
                  type="range"
                  min="-12" max="12"
                  value={eqGains[i]}
                  onChange={(e) => {
                    const newGains = [...eqGains];
                    newGains[i] = Number(e.target.value);
                    setEqGains(newGains);
                  }}
                  className="w-1.5 h-[80px] sm:h-[100px] rounded-full appearance-none outline-none slider-vertical"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    WebkitAppearance: 'slider-vertical',
                    background: isDark ? '[var(--bg-tertiary)]' : '#cbd5e1'
                  }}
                />
                <div className="text-[9px] font-bold mt-2">{freq}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <button
              onClick={resetEq}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} transition-colors`}
            >
              Reset EQ
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


