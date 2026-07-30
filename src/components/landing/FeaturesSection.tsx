import { motion } from "motion/react";
import type { LandingFeature } from "../../data/landingData";

type FeaturesSectionProps = {
  features: LandingFeature[];
};

export const FeaturesSection = ({ features }: FeaturesSectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {features.map((feat, i) => {
      const Icon = feat.icon;
      return (
        <motion.div
          key={feat.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: i * 0.08 }}
          className="group rounded-[1.75rem] border p-[1px] transition-all duration-500 border-[var(--border-color)]/[0.06] hover:border-[var(--border-color)]/[0.12]"
        >
          <div className="rounded-[calc(1.75rem-1px)] p-6 bg-[var(--bg-secondary)]">
            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 bg-orange-500/10">
              <Icon size={20} className="text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-base font-bold mb-2 text-[var(--text-primary)]">
              {feat.title}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-tertiary)]">
              {feat.desc}
            </p>
          </div>
        </motion.div>
      );
    })}
  </div>
);

