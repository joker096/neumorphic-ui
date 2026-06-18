import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Pause, Play } from 'lucide-react';
import { VoiceWaveform } from './VoiceWaveform';
import { useI18n } from '../lib/i18n';

interface LiveVoiceRecorderProps {
   isDark: boolean;
   onCancel: () => void;
   onSend: (audioUrl: string, durationStr: string) => void;
   onReRecord: () => void;
   onPermissionDenied?: (message: string) => void;
   holdToRecord?: boolean;
 }

export const LiveVoiceRecorder = ({ isDark, onCancel, onSend, onReRecord, onPermissionDenied, holdToRecord = true }: LiveVoiceRecorderProps) => {
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
          <div className={`w-full flex flex-col gap-3 ${isDark ? "bg-[#13151b]" : "bg-[#f4f7f9]"} rounded-2xl px-2 py-3`}>
             <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>{label('voiceRecorder.preview', 'PREVIEW')}</span>
             </div>
             <div className="flex items-center gap-2">
                <VoiceWaveform audioUrl={previewUrl} isDark={isDark} isMe={true} />
             </div>
             <div className="flex items-center justify-between">
                <div className="flex gap-2">
                   <button onClick={onReRecord} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${isDark ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-red-50 text-red-600 hover:bg-red-100"}`} title={label('voiceRecorder.rerecord', 'Re-record')}>
                        {label('voiceRecorder.rerecord', 'Re-record')}
                    </button>
                    <button onClick={onCancel} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-black/5 text-slate-500 hover:bg-black/10"}`} title={label('voiceRecorder.discard', 'Discard')}>
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
                   className={`px-4 py-1.5 rounded-full text-[11px] font-bold ${isDark ? "bg-orange-500 text-white" : "bg-orange-400 text-orange-950"} shadow-md`}
                  >
                     {label('voiceRecorder.send', 'Send')}
                  </button>
             </div>
          </div>
       ) : (
          // Recording mode
          <div className={`w-full flex items-center justify-between gap-3 h-10 ${isDark ? "bg-[#13151b]" : "bg-[#f4f7f9]"} rounded-2xl px-1`}>
             <div 
                 onClick={handleCancel}
                 className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-colors active:scale-95 ${isDark ? "text-gray-400 hover:text-red-400" : "text-slate-500 hover:text-red-500"}`}
                   title={label('voiceRecorder.discard', 'Discard')}
               >
                 <Trash2 size={18} />
              </div>
             
             <div className="flex-1 flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500"} ${!isPaused && isRecording ? "animate-pulse" : ""}`} />
                <span className={`text-[13px] font-bold tracking-wide font-mono min-w-[36px] ${isDark ? "text-white" : "text-slate-800"}`}>
                   {formatTime(duration)}
                </span>
                <div className="flex-1 h-8 px-2 flex items-center">
                   <VoiceWaveform stream={stream} isDark={isDark} />
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                {isRecording && (
                  <button 
                       onClick={handlePauseResume}
                       className={`w-8 h-8 flex items-center justify-center rounded-full ${isDark ? "bg-white/5 text-gray-300" : "bg-black/5 text-slate-500"}`}
                        title={isPaused ? label('voiceRecorder.resume', 'Resume') : label('voiceRecorder.pause', 'Pause')}
                    >
                       {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                )}
                <button 
                    onClick={handleStopRecording}
                    className={`w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full cursor-pointer transition-all active:scale-95 ${isDark ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-md"}`}
                    title={label('voiceRecorder.stopAndSend', 'Stop and Send')}
                 >
                    <Send size={18} className="-ml-0.5" />
                 </button>
             </div>
          </div>
       )
    );
};
