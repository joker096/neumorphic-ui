import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { LandingPageProps } from "./LandingPage";

export const CTASection = ({ onGetStarted }: Pick<LandingPageProps, "onGetStarted">) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
    className="max-w-3xl mx-auto text-center"
  >
    <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-[-0.02em] mb-4 text-[var(--text-primary)]">
      Ready to take control?
    </h2>
    <p className="text-lg mb-10 text-[var(--text-secondary)]">
      No signup required. No data collection. Just download and connect.
    </p>
    <button
      onClick={onGetStarted}
      className="group relative overflow-hidden rounded-full px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98]"
    >
      <span className="relative z-10 flex items-center gap-3">
        Get Started
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
          <ArrowRight size={14} className="text-[var(--text-primary)]" />
        </span>
      </span>
    </button>
  </motion.div>
);

