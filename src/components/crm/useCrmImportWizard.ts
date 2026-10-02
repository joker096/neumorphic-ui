import { useState, useRef } from 'react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { importFromText, type ImportPlan, type ImportResult } from '../../lib/crm/import';
import {
  downloadCrmMigrationBundle,
  parseCrmMigrationFile,
  decryptCrmMigrationFile,
  mergeCrmBundle,
  type CrmMergeResult,
} from '../../lib/backup';

type Mode = 'text' | 'bundle';

export function useCrmImportWizard() {
  const { t } = useI18n();
  const userId = useAppStore((s) => s.userProfile.id);
  const importBatch = useAppStore((s) => s.importBatch);
  const existingContacts = useAppStore((s) => s.crmContacts);

  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [preview, setPreview] = useState<{ format: string; plan: ImportPlan; result: ImportResult } | null>(null);
  const [bundleResult, setBundleResult] = useState<CrmMergeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msgOk, setMsgOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setBundleResult(null);
    setError(null);
    setMsgOk(false);
  };

  const showMsg = (msg: string, ok: boolean) => {
    setError(msg);
    setMsgOk(ok);
  };

  const handleFile = async (f: File | null) => {
    setFile(f);
    reset();
    if (f && mode === 'text') {
      const txt = await f.text();
      setText(txt);
    }
  };

  const handleParse = () => {
    reset();
    if (mode === 'bundle') {
      if (!file) { showMsg(t('crm.import.noFile', 'Choose a .enc bundle file'), false); return; }
      setBusy(true);
      const run = password
        ? decryptCrmMigrationFile(file, password)
        : parseCrmMigrationFile(file);
      run.then((bundle) => setBundleResult(mergeCrmBundle(bundle)))
        .catch((e) => showMsg(String(e?.message ?? e), false))
        .finally(() => setBusy(false));
      return;
    }
    const src = text.trim();
    if (!src) { showMsg(t('crm.import.noText', 'Paste CSV/JSON or choose a file'), false); return; }
    try {
      const parsed = importFromText(src, {
        defaultOwnerId: userId,
        defaultCurrency,
        skipDuplicates,
        existingContacts,
      });
      setPreview(parsed);
    } catch (e) {
      showMsg(String((e as Error)?.message ?? e), false);
    }
  };

  const handleImport = () => {
    if (!preview) return;
    setBusy(true);
    try {
      importBatch({
        contacts: preview.result.contacts,
        mergedContacts: preview.result.mergedContacts,
        deals: preview.result.deals,
        tasks: preview.result.tasks,
      });
      const { importedContacts, mergedContacts: mergedCount, importedDeals, importedTasks, duplicatesSkipped, warnings, errors } = preview.result.stats;
      setBundleResult(null);
      setPreview(null);
      setText('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      showMsg(
        t('crm.import.done', {
          contacts: importedContacts,
          deals: importedDeals,
          tasks: importedTasks,
          merged: mergedCount ? `, merged ${mergedCount} with existing` : '',
          skipped: duplicatesSkipped ? `, skipped ${duplicatesSkipped} duplicates` : '',
          stats: (warnings || errors) ? ` (${warnings} warnings, ${errors} errors)` : '',
        }),
        true,
      );
    } catch (e) {
      showMsg(String((e as Error)?.message ?? e), false);
    } finally {
      setBusy(false);
    }
  };

  const handleExportBundle = () => {
    if (!password) { showMsg(t('crm.import.pwNeeded', 'Enter a password to encrypt the export'), false); return; }
    setBusy(true);
    downloadCrmMigrationBundle(password)
      .then(() => showMsg(t('crm.import.exported', 'CRM bundle exported (.enc)'), true))
      .catch((e) => showMsg(String(e?.message ?? e), false))
      .finally(() => setBusy(false));
  };

  return {
    mode, setMode, text, setText, password, setPassword,
    defaultCurrency, setDefaultCurrency, skipDuplicates, setSkipDuplicates,
    preview, bundleResult, error, msgOk, busy, fileRef,
    reset, handleFile, handleParse, handleImport, handleExportBundle,
  };
}
