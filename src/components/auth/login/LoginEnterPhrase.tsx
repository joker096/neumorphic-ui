import { Shield, Undo } from "lucide-react";

type T = (key: string, options?: any) => string;

interface LoginEnterPhraseProps {
  phrase: string;
  error: string;
  isProcessing: boolean;
  t: T;
  onPhraseChange: (value: string) => void;
  onRestore: () => void;
}
export function LoginEnterPhrase({ phrase, error, isProcessing, t, onPhraseChange, onRestore }: LoginEnterPhraseProps) {
  return (
    <div className="flex flex-col">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center mb-6 mx-auto shadow-lg">
        <Shield size={32} />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">{t("auth.login.restoreTitle", "Restore Identity")}</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6 text-center">
        {t("auth.login.restoreSubtitle", "Enter your recovery phrase to restore your identity on this device.")}
      </p>
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 mb-4">
        <Shield size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {t("auth.login.phraseOnlyNote", "Your recovery phrase restores your identity and keys. Chats and contacts come from a backup file — you'll be asked to import it on the next step.")}
        </p>
      </div>
      <textarea
        aria-label={t("auth.login.phrasePlaceholder", "word1 word2 word3 ...")}
        value={phrase}
        onChange={(e) => onPhraseChange(e.target.value)}
        placeholder={t("auth.login.phrasePlaceholder", "word1 word2 word3 ...")}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-full h-32 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
      />
      {error && (
        <p role="alert" className="text-xs text-red-400 mb-3 text-center">{error}</p>
      )}
      <button
        onClick={onRestore}
        disabled={isProcessing || phrase.split(/\s+/).filter(w => w.length > 0).length < 12}
        aria-label={t("auth.login.restore", "Restore Identity")}
        title={t("auth.login.restore", "Restore Identity")}
        className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Undo size={20} />
        <span>{t("auth.login.restore", "Restore Identity")}</span>
      </button>
    </div>
  );
}
