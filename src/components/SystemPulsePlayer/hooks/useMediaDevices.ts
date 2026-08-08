import { useState, useEffect } from "react";
import { detectAudioOutputDevices } from "../utils";
import type { MediaDeviceInfo } from "../utils";

export interface MediaDevicesState {
  audioDevices: { audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] };
  selectedOutputDevice: string;
  hasHeadphones: boolean;
  showDeviceMenu: boolean;
}

export interface MediaDevicesActions {
  setAudioDevices: (v: { audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] }) => void;
  setSelectedOutputDevice: (v: string) => void;
  setHasHeadphones: (v: boolean) => void;
  setShowDeviceMenu: (v: boolean) => void;
}

export const useMediaDevices = (audioCtxRef: React.RefObject<AudioContext | null>): MediaDevicesState & MediaDevicesActions => {
  const [audioDevices, setAudioDevices] = useState<{ audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] }>({ audioOutput: [], audioInput: [] });
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("");
  const [hasHeadphones, setHasHeadphones] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  useEffect(() => {
    const detectDevices = async () => {
      try {
        const devices = await (navigator.mediaDevices?.enumerateDevices().catch(() => []) as Promise<MediaDeviceInfo[]>);
        setAudioDevices({
          audioOutput: devices.filter(d => d.kind === 'audiooutput') || [],
          audioInput: devices.filter(d => d.kind === 'audioinput') || [],
        });
        const hasHeadphones = devices.some(d => d.kind === 'audiooutput' && (d.label?.toLowerCase().includes('headphone') || d.label?.toLowerCase().includes('earphone') || d.label?.toLowerCase().includes('headset')));
        setHasHeadphones(hasHeadphones);
      } catch (e) {
        console.warn("Device detection failed:", e);
      }
    };
    detectDevices();
    const interval = setInterval(detectDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedOutputDevice && audioCtxRef.current) {
      try {
        (audioCtxRef.current as any).selectDevice?.(selectedOutputDevice);
      } catch (e) {
        console.warn("Failed to select device:", e);
      }
    }
  }, [selectedOutputDevice, audioCtxRef]);

  return {
    audioDevices, setAudioDevices,
    selectedOutputDevice, setSelectedOutputDevice,
    hasHeadphones, setHasHeadphones,
    showDeviceMenu, setShowDeviceMenu,
  };
};
