import { Check, LogIn } from "lucide-react";

type T = (key: string, options?: any) => string;

interface LoginCompleteProps {
  t: T;
  onComplete: () => void;
}
export function LoginComplete({ t, onComplete }: LoginCompleteProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
        <Check size={32} strokeWidth={2.5} className="text-green-500" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("auth.login.restoreSuccess", "Identity Restored")}</h2>
      <p className="text-[var(--text-secondary)] mb-8">
        {t("auth.login.ready", "Your identity has been restored. You can now start messaging securely.")}
      </p>
      <button
        onClick={onComplete}
        aria-label={t("auth.login.enterApp", "Enter App")}
        title={t("auth.login.enterApp", "Enter App")}
        className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
      >
        <LogIn size={20} />
        <span>{t("auth.login.enterApp", "Enter App")}</span>
      </button>
    </div>
  );
}
