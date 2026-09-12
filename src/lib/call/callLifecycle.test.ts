import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callManager } from './CallManager';
import { useAppStore } from '../../store';

const recorderMock = vi.hoisted(() => ({
  startRecording: vi.fn(async () => true),
  stopRecording: vi.fn(),
  getRecordingBlob: vi.fn(),
}));

vi.mock('../../lib/callRecorderService', () => ({ callRecorderService: recorderMock }));

const makeStream = () =>
  ({
    getTracks: () => [],
    getAudioTracks: () => [],
    getVideoTracks: () => [],
    stop: vi.fn(),
  }) as unknown as MediaStream;

const makeTrack = (kind: string) =>
  ({
    kind,
    enabled: true,
    stop: vi.fn(),
    getSettings: () => ({}),
  }) as unknown as MediaStreamTrack;

const makeStreamWithTracks = (tracks: MediaStreamTrack[]) =>
  ({
    getTracks: () => [...tracks],
    getAudioTracks: () => tracks.filter((t) => t.kind === 'audio'),
    getVideoTracks: () => tracks.filter((t) => t.kind === 'video'),
    addTrack: (t: MediaStreamTrack) => tracks.push(t),
    stop: vi.fn(),
  }) as unknown as MediaStream;

const resetCallState = () => {
  useAppStore.setState({
    activeCall: null,
    callMinimized: false,
    incomingCall: null,
    callHistory: [],
    autoRecordCalls: true,
    saveAudioRecordings: true,
    saveVideoRecordings: true,
  });
};

describe('call lifecycle', () => {
  beforeEach(() => {
    recorderMock.startRecording.mockClear();
    recorderMock.stopRecording.mockClear();
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockImplementation(() => Promise.resolve(makeStream())),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'audioinput' },
          { kind: 'videoinput' },
        ] as MediaDeviceInfo[]),
      },
      configurable: true,
    });
    resetCallState();
  });

  afterEach(() => {
    const timer = (callManager as any).incomingTimer as ReturnType<typeof setTimeout> | null;
    if (timer) clearTimeout(timer);
    (callManager as any).incomingTimer = null;
    void callManager.endCall();
    vi.useRealTimers();
  });

  it('transitions a preview call from connecting to connected', async () => {
    await callManager.startPreviewCall('p1', 'Alice Freeman', 'audio');
    expect(useAppStore.getState().activeCall?.status).toBe('connecting');

    await vi.advanceTimersByTimeAsync(1500);

    expect(useAppStore.getState().activeCall?.status).toBe('connected');
  });

  it('does not mark a call connected after it was ended', async () => {
    await callManager.startPreviewCall('p1', 'Alice Freeman', 'audio');
    await vi.advanceTimersByTimeAsync(1000);
    await callManager.endCall();

    await vi.advanceTimersByTimeAsync(1500);

    expect(useAppStore.getState().activeCall).toBeNull();
  });

  it('logs an ended connected outgoing call with duration', async () => {
    await callManager.startPreviewCall('p1', 'Alice Freeman', 'audio');
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(65_000);

    await callManager.endCall();

    const [entry] = useAppStore.getState().callHistory;
    expect(entry.name).toBe('Alice Freeman');
    expect(entry.type).toBe('outgoing');
    expect(entry.duration).toBe('1m 6s');
  });

  it('logs an ended call that was never connected without duration', async () => {
    await callManager.startPreviewCall('p1', 'Alice Freeman', 'audio');
    await vi.advanceTimersByTimeAsync(500);

    await callManager.endCall();

    const [entry] = useAppStore.getState().callHistory;
    expect(entry.type).toBe('outgoing');
    expect(entry.duration).toBeUndefined();
  });

  it('answers an incoming call, clears the sheet, and logs it as incoming', async () => {
    callManager.startIncomingCall('p1', 'Bob Smith', 'audio');
    expect(useAppStore.getState().incomingCall?.peerId).toBe('p1');

    const call = await callManager.answerIncoming();

    expect(useAppStore.getState().incomingCall).toBeNull();
    expect(call?.direction).toBe('incoming');
    await vi.advanceTimersByTimeAsync(1500);
    await callManager.endCall();

    const [entry] = useAppStore.getState().callHistory;
    expect(entry.name).toBe('Bob Smith');
    expect(entry.type).toBe('incoming');
  });

  it('rejects an incoming call and logs it as declined', () => {
    callManager.startIncomingCall('p1', 'Bob Smith', 'audio');

    callManager.rejectIncoming();

    expect(useAppStore.getState().incomingCall).toBeNull();
    const [entry] = useAppStore.getState().callHistory;
    expect(entry.name).toBe('Bob Smith');
    expect(entry.type).toBe('declined');
  });

  it('logs an unanswered incoming call as missed after the timeout', () => {
    callManager.startIncomingCall('p1', 'Carol Lee', 'audio', 30_000);

    vi.advanceTimersByTime(30_000);

    expect(useAppStore.getState().incomingCall).toBeNull();
    const [entry] = useAppStore.getState().callHistory;
    expect(entry.name).toBe('Carol Lee');
    expect(entry.type).toBe('missed');
  });

  it('cancels the previous missed timer when a new incoming call starts', () => {
    callManager.startIncomingCall('p1', 'Alice Freeman', 'audio', 1000);
    vi.advanceTimersByTime(500);
    callManager.startIncomingCall('p2', 'Bob Smith', 'audio', 30_000);

    vi.advanceTimersByTime(600);

    expect(useAppStore.getState().incomingCall?.peerId).toBe('p2');
    expect(useAppStore.getState().callHistory).toEqual([]);
  });

  it.each([
    ['NotAllowedError', 'permission'],
    ['NotFoundError', 'no-device'],
    ['NotReadableError', 'device-busy'],
  ] as const)('emits call:error %s when %s', async (domName, reason) => {
    const errors: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:error') errors.push(e);
    });
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(new DOMException('denied', domName));

    await expect(callManager.startCall('p1', 'Alice Freeman', 'audio')).rejects.toBeInstanceOf(DOMException);

    unsubscribe();
    expect(errors).toHaveLength(1);
    expect(errors[0].data.reason).toBe(reason);
    expect(useAppStore.getState().activeCall).toBeNull();
  });

  it('keeps the sheet open when answering an incoming call fails', async () => {
    callManager.startIncomingCall('p1', 'Bob Smith', 'audio');
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));

    await expect(callManager.answerIncoming()).rejects.toBeInstanceOf(DOMException);

    expect(useAppStore.getState().incomingCall?.peerId).toBe('p1');
  });

  it('blocks an outgoing call when the required device is missing', async () => {
    vi.mocked(navigator.mediaDevices.enumerateDevices).mockResolvedValueOnce([{ kind: 'videoinput' }] as MediaDeviceInfo[]);
    const errors: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:error') errors.push(e);
    });

    await expect(callManager.startCall('p1', 'Alice Freeman', 'audio')).rejects.toBeInstanceOf(DOMException);

    unsubscribe();
    expect(errors).toHaveLength(1);
    expect(errors[0].data.reason).toBe('no-device');
    expect(useAppStore.getState().activeCall).toBeNull();
  });

  it('blocks a video call when the camera is missing', async () => {
    vi.mocked(navigator.mediaDevices.enumerateDevices).mockResolvedValueOnce([{ kind: 'audioinput' }] as MediaDeviceInfo[]);

    await expect(callManager.startCall('p1', 'Alice Freeman', 'video')).rejects.toBeInstanceOf(DOMException);

    expect(useAppStore.getState().activeCall).toBeNull();
  });

  it('fails with unknown when media devices are unsupported', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
    const errors: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:error') errors.push(e);
    });

    await expect(callManager.startCall('p1', 'Alice Freeman', 'audio')).rejects.toBeInstanceOf(DOMException);

    unsubscribe();
    expect(errors).toHaveLength(1);
    expect(errors[0].data.reason).toBe('unknown');
    expect(useAppStore.getState().activeCall).toBeNull();
  });

  it('does not block when device enumeration is empty', async () => {
    vi.mocked(navigator.mediaDevices.enumerateDevices).mockResolvedValueOnce([]);

    const call = await callManager.startCall('p1', 'Alice Freeman', 'audio');

    expect(call.status).toBe('connecting');
  });

  it('keeps the sheet open when answering with a missing device', async () => {
    callManager.startIncomingCall('p1', 'Bob Smith', 'audio');
    vi.mocked(navigator.mediaDevices.enumerateDevices).mockResolvedValueOnce([{ kind: 'videoinput' }] as MediaDeviceInfo[]);

    await expect(callManager.answerIncoming()).rejects.toBeInstanceOf(DOMException);

    expect(useAppStore.getState().incomingCall?.peerId).toBe('p1');
  });

  it('reports available devices', async () => {
    const result = await callManager.checkDevices();

    expect(result).toEqual({ supported: true, hasAudio: true, hasVideo: true });
  });

  it('acquires a camera track when switching an audio call to video', async () => {
    const firstStream = makeStreamWithTracks([makeTrack('audio')]);
    const secondStream = makeStreamWithTracks([makeTrack('audio'), makeTrack('video')]);
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(firstStream);
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(secondStream);

    await callManager.startCall('p1', 'Alice Freeman', 'audio');
    const companionAudio = secondStream.getAudioTracks()[0];
    const ok = await callManager.changeCallType('video');

    expect(ok).toBe(true);
    expect(useAppStore.getState().activeCall?.callType).toBe('video');
    expect(useAppStore.getState().activeCall?.isVideoEnabled).toBe(true);
    expect((callManager as any).localStream.getVideoTracks()).toHaveLength(1);
    expect(companionAudio.stop).toHaveBeenCalled();
  });

  it('keeps the camera track alive when switching a video call back to audio', async () => {
    const firstStream = makeStreamWithTracks([makeTrack('audio'), makeTrack('video')]);
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(firstStream);

    await callManager.startCall('p1', 'Alice Freeman', 'video');
    const videoTrack = firstStream.getVideoTracks()[0];
    const ok = await callManager.changeCallType('audio');

    expect(ok).toBe(true);
    expect(useAppStore.getState().activeCall?.callType).toBe('audio');
    expect(videoTrack.enabled).toBe(false);
    expect(videoTrack.stop).not.toHaveBeenCalled();
  });

  it('keeps the call type when the camera is denied during a video switch', async () => {
    const firstStream = makeStreamWithTracks([makeTrack('audio')]);
    vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation((constraints) =>
      constraints.video
        ? Promise.reject(new DOMException('denied', 'NotAllowedError'))
        : Promise.resolve(firstStream)
    );
    const errors: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:error') errors.push(e);
    });

    await callManager.startCall('p1', 'Alice Freeman', 'audio');
    const ok = await callManager.changeCallType('video');

    unsubscribe();
    expect(ok).toBe(false);
    expect(useAppStore.getState().activeCall?.callType).toBe('audio');
    expect(useAppStore.getState().activeCall?.isVideoEnabled).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0].data.reason).toBe('permission');
  });

  it('auto-starts recording when a call connects and links the id to call history', async () => {
    const stream = makeStreamWithTracks([makeTrack('audio')]);
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(stream);
    (callManager as any).getMixedStream = () => stream;

    await callManager.startCall('p1', 'Alice Freeman', 'audio');
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(0);

    const active = useAppStore.getState().activeCall;
    expect(active?.status).toBe('connected');
    expect(active?.isRecording).toBe(true);
    expect(active?.recordingId).toBeDefined();
    expect(recorderMock.startRecording).toHaveBeenCalledTimes(1);
    expect(recorderMock.startRecording).toHaveBeenCalledWith(active!.recordingId, stream, false);

    await callManager.endCall();

    const [entry] = useAppStore.getState().callHistory;
    expect(entry.recordingId).toBe(active!.recordingId);
    expect(recorderMock.stopRecording).toHaveBeenCalledTimes(1);
  });

  it('does not auto-record when autoRecordCalls is disabled', async () => {
    useAppStore.setState({ autoRecordCalls: false });
    const stream = makeStreamWithTracks([makeTrack('audio')]);
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(stream);

    await callManager.startCall('p1', 'Alice Freeman', 'audio');
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(0);

    expect(useAppStore.getState().activeCall?.isRecording).toBe(false);
    expect(recorderMock.startRecording).not.toHaveBeenCalled();
  });

  it('does not auto-record when saving audio recordings is disabled', async () => {
    useAppStore.setState({ saveAudioRecordings: false });
    const stream = makeStreamWithTracks([makeTrack('audio')]);
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(stream);

    await callManager.startCall('p1', 'Alice Freeman', 'audio');
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(0);

    expect(useAppStore.getState().activeCall?.isRecording).toBe(false);
    expect(recorderMock.startRecording).not.toHaveBeenCalled();
  });

  it('skips auto-record for preview calls with no tracks', async () => {
    await callManager.startPreviewCall('p1', 'Alice Freeman', 'audio');
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(0);

    expect(useAppStore.getState().activeCall?.isRecording).toBe(false);
    expect(recorderMock.startRecording).not.toHaveBeenCalled();
  });
});
