import { Zap } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { FOOTER_WRAP_CLASS, FOOTER_SECTION_CLASS, FOOTER_META_CLASS } from "./landingClasses";
export const LandingFooter = () => {
  const { t } = useI18n();
  return (
  <footer className={FOOTER_SECTION_CLASS}>
    <div className={FOOTER_WRAP_CLASS}>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-orange-500/10">
          <Zap size={12} className="text-[var(--text-tertiary)]" />
        </div>
        <span className={FOOTER_META_CLASS}>
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

