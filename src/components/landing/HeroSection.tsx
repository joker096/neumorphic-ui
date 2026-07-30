import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { LandingPageProps } from "./LandingPage";

export const HeroSection = ({ onGetStarted }: Pick<LandingPageProps, "onGetStarted">) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
    className="flex flex-col items-center text-center max-w-3xl"
  >
    <div className="mb-6 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-medium border border-[var(--border-color)]">
      v1.0 &mdash; June 2026
    </div>

    <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] mb-6 text-[var(--text-primary)]">
      Communication
      <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
        Without Compromise
      </span>
    </h1>

    <p className="text-lg max-w-xl leading-relaxed mb-10 text-[var(--text-secondary)]">
      Peer-to-peer encrypted messaging, decentralized identity, and mesh networking.
      Built for privacy, designed for freedom.
    </p>

    <div className="flex items-center gap-4">
      <button
        onClick={onGetStarted}
        className="group relative overflow-hidden rounded-full px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-[var(--text-primary)] font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="relative z-10 flex items-center gap-3">
          Open App
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
            <ArrowRight size={14} className="text-[var(--text-primary)]" />
          </span>
        </span>
      </button>

      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full px-7 py-3.5 text-sm font-bold border transition-all duration-300 border-[var(--border-color)] text-[var(--text-tertiary)] hover:bg-white/5"
      >
        Source Code
      </a>
    </div>
  </motion.div>
);

