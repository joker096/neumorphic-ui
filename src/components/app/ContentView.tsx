import { motion } from "motion/react";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { useAnimationsEnabled, useAnimationDuration } from "../../contexts/AnimationContext";
import { useStoriesStore } from "../../features/stories/storiesStore";

const StoryComposer = lazy(() => import("../stories/StoryComposer").then(m => ({ default: m.StoryComposer })));

type Story = {
  id: number | string;
  name: string;
  color: string;
};

type ContentViewProps = {
  children: ReactNode;
  isDark?: boolean;
  onCloseStory: () => void;
  activeStory: Story | null;
  isStealthMode: boolean;
  showStoryComposer?: boolean;
  onCloseComposer?: () => void;
};

const contentVariants = {
  enter: { opacity: 0, y: 40 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

function storyAuthorId(activeStory: Story): string | null {
  const authors = useStoriesStore.getState().authors;
  const byName = authors.find((a) => a.name.toLowerCase() === String(activeStory.name).toLowerCase());
  if (byName) return byName.id;
  const byId = authors.find((a) => String(a.id) === String(activeStory.id));
  return byId ? byId.id : null;
}

export const ContentView = ({
  children,
  isDark = false,
  onCloseStory,
  activeStory,
  isStealthMode,
  showStoryComposer = false,
  onCloseComposer,
}: ContentViewProps) => {
  const enabled = useAnimationsEnabled();
  const duration = useAnimationDuration();
  const openViewer = useStoriesStore((s) => s.openViewer);

  // Single story system: opening a story from the content area delegates to the
  // store-based viewer (the same one the chat-list strip uses). The old
  // props-based `StoryViewer` is gone, so there is exactly one look & feel.
  useEffect(() => {
    if (!activeStory) return;
    const store = useStoriesStore.getState();
    if (store.authors.length === 0) store.init();
    const authorId = storyAuthorId(activeStory);
    if (authorId) openViewer(authorId);
  }, [activeStory, openViewer]);

  return (
    <motion.div
      key="content-view"
      variants={enabled ? contentVariants : undefined}
      initial={enabled ? "enter" : false}
      animate={enabled ? "center" : undefined}
      exit={enabled ? "exit" : undefined}
      transition={{ duration, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-1 w-full max-w-none mx-auto flex flex-col relative z-20 pt-0 md:pt-2 pb-0 md:pb-4 h-full min-h-0"
    >
      <div className="flex-1 w-full overflow-hidden relative flex flex-col items-center min-h-0">
        {children}
      </div>
      <Suspense fallback={null}>
        <StoryComposer open={showStoryComposer} onClose={onCloseComposer ?? (() => {})} />
      </Suspense>
    </motion.div>
  );
};
