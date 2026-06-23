import React from 'react';
import { useAppStore } from '../store';
import { useI18n } from '../lib/i18n';
import { callRecorderService } from '../lib/callRecorderService';

export const RecordingsFlowForCampaign = () => {
  const recordings = useAppStore((state) => state.recordings);
  const { t } = useI18n();

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-2xl border border-white/10 bg-[#1a1d24] p-4">
        <h2 className="text-lg font-bold text-white">{t('recordings.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">{t('recordings.description')}</p>
      </div>
      {recordings.map((rec: any) => (
        <div key={rec.id} className="rounded-2xl border border-white/10 bg-[#1a1d24] p-4">
          <div className="text-sm text-white">{rec.title || rec.id}</div>
          <div className="text-xs text-gray-400 mt-1">{rec.callType} • {rec.duration}s</div>
        </div>
      ))}
    </div>
  );
};
