import { Check, LogIn } from "lucide-react";
import { AUTH_COLUMN_CLASS, AUTH_PRIMARY_BTN_CLASS } from '../authShared';
import { AUTH_SUCCESS_CIRCLE_CLASS } from "../authShared";

type T = (key: string, options?: any) => string;

interface LoginCompleteProps {
  t: T;
  onComplete: () => void;
}
export function LoginComplete({ t, onComplete }: LoginCompleteProps) {
  return (
    <div className={`${AUTH_COLUMN_CLASS}`}>
      <div className={AUTH_SUCCESS_CIRCLE_CLASS}>
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
        className={`${AUTH_PRIMARY_BTN_CLASS}`}
      >
        <LogIn size={20} />
        <span>{t("auth.login.enterApp", "Enter App")}</span>
      </button>
    </div>
  );
}
