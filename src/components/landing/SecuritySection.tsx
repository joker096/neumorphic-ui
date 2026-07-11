import { motion } from "motion/react";
import type { SecurityItem } from "../../data/landingData";

type SecuritySectionProps = {
  items: SecurityItem[];
};

export const SecuritySection = ({ items }: SecuritySectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {items.map((item, i) => {
      const Icon = item.icon;
      return (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: i * 0.1 }}
          className="text-center"
        >
          <div className="mx-auto w-14 h-14 rounded-md flex items-center justify-center mb-5 bg-orange-500/10">
            <Icon size={24} className="text-[var(--text-tertiary)]" />
          </div>
          <h3 className="text-base font-bold mb-2 text-[var(--text-primary)]">
            {item.title}
          </h3>
          <p className="text-sm leading-relaxed max-w-xs mx-auto text-[var(--text-secondary)]">
            {item.desc}
          </p>
        </motion.div>
      );
    })}
  </div>
);
