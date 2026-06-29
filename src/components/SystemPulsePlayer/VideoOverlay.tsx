import React from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";

type VideoOverlayProps = {
  isDark: boolean;
  showVideo: boolean;
  videoUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  closeVideo: () => void;
};

export const VideoOverlay = ({
  isDark, showVideo, videoUrl, videoRef, closeVideo
}: VideoOverlayProps) => {
  if (!showVideo || !videoUrl) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-full rounded-xl"
            controls
            autoPlay
            onEnded={closeVideo}
          />
        </div>
        <button
          onClick={closeVideo}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
