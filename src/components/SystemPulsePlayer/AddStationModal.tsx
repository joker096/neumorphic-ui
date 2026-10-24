import React from "react";
import { motion } from "motion/react";
import { useI18n } from "../../lib/i18n";
import { makeId } from "../../lib/id";

type AddStationModalProps = {
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
textColor, showAddStationModal, setShowAddStationModal,
  stationName, setStationName, stationUrl, setStationUrl, stationAddError, setStationAddError,
  setRadioStations, radioStations, setRadioStationIndex, setIsPlaying, setIsRadioMode
}: AddStationModalProps) => {
  const { t } = useI18n();
  const modalRef = React.useRef<HTMLDivElement>(null);
  if (!showAddStationModal) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowAddStationModal(false);
      return;
    }
    if (e.key !== "Tab") return;
    const node = modalRef.current;
    if (!node) return;
    const focusables = Array.from(
      node.querySelectorAll<HTMLElement>('button, input, [href], textarea, select, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = () => {
    if (!stationName.trim()) {
      setStationAddError(t('systemPlayer.nameRequired'));
      return;
    }
    if (!stationUrl.trim()) {
      setStationAddError(t('systemPlayer.urlRequired'));
      return;
    }
    if (!stationUrl.startsWith("http://") && !stationUrl.startsWith("https://")) {
      setStationAddError(t('systemPlayer.urlInvalid'));
      return;
    }
    const newStation = { id: makeId(), name: stationName.trim(), url: stationUrl.trim(), time: "LIVE", file: null };
    setRadioStations((prev) => [...prev, newStation]);
    setRadioStationIndex(radioStations.length);
    setIsPlaying(true);
    setIsRadioMode(true);
    setShowAddStationModal(false);
  };

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <motion.div
        ref={modalRef}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-station-title"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-[90%] max-w-[320px] rounded-2xl p-6 bg-[var(--player-station-modal-light)] dark:bg-[var(--player-station-modal)]`}
      >
        <h3 id="add-station-title" className={`text-lg font-bold mb-4 ${textColor}`}>{t('systemPlayer.addRadioStation')}</h3>
        <div className="mb-3">
          <label className={`text-xs font-medium ${textColor} opacity-70`}>{t('systemPlayer.stationName')}</label>
          <input
            aria-label={t('systemPlayer.stationNamePlaceholder')}
            type="text"
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
            placeholder={t('systemPlayer.stationNamePlaceholder')}
            className={`w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none bg-white text-[var(--text-primary)] border border-[var(--border-color)] dark:bg-[var(--bg-tertiary)]`}
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label className={`text-xs font-medium ${textColor} opacity-70`}>{t('systemPlayer.streamUrl')}</label>
          <input
            aria-label={t('systemPlayer.streamUrlPlaceholder')}
            type="text"
            value={stationUrl}
            onChange={(e) => setStationUrl(e.target.value)}
            placeholder={t('systemPlayer.streamUrlPlaceholder')}
            className={`w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none bg-white text-[var(--text-primary)] border border-[var(--border-color)] dark:bg-[var(--bg-tertiary)]`}
          />
          {stationAddError && <p role="alert" className="text-xs text-red-400 mt-1">{stationAddError}</p>}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white dark:bg-[var(--player-green)] dark:text-[var(--ink-on-saturate)]`}
          >
            {t('systemPlayer.addStation')}
          </button>
          <button
            onClick={() => setShowAddStationModal(false)}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-black/10 text-[var(--text-primary)] hover:bg-black/20 dark:bg-white/10 dark:text-[var(--text-secondary)] dark:hover:bg-white/20`}
          >
            {t('systemPlayer.cancel')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};




