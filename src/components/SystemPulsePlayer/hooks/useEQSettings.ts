import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from 'sonner';
import { loadEQPresets, saveUserPreset, deleteUserPreset } from "../utils";
import type { EQPreset } from "../utils";

export interface EQSettingsState {
  volume: number;
  eqGains: number[];
  currentPreset: string;
  savedPresets: EQPreset[];
  showPresetMenu: boolean;
  showSavePresetModal: boolean;
  newPresetName: string;
}

export interface EQSettingsActions {
  setVolume: (v: number) => void;
  setEqGains: (v: number[] | ((prev: number[]) => number[])) => void;
  setCurrentPreset: (v: string) => void;
  setSavedPresets: (v: EQPreset[] | ((prev: EQPreset[]) => EQPreset[])) => void;
  setShowPresetMenu: (v: boolean) => void;
  setShowSavePresetModal: (v: boolean) => void;
  setNewPresetName: (v: string) => void;
  applyPreset: (preset: EQPreset) => void;
  savePreset: () => void;
  deletePreset: (id: string) => void;
  initWebAudio: () => void;
}

export const useEQSettings = (
  audioRef: React.RefObject<HTMLAudioElement | null>,
  audioCtxRef: React.RefObject<AudioContext | null>
): EQSettingsState & EQSettingsActions => {
  const [volume, setVolume] = useState(100);
  const [eqGains, setEqGains] = useState([0, 0, 0, 0, 0]);
  const [currentPreset, setCurrentPreset] = useState("Flat");
  const [savedPresets, setSavedPresets] = useState<EQPreset[]>(loadEQPresets());
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      if (eqNodesRef.current) {
        eqNodesRef.current = [];
      }
    };
  }, []);

  useEffect(() => {
    if (eqNodesRef.current.length > 0) {
      eqGains.forEach((gain, i) => {
        eqNodesRef.current[i].gain.value = gain;
      });
    }
  }, [eqGains]);

  const initWebAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current && audioRef.current) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        audioRef.current.crossOrigin = "anonymous";
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;
        const freqs = [60, 230, 910, 3600, 14000];
        const filters = freqs.map(f => {
          const filter = ctx.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = f;
          filter.Q.value = 1;
          filter.gain.value = 0;
          return filter;
        });
        eqNodesRef.current = filters;
        source.connect(filters[0]);
        for (let i = 0; i < filters.length - 1; i++) {
          filters[i].connect(filters[i + 1]);
        }
        filters[filters.length - 1].connect(ctx.destination);
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {
      console.warn("Web Audio API not supported or CORS blocked.", e);
    }
  }, []);

  const applyPreset = useCallback((preset: EQPreset) => {
    setEqGains(preset.gains);
    setCurrentPreset(preset.name);
    toast.info(`Applied: ${preset.name}`);
  }, []);

  const savePreset = useCallback(() => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a name for your preset");
      return;
    }
    const success = saveUserPreset({
      name: newPresetName.trim(),
      gains: [...eqGains],
      description: "Custom preset",
      userCreated: true,
    });
    if (success) {
      setSavedPresets(loadEQPresets());
      setCurrentPreset(newPresetName.trim());
      setNewPresetName("");
      setShowSavePresetModal(false);
      toast.success("Preset saved!");
    } else {
      toast.error("Failed to save preset");
    }
  }, [newPresetName, eqGains]);

  const deletePreset = useCallback((id: string) => {
    const deleted = deleteUserPreset(id);
    if (deleted) {
      setSavedPresets(loadEQPresets());
      setCurrentPreset("Flat");
      toast.success("Preset deleted");
    }
  }, []);

  return {
    volume, setVolume,
    eqGains, setEqGains,
    currentPreset, setCurrentPreset,
    savedPresets, setSavedPresets,
    showPresetMenu, setShowPresetMenu,
    showSavePresetModal, setShowSavePresetModal,
    newPresetName, setNewPresetName,
    applyPreset,
    savePreset,
    deletePreset,
    initWebAudio,
  };
};
