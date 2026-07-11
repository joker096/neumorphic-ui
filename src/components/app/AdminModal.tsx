import React from 'react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';

export const AdminModal = () => {
  const shareRecording = useAppStore((state) => state.shareRecording);
  const setShareRecording = useAppStore((state) => state.setShareRecording);
  const { t } = useI18n();

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-md border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('admin.title')}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t('admin.description')}</p>
      </div>
      <div className="rounded-md border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{t('admin.shareRecording')}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{t('admin.globalControl')}</div>
          </div>
          <button
            role="switch"
            aria-checked={shareRecording ? "true" as const : "false" as const}
            onClick={() => setShareRecording(!shareRecording)}
            className={`w-12 h-7 rounded-full transition-colors ${shareRecording ? 'bg-green-500' : 'bg-[var(--bg-tertiary)]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${shareRecording ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
