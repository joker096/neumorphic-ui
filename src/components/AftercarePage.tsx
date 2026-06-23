import React from 'react';
import { useAppStore } from '../store';
import { callRecorderService } from '../lib/callRecorderService';
import { useI18n } from '../lib/i18n';

export const AftercarePage = () => {
  const { t } = useI18n();
  const shareRecording = useAppStore((state) => state.shareRecording);
  const setShareRecording = useAppStore((state) => state.setShareRecording);
  const recordings = useAppStore((state) => state.recordings);

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#1a1d24] p-4">
        <h2 className="text-lg font-bold text-white">{t('aftercare.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">{t('aftercare.description')}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1a1d24] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">{t('aftercare.shareRecording')}</div>
            <div className="text-xs text-gray-400 mt-1">
              {shareRecording ? t('aftercare.shareRecordingOn') : t('aftercare.shareRecordingOff')}
            </div>
          </div>
          <button
            onClick={() => setShareRecording(!shareRecording)}
            className={`w-12 h-7 rounded-full transition-colors ${shareRecording ? 'bg-green-500' : 'bg-white/20'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${shareRecording ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
