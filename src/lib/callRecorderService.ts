import { recordingStorage } from './recordingStorage';

export interface CallRecording {
  id: string;
  callId: string;
  callType: 'audio' | 'video' | 'group_audio' | 'group_video' | 'huddle' | 'voice_memo';
  participants: { userId: string; displayName: string; avatar?: string }[];
  title?: string;
  startedAt: number;
  duration: number;
  recordingDuration: number;
  fileSize: number;
  mimeType: string;
  blobId: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: number;
}

type RecorderState = 'idle' | 'recording' | 'stopping';

class CallRecorderService {
  private state: RecorderState = 'idle';
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private currentRecordingId: string | null = null;
  private handlers: Set<(recording: boolean) => void> = new Set();

  get isRecording(): boolean {
    return this.state === 'recording';
  }

  onStateChange(handler: (recording: boolean) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private notify(recording: boolean) {
    this.handlers.forEach((h) => h(recording));
  }

  private getMimeType(isVideo: boolean): string {
    if (isVideo) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8';
      return 'video/webm';
    }
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    return 'audio/webm';
  }

  async startRecording(recordingId: string, stream: MediaStream, isVideo: boolean): Promise<boolean> {
    if (this.state !== 'idle') {
      console.warn('call-recorder: Already recording, skipping');
      return false;
    }

    try {
      const mimeType = this.getMimeType(isVideo);
      this.chunks = [];
      this.currentRecordingId = recordingId;

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => this.onRecordingComplete();
      this.mediaRecorder.onerror = () => {
        console.error('call-recorder: MediaRecorder error');
        this.discardRecording();
      };

      this.mediaRecorder.start();
      this.state = 'recording';
      this.notify(true);
      return true;
    } catch (err) {
      console.error('call-recorder: Failed to start recording:', err);
      return false;
    }
  }

  stopRecording(): void {
    if (this.state !== 'recording' || !this.mediaRecorder) return;
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.state = 'stopping';
  }

  discardRecording(): void {
    this.chunks = [];
    this.currentRecordingId = null;
    this.mediaRecorder = null;
    this.state = 'idle';
    this.notify(false);
  }

  private async onRecordingComplete(): Promise<void> {
    if (this.chunks.length === 0) {
      this.discardRecording();
      return;
    }

    const id = this.currentRecordingId!;
    const isVideo = this.mediaRecorder?.mimeType.startsWith('video/') ?? false;
    const blob = new Blob(this.chunks, { type: isVideo ? 'video/webm' : 'audio/webm' });

    try {
      await recordingStorage.saveBlob(id, blob);
    } catch (err) {
      console.error('call-recorder: Failed to save blob:', err);
    }

    this.chunks = [];
    this.currentRecordingId = null;
    this.mediaRecorder = null;
    this.state = 'idle';
    this.notify(false);
  }

  async getRecordingBlob(id: string): Promise<Blob | null> {
    return recordingStorage.getBlob(id);
  }

  async deleteRecording(id: string): Promise<void> {
    await recordingStorage.deleteBlob(id);
  }

  async exportRecording(id: string, title: string): Promise<void> {
    const blob = await recordingStorage.getBlob(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const callRecorderService = new CallRecorderService();
