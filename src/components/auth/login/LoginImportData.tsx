import { Database, Upload, ArrowRight } from "lucide-react";
import type { RefObject, ChangeEvent } from "react";
import { AUTH_ERROR_CLASS, AUTH_PRIMARY_BTN_CLASS, AUTH_SUBTITLE_CLASS, AUTH_TITLE_CLASS } from '../authShared';

type T = (key: string, options?: any) => string;

interface LoginImportDataProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  busyImport: boolean;
  error: string;
  t: T;
  onFilePicked: (event: ChangeEvent<HTMLInputElement>) => void;
  onStartFresh: () => void;
}
export function LoginImportData({ fileInputRef, busyImport, error, t, onFilePicked, onStartFresh }: LoginImportDataProps) {
  return (
    <div className="flex flex-col">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center mb-6 mx-auto shadow-lg">
        <Database size={32} />
      </div>
      <h2 className={`${AUTH_TITLE_CLASS}`}>{t("auth.login.restoreDataTitle", "Restore your data")}</h2>
      <p className={`${AUTH_SUBTITLE_CLASS}`}>
        {t("auth.login.restoreDataSubtitle", "Your identity is back. Import a backup file to bring back your chats, contacts and settings — or start fresh.")}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".enc,.json"
        className="hidden"
        onChange={onFilePicked}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={busyImport}
        aria-label={t("auth.login.importBackup", "Import from backup file")}
        className={`${AUTH_PRIMARY_BTN_CLASS} disabled:opacity-60 disabled:cursor-not-allowed mb-3`}
      >
        {busyImport ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <Upload size={20} />
        )}
        <span>{busyImport ? t("auth.login.importing", "Importing...") : t("auth.login.importBackup", "Import from backup file")}</span>
      </button>
      {error && (
        <p role="alert" className={`${AUTH_ERROR_CLASS}`}>{error}</p>
      )}
      <button
        type="button"
        onClick={onStartFresh}
        disabled={busyImport}
        aria-label={t("auth.login.startFresh", "Start fresh")}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
      >
        <ArrowRight size={18} />
        <span>{t("auth.login.startFresh", "Start fresh")}</span>
      </button>
    </div>
  );
}
