import { motion } from "motion/react";
import { Shield, Zap, Globe, Lock, ArrowRight, MessageCircle, Radio, Users } from "lucide-react";
import { APP_INFO } from "../../config/settingsDefaults";
import { useI18n } from "../../lib/i18n";

export type LandingPageProps = {
  isDark?: boolean;
  onGetStarted: () => void;
};

const easeOut = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: easeOut },
};

const stagger = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: easeOut },
};

const features = [
  {
    icon: MessageCircle,
    titleKey: "landing.featureEncryptedTitle",
    descKey: "landing.featureEncryptedDesc",
  },
  {
    icon: Radio,
    titleKey: "landing.featureMeshTitle",
    descKey: "landing.featureMeshDesc",
  },
  {
    icon: Shield,
    titleKey: "landing.featureZeroTitle",
    descKey: "landing.featureZeroDesc",
  },
  {
    icon: Globe,
    titleKey: "landing.featureDecentralizedTitle",
    descKey: "landing.featureDecentralizedDesc",
  },
];

export const LandingPage = ({ isDark = false, onGetStarted }: LandingPageProps) => {
  const { t } = useI18n();
  return (
    <div className={`w-full min-h-[100dvh] overflow-x-hidden ${isDark ? "bg-[#050505]" : "bg-[#faf8f5]"}`}>
      {isDark && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20vh] left-[10%] w-[40vw] h-[50vh] bg-orange-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-[30vh] right-[5%] w-[30vw] h-[40vh] bg-amber-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10vh] left-[20%] w-[35vw] h-[30vh] bg-orange-600/6 rounded-full blur-[90px]" />
        </div>
      )}

      <section className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col items-center text-center max-w-3xl"
        >
          <div className={`mb-6 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-medium border ${
            isDark ? "border-[var(--border-color)] text-gray-400" : "border-[var(--border-color)] text-gray-500"
          }`}>
            {APP_INFO.VERSION} &mdash; June 2026
          </div>

          <h1 className={`text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] mb-6 ${
            isDark ? "text-[var(--text-primary)]" : "text-slate-900"
          }`}>
            {t("landing.communication")}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              {t("landing.withoutCompromise")}
            </span>
          </h1>

          <p className={`text-lg max-w-xl leading-relaxed mb-10 ${
            isDark ? "text-gray-400" : "text-slate-500"
          }`}>
            {t("landing.heroSubtitle")}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={onGetStarted}
              className="group relative overflow-hidden rounded-full px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-3">
                {t("landing.openApp")}
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  <ArrowRight size={14} className="text-[var(--text-primary)]" />
                </span>
              </span>
            </button>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full px-8 py-3 text-sm font-bold border transition-all duration-300 ${
                isDark
                  ? "border-[var(--border-color)] text-gray-300 hover:bg-white/5"
                  : "border-[var(--border-color)] text-slate-600 hover:bg-black/5"
              }`}
            >
              {t("landing.sourceCode")}
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className={`w-5 h-8 rounded-full border-2 ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"} flex justify-center pt-2`}>
            <div className={`w-1 h-2 rounded-full animate-bounce ${isDark ? "bg-gray-400" : "bg-slate-500"}`} />
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 px-6 py-16">
        <motion.div {...fadeUp} className="max-w-6xl mx-auto">
          <div className={`mx-auto mb-4 w-fit px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-medium border ${
            isDark ? "border-[var(--border-color)] text-gray-400" : "border-[var(--border-color)] text-gray-500"
          }`}>
            {t("landing.featuresBadge")}
          </div>
          <h2 className={`text-[clamp(1.8rem,4vw,3rem)] font-bold text-center tracking-[-0.02em] mb-16 ${
            isDark ? "text-[var(--text-primary)]" : "text-slate-900"
          }`}>
            {t("landing.featuresTitle")}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">{t("landing.featuresTitleAccent")}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.titleKey}
                  {...stagger}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: i * 0.08 }}
                  className={`group rounded-[1.75rem] border p-[1px] transition-all duration-500 ${
                    isDark
                      ? "border-[var(--border-color)]/[0.06] hover:border-[var(--border-color)]/[0.12]"
                      : "border-black/[0.06] hover:border-black/[0.12]"
                  }`}
                >
                  <div className={`rounded-[calc(1.75rem-1px)] p-6 ${
                    isDark ? "bg-[#0a0a0a]" : "bg-white"
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                      isDark ? "bg-orange-500/10" : "bg-orange-500/8"
                    }`}>
                      <Icon size={20} className={isDark ? "text-orange-400" : "text-orange-600"} />
                    </div>
                    <h3 className={`text-base font-bold mb-2 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>
                      {t(feat.titleKey)}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                      {t(feat.descKey)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 px-6 py-16">
        <motion.div {...fadeUp} className="max-w-5xl mx-auto">
          <div className={`mx-auto mb-4 w-fit px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-medium border ${
            isDark ? "border-[var(--border-color)] text-gray-400" : "border-[var(--border-color)] text-gray-500"
          }`}>
            {t("landing.securityBadge")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                titleKey: "landing.securityE2eeTitle",
                descKey: "landing.securityE2eeDesc",
              },
              {
                icon: Users,
                titleKey: "landing.securityMetadataTitle",
                descKey: "landing.securityMetadataDesc",
              },
              {
                icon: Shield,
                titleKey: "landing.securityOpenTitle",
                descKey: "landing.securityOpenDesc",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.titleKey}
                  {...stagger}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                    isDark ? "bg-orange-500/10" : "bg-orange-500/8"
                  }`}>
                    <Icon size={24} className={isDark ? "text-orange-400" : "text-orange-600"} />
                  </div>
                  <h3 className={`text-base font-bold mb-2 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>
                    {t(item.titleKey)}
                  </h3>
                  <p className={`text-sm leading-relaxed max-w-xs mx-auto ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                    {t(item.descKey)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 px-6 py-16">
        <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
          <h2 className={`text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-[-0.02em] mb-4 ${
            isDark ? "text-[var(--text-primary)]" : "text-slate-900"
          }`}>
            {t("landing.ctaTitle")}
          </h2>
          <p className={`text-lg mb-10 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            {t("landing.ctaSubtitle")}
          </p>
          <button
            onClick={onGetStarted}
            className="group relative overflow-hidden rounded-full px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center gap-3">
              {t("landing.getStarted")}
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <ArrowRight size={14} className="text-[var(--text-primary)]" />
              </span>
            </span>
          </button>
        </motion.div>
      </section>

      <footer className={`relative z-10 border-t px-6 py-8 ${
        isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"
      }`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
              isDark ? "bg-orange-500/10" : "bg-orange-500/8"
            }`}>
              <Zap size={12} className={isDark ? "text-orange-400" : "text-orange-600"} />
            </div>
            <span className={`text-xs font-bold tracking-tight ${isDark ? "text-gray-500" : "text-slate-500"}`}>
              {t("landing.brand")}
            </span>
          </div>
          <p className={`text-xs ${isDark ? "text-gray-600" : "text-slate-400"}`}>
            {t("landing.copyright")}
          </p>
        </div>
      </footer>
    </div>
  );
};


