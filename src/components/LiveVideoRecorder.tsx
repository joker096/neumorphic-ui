import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface LiveVideoRecorderProps {
  onCancel: () => void;
  onSend: (videoUrl: string, durationStr: string, blob: Blob) => void;
  onPermissionDenied?: (message: string) => void;
}

export const LiveVideoRecorder = ({ onCancel, onSend, onPermissionDenied }: LiveVideoRecorderProps) => {
  const { t } = useI18n();
  const label = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const durationRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  useEffect(() => {
    let intv: ReturnType<typeof setInterval>;
    if (isRecording) {
      intv = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
        if (durationRef.current >= 60) handleStopAndSend();
      }, 1000);
    }
    return () => clearInterval(intv);
  }, [isRecording]);

  const cleanup = () => {
    mediaRecorderRef.current?.stream.getTracks().forEach((tr) => tr.stop());
    stream?.getTracks().forEach((tr) => tr.stop());
  };

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        const p = videoRef.current.play();
        if (p) p.catch(() => {});
      }
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8'
          : 'video/webm';
      const mr = new MediaRecorder(mediaStream, { mimeType: mime });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      durationRef.current = 0;
      setDuration(0);

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        const m = Math.floor(durationRef.current / 60);
        const s = durationRef.current % 60;
        onSend(url, `${m}:${s.toString().padStart(2, '0')}`, blob);
      };

      mr.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error("Camera access denied", err);
      onPermissionDenied?.(label('videoRecorder.permissionDenied', 'Camera access is blocked. Please allow camera and microphone permissions and try again.'));
      onCancel();
    }
  };

  const handleStopAndSend = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((tr) => tr.stop());
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
      onCancel();
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  return (
    <div className="w-full bg-[var(--bg-primary)] rounded-md px-1 relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 h-12">
        <button
          onClick={handleCancel}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-colors active:scale-95 text-[var(--text-secondary)] hover:text-red-400"
          title={label('videoRecorder.discard', 'Discard')}
          aria-label={label('videoRecorder.discard', 'Discard')}
        >
          <X size={20} />
        </button>

        <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-[var(--accent)] shrink-0">
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
          {!isRecording && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] text-white">{label('videoRecorder.preparing', 'Preparing…')}</div>}
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          <div className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
          <span className="text-[13px] font-bold tracking-wide font-mono text-[var(--text-primary)]">
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
          </span>
        </div>

        <button
          onClick={handleStopAndSend}
          disabled={!isRecording}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full transition-all active:scale-95 bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)] disabled:opacity-40"
          title={label('videoRecorder.stopAndSend', 'Stop and Send')}
          aria-label={label('videoRecorder.stopAndSend', 'Stop and Send')}
        >
          <Send size={18} className="-ml-0.5" />
        </button>
      </div>
    </div>
  );
};