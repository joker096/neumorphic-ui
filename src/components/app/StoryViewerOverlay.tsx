import { AnimatePresence, motion } from "motion/react";
import { Eye, X } from "lucide-react";

type StoryViewerOverlayProps = {
  activeStory: { id: number; name: string; color: string } | null;
  onClose: () => void;
  isStealthMode: boolean;
};

export const StoryViewerOverlay = ({ activeStory, onClose, isStealthMode }: StoryViewerOverlayProps) => (
  <AnimatePresence>
    {activeStory && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col bg-black"
      >
        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeStory.color} flex items-center justify-center text-white font-bold`}>
              {activeStory.name.charAt(0)}
            </div>
            <span className="text-white font-semibold text-sm">{activeStory.name}</span>
          </div>
          <div
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X size={20} />
          </div>
        </div>

        <div className="flex-1 w-full bg-zinc-900 rounded-lg overflow-hidden relative flex items-center justify-center">
          <span className="text-white/30 text-lg tracking-widest font-mono">STORY CONTENT</span>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-gray-300 text-xs">
            <Eye size={14} className={isStealthMode ? "opacity-30" : ""} />
            {isStealthMode ? "Viewed Stealthily" : "12 Views"}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
