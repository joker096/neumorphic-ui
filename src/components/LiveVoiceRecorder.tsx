import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, Square, Trash2, Send, Pause, Play } from 'lucide-react';
import { VoiceWaveform } from './chat-preview/VoiceWaveform';
import { useI18n } from '../lib/i18n';

interface LiveVoiceRecorderProps {
   onCancel: () => void;
   onSend: (audioUrl: string, durationStr: string) => void;
   onReRecord: () => void;
   onPermissionDenied?: (message: string) => void;
   holdToRecord?: boolean;
   isDark?: boolean;
  }

export const LiveVoiceRecorder = ({ onCancel, onSend, onReRecord, onPermissionDenied, holdToRecord = true }: LiveVoiceRecorderProps) => {
    const { t } = useI18n();
    const label = (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    };
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const durationRef = useRef(0);
    
    useEffect(() => {
       startRecording();
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
        window.removeEventListener("pointerup", handleStopAndSend);
        window.removeEventListener("mouseup", handleStopAndSend);
        window.removeEventListener("touchend", handleStopAndSend);
        window.removeEventListener("touchcancel", handleCancel);
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

     const handleStopRecording = () => {
        removeStopListeners();
        setIsRecording(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
           mediaRecorderRef.current.stop();
           // Use chunksRef which collects the recorded audio data
           const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
           const url = URL.createObjectURL(blob);
           setPreviewUrl(url);
           setShowPreview(true);
           mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
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
             const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
             const url = URL.createObjectURL(blob);
             const m = Math.floor(durationRef.current / 60);
             const s = durationRef.current % 60;
             onSend(url, `${m}:${s.toString().padStart(2, '0')}`);
          };

          mr.start(100);
          setIsRecording(true);
          if (holdToRecord) {
             window.addEventListener("pointerup", handleStopAndSend, { once: true });
             window.addEventListener("mouseup", handleStopAndSend, { once: true });
             window.addEventListener("touchend", handleStopAndSend, { once: true });
             window.addEventListener("touchcancel", handleCancel, { once: true });
          }

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
       showPreview && previewUrl ? (
          // Preview mode after recording
          <div className={`w-full flex flex-col gap-3 bg-[var(--bg-primary)] rounded-md px-2 py-3`}>
             <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label('voiceRecorder.preview', 'PREVIEW')}</span>
             </div>
             <div className="flex items-center gap-2">
                <VoiceWaveform audioUrl={previewUrl} isMe={true} />
             </div>
             <div className="flex items-center justify-between">
                <div className="flex gap-2">
                   <button onClick={onReRecord} className={`px-3 py-1.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30`} title={label('voiceRecorder.rerecord', 'Re-record')}>
                        {label('voiceRecorder.rerecord', 'Re-record')}
                    </button>
                    <button onClick={onCancel} className={`px-3 py-1.5 rounded-full text-[11px] font-bold neu-button`} title={label('voiceRecorder.discard', 'Discard')}>
                       {label('voiceRecorder.discard', 'Discard')}
                    </button>
                </div>
                <button 
                   onClick={() => {
                      const m = Math.floor(duration / 60);
                      const s = duration % 60;
                      const url = previewUrl;
                      onSend(url, `${m}:${s.toString().padStart(2, '0')}`);
                   }}
                   className="px-4 py-1.5 rounded-full text-[11px] font-bold bg-orange-500 text-[var(--text-primary)] shadow-md"
                  >
                     {label('voiceRecorder.send', 'Send')}
                   </button>
             </div>
          </div>
        ) : (
           // Recording mode with swipe-to-cancel
           <div className={`w-full bg-[var(--bg-primary)] rounded-md px-1 relative overflow-hidden`}>
             <motion.div
               drag="y"
               dragConstraints={{ top: -120, bottom: 0 }}
               dragElastic={0.2}
               onDragEnd={(_: any, info: any) => {
                 if (info.offset.y < -60 || info.velocity.y < -300) {
                   handleCancel()
                 }
               }}
               className="flex items-center justify-between gap-3 h-10"
             >
              <div 
                  onClick={handleCancel}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-colors active:scale-95 text-[var(--text-secondary)] hover:text-red-400"
                    title={label('voiceRecorder.discard', 'Discard')}
                >
                  <Trash2 size={18} />
               </div>
              
              <div className="flex-1 flex items-center gap-3 overflow-hidden">
                 <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500"} ${!isPaused && isRecording ? "animate-pulse" : ""}`} />
                 <span className={`text-[13px] font-bold tracking-wide font-mono min-w-[36px] text-[var(--text-primary)]`}>
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
                         className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-300`}
                          title={isPaused ? label('voiceRecorder.resume', 'Resume') : label('voiceRecorder.pause', 'Pause')}
                          aria-label={isPaused ? label('voiceRecorder.resume', 'Resume') : label('voiceRecorder.pause', 'Pause')}
                       >
                          {isPaused ? <Play size={16} /> : <Pause size={16} />}
                       </button>
                  )}
                 <button 
                     onClick={handleStopRecording}
                     className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full cursor-pointer transition-all active:scale-95 bg-gradient-to-tr from-orange-500 to-orange-400 text-[var(--text-primary)] shadow-[0_0_10px_rgba(249,115,22,0.5)]"
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


