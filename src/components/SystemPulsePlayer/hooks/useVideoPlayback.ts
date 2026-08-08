import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from 'sonner';
import { isVideoFile } from "../utils";

export interface VideoPlaybackState {
  videoUrl: string | null;
  isVideoPlaying: boolean;
  showVideo: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export interface VideoPlaybackActions {
  setVideoUrl: (v: string | null) => void;
  setIsVideoPlaying: (v: boolean) => void;
  setShowVideo: (v: boolean) => void;
  handleVideoFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleVideoPlayback: () => void;
  closeVideo: () => void;
}

export const useVideoPlayback = (): VideoPlaybackState & VideoPlaybackActions => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectURLsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      objectURLsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectURLsRef.current.clear();
    };
  }, []);

  const handleVideoFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isVideoFile(file)) {
        const objUrl = URL.createObjectURL(file);
        objectURLsRef.current.add(objUrl);
        setVideoUrl(objUrl);
        setShowVideo(true);
        setIsVideoPlaying(true);
        toast.success("Video loaded", { description: file.name });
      } else {
        toast.error("Invalid file", { description: "Please select a video file" });
      }
    }
    e.target.value = "";
  }, []);

  const toggleVideoPlayback = useCallback(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  }, [isVideoPlaying]);

  const closeVideo = useCallback(() => {
    setShowVideo(false);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      objectURLsRef.current.delete(videoUrl);
    }
    setVideoUrl(null);
    setIsVideoPlaying(false);
  }, [videoUrl]);

  return {
    videoUrl, setVideoUrl,
    isVideoPlaying, setIsVideoPlaying,
    showVideo, setShowVideo,
    handleVideoFileSelect,
    toggleVideoPlayback,
    closeVideo,
    videoRef,
  };
};
