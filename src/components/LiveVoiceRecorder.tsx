import React, { useState, useEffect, useRef } from 'react';
import { motion, type PanInfo } from 'motion/react';
import { Mic, Square, Trash2, Send, Pause, Play } from 'lucide-react';
import { VoiceWaveform } from './chat-preview/VoiceWaveform';
import { useI18n } from '../lib/i18n';

interface LiveVoiceRecorderProps {
   onCancel: () => void;
   onSend: (audioUrl: string, durationStr: string, blob: Blob) => void;
   onPermissionDenied?: (message: string) => void;
   holdToRecord?: boolean;

  }

export const LiveVoiceRecorder = ({ onCancel, onSend, onPermissionDenied, holdToRecord = true }: LiveVoiceRecorderProps) => {
    const { t } = useI18n();
    const label = (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    };
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const durationRef = useRef(0);
    
    useEffect(() => {
       startRecording();

       if (holdToRecord) {
          window.addEventListener("pointerup", handleRelease);
          window.addEventListener("mouseup", handleRelease);
          window.addEventListener("touchend", handleRelease);
          window.addEventListener("touchcancel", handleCancel);
       }

       return () => {
          removeStopListeners();
          cleanup();
       };
    }, []);

    useEffect(() => {
       let intv: ReturnType<typeof setInterval>;
       if (isRecording) {
          intv = setInterval(() => {
             durationRef.current += 1;
             setDuration(durationRef.current);
          }, 1000);
       }
       return () => clearInterval(intv);
    }, [isRecording]);

    const cleanup = () => {
       mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
       stream?.getTracks().forEach(t => t.stop());
    };

const removeStopListeners = () => {
        window.removeEventListener("pointerup", handleRelease);
        window.removeEventListener("mouseup", handleRelease);
        window.removeEventListener("touchend", handleRelease);
        window.removeEventListener("touchcancel", handleCancel);
     };

     const handleRelease = () => {
        // When released AFTER recording started -> send (hold-to-record).
        // When released before the mic grant resolves -> remove the auto-send
        // listeners and leave the recording to start hands-free; the user
        // finishes with Stop & Send. This avoids silently discarding a quick
        // tap (the previous releasedRef early-cancel made a plain click a no-op).
        removeStopListeners();
        if (mediaRecorderRef.current?.state === "recording") {
          handleStopAndSend();
        } else if (stream != null || mediaRecorderRef.current != null) {
          // The async start may not be reflected in .state yet — keep it, so a
          // release right after the mic grant still ends with Stop & Send.
          handleStopAndSend();
        }
        // Nothing started yet (mic grant still pending): stay hands-free. The
        // recording begins when the stream arrives and waits for Stop & Send.
     };

     const handlePauseResume = () => {
        if (!mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state === "recording") {
           mediaRecorderRef.current.pause();
           setIsPaused(true);
        } else {
           mediaRecorderRef.current.resume();
           setIsPaused(false);
        }
     };

    const startRecording = async () => {
       try {
           const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
           setStream(mediaStream);
          const mr = new MediaRecorder(mediaStream);
          mediaRecorderRef.current = mr;
          chunksRef.current = [];
          durationRef.current = 0;
          setDuration(0);
          
          mr.ondataavailable = e => {
             if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          
           mr.onstop = () => {
              // Use chunksRef which collects the recorded audio data
              const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              const m = Math.floor(durationRef.current / 60);
              const s = durationRef.current % 60;
              onSend(url, `${m}:${s.toString().padStart(2, '0')}`, blob);
           };

           mr.start(100);
           setIsRecording(true);

        } catch (err) {
          console.error("Mic access denied", err);
           onPermissionDenied?.(label('voiceRecorder.permissionDenied', 'Microphone access is blocked. Please allow microphone permissions and try again.'));
          onCancel(); // exit immediately if no mic
       }
    };

    const handleStopAndSend = () => {
       removeStopListeners();
       setIsRecording(false);
       if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
       }
    };

    const handleCancel = () => {
       removeStopListeners();
       cleanup();
       onCancel();
    };

    const formatTime = (secs: number) => {
       const m = Math.floor(secs / 60);
       const s = secs % 60;
       return `${m}:${s.toString().padStart(2, '0')}`;
    };

 return (
        (
            // Recording mode with swipe-to-cancel
           <div className="w-full glass-panel rounded-xl px-3 py-2 relative overflow-hidden">
             <motion.div
               drag="y"
               dragConstraints={{ top: -120, bottom: 0 }}
               dragElastic={0.2}
onDragEnd={(_: unknown, info: PanInfo) => {
                  if (info.offset.y < -60 || info.velocity.y < -300) {
                    handleCancel()
                  }
                }}
               className="flex items-center justify-between gap-3 h-10"
             >
               <div
                   onClick={handleCancel}
                   onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCancel(); } }}
                   role="button"
                   tabIndex={0}
                   aria-label={label("voiceRecorder.discard", "Discard")}
                   className="w-10 h-10 min-w-[44px] min-h-[44px] flex-shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-colors active:scale-95 text-[var(--text-secondary)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                 >
                   <Trash2 size={18} aria-hidden="true" />
                </div>
              
              <div className="flex-1 flex items-center gap-3 overflow-hidden">
                 <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-[var(--amber)]" : "bg-[var(--danger)]"} ${!isPaused && isRecording ? "animate-pulse" : ""}`} />
                 <span className={`text-sm font-bold tracking-wide font-mono min-w-[36px] text-[var(--text-primary)]`} aria-label="Timer: recording" aria-live="polite">
                    {formatTime(duration)}
                 </span>
                 <div className="flex-1 h-8 px-2 flex items-center">
                    <VoiceWaveform stream={stream} />
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
{isRecording && (
                    <button 
                         onClick={handlePauseResume}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full glass-panel transition-colors text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                          title={isPaused ? label('voiceRecorder.resume', 'Resume') : label('voiceRecorder.pause', 'Pause')}
                          aria-label={isPaused ? label('voiceRecorder.resume', 'Resume') : label('voiceRecorder.pause', 'Pause')}
                       >
                          {isPaused ? <Play size={16} /> : <Pause size={16} />}
                       </button>
                  )}
                  <button 
                      onClick={handleStopAndSend}
                                            aria-label={label("voiceRecorder.stopAndSend", "Stop and Send")}
                     className="w-11 h-11 min-w-[44px] min-h-[44px] flex flex-shrink-0 items-center justify-center rounded-full cursor-pointer transition-all active:scale-95 bg-gradient-to-tr from-[var(--amber)] to-[var(--accent)] text-[var(--ink-on-saturate)] shadow-[var(--shadow-rec-glow)] focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-offset-2 focus-visible:ring-[var(--ink-on-saturate)]"
                     title={label('voiceRecorder.stopAndSend', 'Stop and Send')}
                  >
                     <Send size={18} className="-ml-0.5" />
                  </button>
              </div>
              </motion.div>
            </div>
        )
    );
};


