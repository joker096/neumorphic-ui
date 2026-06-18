import { motion } from "motion/react";
import type { ReactNode } from "react";
import { HomeButton, StoryViewerOverlay } from "../AppChrome";
import { ContentViewHeader } from "./ContentViewHeader";

type Story = {
  id: number;
  name: string;
  color: string;
};

type ContentViewProps = {
  children: ReactNode;
  title: string;
  theme: "light" | "dark";
  isDark: boolean;
  t: (key: string, options?: any) => string;
  onBack: () => void;
  onHome: () => void;
  onCloseStory: () => void;
  showHomeButton?: boolean;
  activeStory: Story | null;
  isStealthMode: boolean;
};

export const ContentView = ({
  children,
  title,
  theme,
  isDark,
  t,
  onBack,
  onHome,
  onCloseStory,
  showHomeButton = true,
  activeStory,
  isStealthMode,
}: ContentViewProps) => (
  <motion.div
    key="content-view"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    transition={{ duration: 0.3 }}
    className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-24 sm:pt-8 pb-28 sm:pb-24 h-full min-h-0 px-0 sm:px-4"
  >
    <ContentViewHeader title={title} isDark={isDark} t={t} onBack={onBack} />
    <div className="flex-1 w-full overflow-hidden relative px-3 sm:px-4 flex flex-col items-center min-h-0">
      {children}
    </div>
    {showHomeButton && <HomeButton isDark={isDark} onClick={onHome} />}
    <StoryViewerOverlay activeStory={activeStory} onClose={onCloseStory} isStealthMode={isStealthMode} />
  </motion.div>
);
