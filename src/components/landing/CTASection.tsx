import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { LandingPageProps } from "./LandingPage";
import { useI18n } from "../../lib/i18n";
import { CTA_ARROW_CLASS, CTA_PRIMARY_CLASS, CTA_SECTION_TITLE_CLASS, CTA_SECTION_LEAD_CLASS, LANDING_ICON_ROW_CLASS } from './landingClasses';
export const CTASection = ({ onGetStarted }: Pick<LandingPageProps, "onGetStarted">) => {
  const { t } = useI18n();
  return (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
    className="max-w-3xl mx-auto text-center"
  >
    <h2 className={CTA_SECTION_TITLE_CLASS}>
      {t("landing.ctaTitle")}
    </h2>
    <p className={CTA_SECTION_LEAD_CLASS}>
      {t("landing.ctaSubtitle")}
    </p>
    <button
      onClick={onGetStarted}
      className={CTA_PRIMARY_CLASS}
    >
      <span className={LANDING_ICON_ROW_CLASS}>
        {t("landing.getStarted")}
        <span className={CTA_ARROW_CLASS}>
          <ArrowRight size={14} className="text-[var(--text-primary)]" />
        </span>
      </span>
    </button>
  </motion.div>
  );
};

