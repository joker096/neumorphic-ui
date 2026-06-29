import { motion } from "motion/react";
import type { ReactNode } from "react";
import { StoryViewerOverlay } from "../AppChrome";

type Story = {
  id: number;
  name: string;
  color: string;
};

type ContentViewProps = {
  children: ReactNode;
  isDark: boolean;
  onCloseStory: () => void;
  activeStory: Story | null;
  isStealthMode: boolean;
};

export const ContentView = ({
  children,
  isDark,
  onCloseStory,
  activeStory,
  isStealthMode,
}: ContentViewProps) => (
  <motion.div
    key="content-view"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    transition={{ duration: 0.3 }}
    className="flex-1 w-full max-w-[500px] mx-auto flex flex-col relative z-20 pt-2 pb-4 h-full min-h-0"
  >
    <div className="flex-1 w-full overflow-hidden relative flex flex-col items-center min-h-0">
      {children}
    </div>
    <StoryViewerOverlay activeStory={activeStory} onClose={onCloseStory} isStealthMode={isStealthMode} />
  </motion.div>
);
