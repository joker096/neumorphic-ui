import { motion } from "motion/react";
import type { ReactNode } from "react";
import { StoryViewerOverlay } from "../AppChrome";
import { useAnimationsEnabled, useAnimationDuration } from "../../contexts/AnimationContext";

type Story = {
  id: number;
  name: string;
  color: string;
};

type ContentViewProps = {
  children: ReactNode;
  isDark?: boolean;
  onCloseStory: () => void;
  activeStory: Story | null;
  isStealthMode: boolean;
};

const contentVariants = {
  enter: { opacity: 0, y: 40 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

export const ContentView = ({
  children,
  isDark = false,
  onCloseStory,
  activeStory,
  isStealthMode,
}: ContentViewProps) => {
  const enabled = useAnimationsEnabled();
  const duration = useAnimationDuration();

  return (
    <motion.div
      key="content-view"
      variants={enabled ? contentVariants : undefined}
      initial={enabled ? "enter" : false}
      animate={enabled ? "center" : undefined}
      exit={enabled ? "exit" : undefined}
      transition={{ duration, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-1 w-full max-w-[500px] md:max-w-[640px] lg:max-w-[800px] mx-auto flex flex-col relative z-20 pt-0 md:pt-2 pb-0 md:pb-4 h-full min-h-0"
    >
      <div className="flex-1 w-full overflow-hidden relative flex flex-col items-center min-h-0">
        {children}
      </div>
      <StoryViewerOverlay activeStory={activeStory} onClose={onCloseStory} isStealthMode={isStealthMode} />
    </motion.div>
  );
};
