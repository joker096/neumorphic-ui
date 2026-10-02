import { UserPlus, Copy, Check, ArrowRight, LogIn, Shield } from "lucide-react";

type T = (key: string, options?: any) => string;

export function WelcomeStep({ t, error, isProcessing, onGenerate }: { t: T; error: string; isProcessing: boolean; onGenerate: () => void }) {
  return (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center mb-6 shadow-lg">
              <Shield size={40} />
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-bold mb-3">{t("auth.registration.title", "Create Your Identity")}</h1>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              {t("auth.registration.welcome", "Mess&Anger is decentralized. Your identity lives only on your device. We'll generate a recovery phrase — write it down and keep it safe.")}
            </p>
            <button
              onClick={onGenerate}
              disabled={isProcessing}
              aria-label={t("auth.registration.createIdentity", "Create Identity")}
              title={t("auth.registration.createIdentity", "Create Identity")}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={20} />
              <span>{t("auth.registration.createIdentity", "Create Identity")}</span>
            </button>
            {error && (
              <p role="alert" className="text-xs text-red-400 mb-3 text-center">{error}</p>
            )}
            <p className="text-xs text-[var(--text-secondary)] mt-4 opacity-70">
              {t("auth.registration.secureNote", "All keys are generated locally. No data leaves your device.")}
            </p>
          </div>
  );
}

export function GeneratingStep({ t }: { t: T }) {
  return (
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-lg">{t("auth.registration.generating", "Generating secure keys...")}</p>
          </div>
  );
}

export function ShowPhraseStep({ t, phrase, phraseWords, onContinue }: { t: T; phrase: string; phraseWords: string[]; onContinue: () => void }) {
  return (
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">{t("auth.registration.recoveryPhrase", "Recovery Phrase")}</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">
              {t("auth.registration.writeDown", "Write these 24 words down in order. Never share them. This is the only way to recover your identity.")}
            </p>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-2">
                {phraseWords.map((word, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[var(--bg-primary)] rounded-lg px-3 py-2">
                    <span className="text-xs text-[var(--text-secondary)] font-mono w-5">{i + 1}</span>
                    <span className="text-sm font-medium">{word}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(phrase).catch(() => {});
              }}
              aria-label={t("auth.registration.copyPhrase", "Copy to Clipboard")}
              title={t("auth.registration.copyPhrase", "Copy to Clipboard")}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-medium text-sm border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors mb-3"
            >
              <Copy size={18} />
              <span>{t("auth.registration.copyPhrase", "Copy to Clipboard")}</span>
            </button>
            <button
              onClick={onContinue}
              aria-label={t("auth.registration.iveWrittenItDown", "I've Written It Down")}
              title={t("auth.registration.iveWrittenItDown", "I've Written It Down")}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
            >
              <Check size={20} />
              <span>{t("auth.registration.iveWrittenItDown", "I've Written It Down")}</span>
            </button>
          </div>
  );
}

export function ConfirmPhraseStep({ t, confirmInput, onConfirmInput, error, onConfirm }: { t: T; confirmInput: string; onConfirmInput: (v: string) => void; error: string; onConfirm: () => void }) {
  return (
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">{t("auth.registration.confirmPhrase", "Confirm Recovery Phrase")}</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">
              {t("auth.registration.typePhrase", "Type your 24-word recovery phrase to confirm you saved it.")}
            </p>
            <textarea
              aria-label={t("auth.registration.phrasePlaceholder", "word1 word2 word3 ...")}
              value={confirmInput}
              onChange={(e) => onConfirmInput(e.target.value)}
              placeholder={t("auth.registration.phrasePlaceholder", "word1 word2 word3 ...")}
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
              onClick={onConfirm}
              disabled={confirmInput.split(/\s+/).length !== 24}
              aria-label={t("auth.registration.verify", "Verify Phrase")}
              title={t("auth.registration.verify", "Verify Phrase")}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={20} />
              <span>{t("auth.registration.verify", "Verify Phrase")}</span>
            </button>
          </div>
  );
}

export function SetPinStep({ t, isLocked, lockBlockTimer, pin, onPinChange, pinConfirm, onPinConfirmChange, pinError, error, isProcessing, onSetPin, onSkip }: { t: T; isLocked: boolean; lockBlockTimer: number; pin: string; onPinChange: (v: string) => void; pinConfirm: string; onPinConfirmChange: (v: string) => void; pinError: boolean; error: string; isProcessing: boolean; onSetPin: () => void; onSkip: () => void }) {
  return (
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">{t("auth.registration.setPin", "Set App Lock PIN")}</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6 text-center">
              {t("auth.registration.pinDescription", "Optional but recommended. Adds a layer of protection when someone opens your device.")}
            </p>
            {isLocked && lockBlockTimer > 0 ? (
              <div className="text-center mb-4">
                <p className="text-red-500 font-bold text-sm">{t('lock.locked', 'Locked')}</p>
                <p className="text-xs mt-1 text-[var(--text-secondary)]">{t('lock.tryAgainIn', { seconds: lockBlockTimer })}</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <input
                    aria-label={t("auth.registration.pinPlaceholder", "Enter PIN (4-6 digits)")}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => onPinChange(e.target.value.replace(/\D/g, ''))}
                    placeholder={t("auth.registration.pinPlaceholder", "Enter PIN (4-6 digits)")}
                    aria-invalid={pinError || undefined}
                    aria-describedby={pinError ? "auth-reg-pin-error" : undefined}
                    autoFocus
                    className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] ${pinError ? "border-red-500 text-red-500" : ""}`}
                  />
                  <input
                    aria-label={t("auth.registration.confirmPinPlaceholder", "Confirm PIN")}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => onPinConfirmChange(e.target.value.replace(/\D/g, ''))}
                    placeholder={t("auth.registration.confirmPinPlaceholder", "Confirm PIN")}
                    aria-invalid={pinError || undefined}
                    aria-describedby={pinError ? "auth-reg-pin-error" : undefined}
                    className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] ${pinError ? "border-red-500 text-red-500" : ""}`}
                  />
                </div>
                {pinError && (
                  <p id="auth-reg-pin-error" role="alert" className="text-xs text-red-400 mb-3 text-center">{t("auth.registration.pinError", "PINs must match and be 4-6 digits.")}</p>
                )}
                {error && (
                  <p role="alert" className="text-xs text-red-400 mb-3 text-center">{error}</p>
                )}
                <button
                  onClick={onSetPin}
                  disabled={isProcessing || pin.length < 4}
                  aria-label={t("auth.registration.continue", "Continue")}
                  title={t("auth.registration.continue", "Continue")}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight size={20} />
                  <span>{t("auth.registration.continue", "Continue")}</span>
                </button>
                <button
                  onClick={onSkip}
                  aria-label={t("auth.registration.skipPin", "Skip PIN Setup")}
                  title={t("auth.registration.skipPin", "Skip PIN Setup")}
                  className="w-full h-11 flex items-center justify-center gap-2 mt-3 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowRight size={18} />
                  <span>{t("auth.registration.skipPin", "Skip PIN Setup")}</span>
                </button>
              </>
            )}
          </div>
  );
}

export function CompleteStep({ t, onComplete }: { t: T; onComplete: () => void }) {
  return (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <Check size={32} strokeWidth={2.5} className="text-green-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("auth.registration.identityCreated", "Identity Created")}</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              {t("auth.registration.ready", "Your secure identity is ready. Keep your recovery phrase safe — you'll need it if you switch devices.")}
            </p>
            <button
              onClick={onComplete}
              aria-label={t("auth.registration.enterApp", "Enter App")}
              title={t("auth.registration.enterApp", "Enter App")}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
            >
              <LogIn size={20} />
              <span>{t("auth.registration.enterApp", "Enter App")}</span>
            </button>
          </div>
  );
}
