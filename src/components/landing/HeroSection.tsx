import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { LandingPageProps } from "./LandingPage";
import { APP_INFO } from "../../config/settingsDefaults";
import { useI18n } from "../../lib/i18n";
import { CTA_ARROW_CLASS, GRADIENT_TEXT_CLASS, CTA_SECONDARY_CLASS, HERO_TITLE_CLASS, HERO_LEAD_CLASS } from './landingClasses';
import { HERO_COLUMN_CLASS } from "./landingClasses";
export const HeroSection = ({ onGetStarted }: Pick<LandingPageProps, "onGetStarted">) => {
  const { t } = useI18n();
  return (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
    className={HERO_COLUMN_CLASS}
  >
    <div className="mb-6 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-medium border border-[var(--border-color)]">
      {APP_INFO.VERSION} &mdash; June 2026
    </div>

      <h1 className={HERO_TITLE_CLASS}>
        {t("landing.communication")}
        <br />
        <span className={GRADIENT_TEXT_CLASS}>
          {t("landing.withoutCompromise")}
        </span>
      </h1>

      <p className={HERO_LEAD_CLASS}>
        {t("landing.heroSubtitle")}
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={onGetStarted}
          className={CTA_SECONDARY_CLASS}
        >
          <span className="relative z-10 flex items-center gap-3">
            {t("landing.openApp")}
            <span className={CTA_ARROW_CLASS}>
              <ArrowRight size={14} className="text-[var(--text-primary)]" />
            </span>
          </span>
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full px-8 py-3 text-sm font-bold border transition-all duration-300 border-[var(--border-color)] text-[var(--text-tertiary)] hover:bg-white/5"
        >
          {t("landing.sourceCode")}
        </a>
      </div>
  </motion.div>
  );
};

