import { useCallback, useEffect, useRef } from "react";
import { toast } from 'sonner';
import { isAudioFile, isVideoFile, loadAudioFiles } from "../utils";
import type { Track } from "../usePlayerState";

export interface FileHandlingActions {
  handleFolderSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const useFileHandling = (
  setPlaylist: (v: Track[] | ((prev: Track[]) => Track[])) => void,
  setVideoUrl: (v: string | null) => void,
  setShowVideo: (v: boolean) => void,
  setIsVideoPlaying: (v: boolean) => void,
  setCurrentTrackIndex: (v: number) => void,
  setIsPlaying: (v: boolean) => void,
  playlist: Track[]
): FileHandlingActions => {
  const objectURLsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      objectURLsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectURLsRef.current.clear();
    };
  }, []);

  const handleFolderSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const videoFiles: File[] = [];
      const audioFiles: File[] = [];
      for (const item of files) {
        if (item instanceof File) {
          if (isVideoFile(item)) {
            videoFiles.push(item);
          } else if (isAudioFile(item)) {
            audioFiles.push(item);
          }
        }
      }
      if (videoFiles.length > 0) {
        const firstVideo = videoFiles[0];
        const objUrl = URL.createObjectURL(firstVideo);
        objectURLsRef.current.add(objUrl);
        setVideoUrl(objUrl);
        setShowVideo(true);
        setIsVideoPlaying(true);
        toast.success("Video loaded", { description: firstVideo.name });
      }
      const audioCount = audioFiles.length;
      if (audioCount > 0) {
        audioFiles.forEach((file) => {
          const objUrl = URL.createObjectURL(file);
          objectURLsRef.current.add(objUrl);
          const newTrack = { id: Math.random().toString(36).substr(2, 9), name: file.name.replace(/\.[^/.]+$/, ""), url: objUrl, time: "Added", file: file as any };
          setPlaylist((prev) => [...prev, newTrack]);
        });
        setCurrentTrackIndex(playlist.length);
        setIsPlaying(true);
      }
      if (videoFiles.length === 0 && audioFiles.length === 0) {
        toast.info("No media files found in folder");
      }
    }
    e.target.value = "";
  }, [playlist.length, setPlaylist, setVideoUrl, setShowVideo, setIsVideoPlaying, setCurrentTrackIndex, setIsPlaying]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
        loadAudioFiles([file], (f) => {
          const objUrl = URL.createObjectURL(f);
          objectURLsRef.current.add(objUrl);
          const newTrack = { id: Math.random().toString(36).substr(2, 9), name: f.name.replace(/\.[^/.]+$/, ""), url: objUrl, time: "Added", file: f as any };
          setPlaylist((prev) => [...prev, newTrack]);
          setCurrentTrackIndex(playlist.length);
          setIsPlaying(true);
        });
      }
    }
    e.target.value = "";
  }, [playlist.length, setPlaylist, setVideoUrl, setShowVideo, setIsVideoPlaying, setCurrentTrackIndex, setIsPlaying]);

  return {
    handleFolderSelect,
    handleFileSelect,
  };
};
