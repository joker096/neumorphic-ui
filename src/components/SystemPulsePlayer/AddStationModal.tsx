import React from "react";
import { motion } from "motion/react";

type AddStationModalProps = {
  isDark?: boolean;
  textColor?: string;
  showAddStationModal: boolean;
  setShowAddStationModal: (v: boolean) => void;
  stationName: string;
  setStationName: (v: string) => void;
  stationUrl: string;
  setStationUrl: (v: string) => void;
  stationAddError: string;
  setStationAddError: (v: string) => void;
  setRadioStations: (v: any[] | ((prev: any[]) => any[])) => void;
  radioStations: any[];
  setRadioStationIndex: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  setIsRadioMode: (v: boolean) => void;
};

export const AddStationModal = ({
  isDark = false, textColor, showAddStationModal, setShowAddStationModal,
  stationName, setStationName, stationUrl, setStationUrl, stationAddError, setStationAddError,
  setRadioStations, radioStations, setRadioStationIndex, setIsPlaying, setIsRadioMode
}: AddStationModalProps) => {
  if (!showAddStationModal) return null;

  const handleSubmit = () => {
    if (!stationName.trim()) {
      setStationAddError("Name is required");
      return;
    }
    if (!stationUrl.trim()) {
      setStationAddError("URL is required");
      return;
    }
    if (!stationUrl.startsWith("http://") && !stationUrl.startsWith("https://")) {
      setStationAddError("URL must start with http:// or https://");
      return;
    }
    const newStation = { id: Math.random().toString(36).substr(2, 9), name: stationName.trim(), url: stationUrl.trim(), time: "LIVE", file: null };
    setRadioStations((prev) => [...prev, newStation]);
    setRadioStationIndex(radioStations.length);
    setIsPlaying(true);
    setIsRadioMode(true);
    setShowAddStationModal(false);
  };

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-[90%] max-w-[320px] rounded-2xl p-6 ${isDark ? "bg-[#2a3036]" : "bg-[#e8ecf4]"}`}
      >
        <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Add Radio Station</h3>
        <div className="mb-3">
          <label className={`text-xs font-medium ${textColor} opacity-70`}>Station Name</label>
          <input
            type="text"
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
            placeholder="e.g. MetroPulse FM"
            className={`w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white border border-black/10"}`}
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label className={`text-xs font-medium ${textColor} opacity-70`}>Stream URL</label>
          <input
            type="text"
            value={stationUrl}
            onChange={(e) => setStationUrl(e.target.value)}
            placeholder="https://stream.example.com/live"
            className={`w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white border border-black/10"}`}
          />
          {stationAddError && <p className="text-xs text-red-400 mt-1">{stationAddError}</p>}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold ${isDark ? "bg-[#5cc25c] text-white" : "bg-green-600 text-white"}`}
          >
            Add Station
          </button>
          <button
            onClick={() => setShowAddStationModal(false)}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold ${isDark ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-black/10 text-slate-600 hover:bg-black/20"}`}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
