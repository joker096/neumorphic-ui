import React from 'react';
import { createPortal } from 'react-dom';
import { Download, AlertTriangle, CheckCircle2, X, FileJson, FileSpreadsheet } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import type { ImportIssue } from '../../lib/crm/import';
import { useCrmImportWizard } from './useCrmImportWizard';

export const CrmImportWizard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const {
    mode, setMode, text, setText, password, setPassword,
    defaultCurrency, setDefaultCurrency, skipDuplicates, setSkipDuplicates,
    preview, bundleResult, error, msgOk, busy, fileRef,
    reset, handleFile, handleParse, handleImport, handleExportBundle,
  } = useCrmImportWizard();

  const fmt = (s: string) => (s === 'csv' ? t('crm.import.csv', 'CSV') : t('crm.import.json', 'JSON'));

  const issueText = (iss: ImportIssue): string => {
    switch (iss.code) {
      case 'unknown-status':
        return t('crm.import.issUnknownStatus', { value: iss.value ?? '' });
      case 'unknown-stage':
        return t('crm.import.issUnknownStage', { value: iss.value ?? '' });
      case 'unknown-priority':
        return t('crm.import.issUnknownPriority', { value: iss.value ?? '' });
      default:
        return t('crm.import.issRowSkipped');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('crm.import.title', 'Import CRM data')}</h3>
          <button
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
            className="min-w-11 min-h-11 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1.5 mb-4">
          <button
            onClick={() => { setMode('text'); reset(); }}
            className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl text-sm font-semibold transition-all ${
              mode === 'text' ? 'neo-pressed text-[var(--accent)]' : 'text-[var(--text-secondary)]'
            }`}
          >
            <FileSpreadsheet size={14} /> {t('crm.import.fromCsv', 'CSV / JSON')}
          </button>
          <button
            onClick={() => { setMode('bundle'); reset(); }}
            className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl text-sm font-semibold transition-all ${
              mode === 'bundle' ? 'neo-pressed text-[var(--accent)]' : 'text-[var(--text-secondary)]'
            }`}
          >
            <FileJson size={14} /> {t('crm.import.fromBundle', 'Native backup')}
          </button>
        </div>

        {mode === 'text' ? (
          <div className="space-y-3">
            <textarea
              aria-label={t('crm.import.placeholder', 'Paste CSV or JSON here…')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('crm.import.placeholder', 'Paste CSV or JSON here…')}
              className="w-full h-36 resize-y rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-[var(--text-secondary)]">
                {t('crm.import.file', 'File')}:
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  className="ml-2 text-xs"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                {t('crm.import.currency', 'Currency')}:
                <input
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase().slice(0, 3) || 'USD')}
                  className="ml-1 w-14 px-2 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                />
                {t('crm.import.skipDup', 'Skip duplicates')}
              </label>
            </div>

            <button
              onClick={handleParse}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-50"
            >
              {t('crm.import.parse', 'Preview')}
            </button>

            {preview && (
              <div className="rounded-xl border border-[var(--border-color)] p-3 space-y-2">
                <div className="text-sm text-[var(--text-primary)] font-semibold">
                  {fmt(preview.format)} · {preview.plan.stats.contacts} {t('crm.import.contacts', 'contacts')},{' '}
                  {preview.plan.stats.deals} {t('crm.import.deals', 'deals')}, {preview.plan.stats.tasks} {t('crm.import.tasks', 'tasks')}
                  {preview.plan.stats.warnings > 0 && (
                    <span className="text-amber-500"> · {preview.plan.stats.warnings} {t('crm.import.warns', 'warnings')}</span>
                  )}
                  {preview.plan.stats.errors > 0 && (
                    <span className="text-red-500"> · {preview.plan.stats.errors} {t('crm.import.errs', 'errors')}</span>
                  )}
                </div>
                {preview.plan.contacts.slice(0, 5).map((c, i) => (
                  <div key={i} className="text-xs text-[var(--text-secondary)]">
                    • {c.displayName} {c.phone ? `· ${c.phone}` : ''} · <span className="text-[var(--accent)]">{c.status}</span>
                    {c.tags.length > 0 && ` · #${c.tags.join(' #')}`}
                  </div>
                ))}
                {preview.plan.issues.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-[var(--text-secondary)]">
                      {t('crm.import.issues', 'Issues')} ({preview.plan.issues.length})
                    </summary>
                    <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                      {preview.plan.issues.slice(0, 30).map((iss, i) => (
                        <li key={i} className={iss.severity === 'error' ? 'text-red-500' : 'text-amber-500'}>
                          {iss.row ? `[${iss.row}] ` : ''}{issueText(iss)}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <button
                  onClick={handleImport}
                  disabled={busy || preview.result.contacts.length === 0}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {t('crm.import.confirm', 'Import')} {preview.result.contacts.length} {t('crm.import.contacts', 'contacts')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">
              {t('crm.import.bundleHint', 'Import an encrypted Mess&Anger CRM bundle (.enc) exported from another device. Merges by id — existing records are updated, new ones added.')}
            </p>
            <label className="text-xs text-[var(--text-secondary)] block">
              {t('crm.import.file', 'File')}:
              <input
                type="file"
                accept=".enc"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="mt-1 block text-xs"
              />
            </label>
            <label className="text-xs text-[var(--text-secondary)] block">
              {t('crm.import.password', 'Password')}:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-2 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleParse}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-50"
              >
                {t('crm.import.importBundle', 'Import bundle')}
              </button>
              <button
                onClick={handleExportBundle}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                <Download size={14} /> {t('crm.import.exportBundle', 'Export current CRM')}
              </button>
            </div>
            {bundleResult && (
              <div className="rounded-xl border border-[var(--border-color)] p-3 text-sm text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                {t('crm.import.merged', { added: bundleResult.added, updated: bundleResult.updated })}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className={`mt-3 flex items-start gap-2 text-sm rounded-xl p-2 ${
            msgOk
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {msgOk ? (
              <CheckCircle2 size={16} className="mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5" />
            )}
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
