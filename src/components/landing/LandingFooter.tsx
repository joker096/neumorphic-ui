import { Zap } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { FOOTER_WRAP_CLASS } from "./landingClasses";

export const LandingFooter = () => {
  const { t } = useI18n();
  return (
  <footer className="relative z-10 border-t px-6 py-8 border-[var(--border-color)]">
    <div className={FOOTER_WRAP_CLASS}>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-orange-500/10">
          <Zap size={12} className="text-[var(--text-tertiary)]" />
        </div>
        <span className="text-xs font-bold tracking-tight text-[var(--text-secondary)]">
          {t("landing.brand")}
        </span>
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">
        {t("landing.copyright")}
      </p>
    </div>
  </footer>
  );
};

