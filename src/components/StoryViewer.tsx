import { motion, AnimatePresence } from "motion/react";
import { X, User, Eye } from "lucide-react";
import { useAppStore } from "../store";

interface StoryViewerProps {
  activeStory: { id: number; name: string; color: string } | null;
  onClose: () => void;
  storyMentions: Record<number, string[]>;
  onAddMention: (storyId: number, name: string) => void;
  mentionInput: string;
  onMentionInputChange: (v: string) => void;
  t: (key: string, vars?: any) => string;
}

export const StoryViewer = ({ activeStory, onClose, storyMentions, onAddMention, mentionInput, onMentionInputChange, t }: StoryViewerProps) => {
  const story = activeStory;
  return (
    <AnimatePresence>
      {story && (
        <motion.div
          key="story-viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col bg-black"
        >
          <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-bold`}>
                {story.name.charAt(0)}
              </div>
              <span className="text-white font-semibold text-sm">{story.name}</span>
            </div>
            <div
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X size={20} />
            </div>
          </div>

          <div className="flex-1 w-full bg-zinc-900 rounded-lg overflow-hidden relative flex items-center justify-center">
            <span className="text-white/30 text-lg tracking-widest font-mono">{t('chat.storyContent')}</span>

            {storyMentions[story.id]?.length > 0 && (
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {storyMentions[story.id]?.map((name, i) => (
                  <div key={i} className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-medium flex items-center gap-1.5 border border-white/10">
                    <User size={12} />
                    @{name}
                  </div>
                ))}
              </div>
            )}

            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-gray-300 text-xs">
              <Eye size={14} className={useAppStore.getState().stealthMode ? "opacity-30" : ""} />
              {useAppStore.getState().stealthMode ? t('chat.viewedStealthily') : t('chat.views')}
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="relative">
                <input
                  value={mentionInput}
                  onChange={e => onMentionInputChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && mentionInput.trim()) {
                      onAddMention(story.id, mentionInput.trim().replace(/^@/, ''));
                    }
                  }}
                  placeholder={t('chat.mentionPlaceholder')}
                  className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                />
                {mentionInput.length > 0 && (
                  <div className="absolute -top-8 right-0">
                    <div
                      onClick={() => {
                        onAddMention(story.id, mentionInput.trim().replace(/^@/, ''));
                      }}
                      className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full cursor-pointer"
                    >
                      {t('chat.add')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
