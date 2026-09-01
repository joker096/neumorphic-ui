import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callManager } from './CallManager';
import { useAppStore } from '../../store';

const makeStream = () =>
  ({
    getTracks: () => [],
    getAudioTracks: () => [],
    getVideoTracks: () => [],
    stop: vi.fn(),
  }) as unknown as MediaStream;

const resetCallState = () => {
  useAppStore.setState({
    activeCall: null,
    callMinimized: false,
    incomingCall: null,
    callHistory: [],
    connectionStatus: 'disconnected',
  });
};

const startConnectedCall = async () => {
  await callManager.startPreviewCall('p1', 'Alice Freeman', 'audio');
  await vi.advanceTimersByTimeAsync(1500);
};

describe('call network state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockImplementation(() => Promise.resolve(makeStream())) },
      configurable: true,
    });
    resetCallState();
  });

  afterEach(() => {
    const timer = (callManager as any).incomingTimer as ReturnType<typeof setTimeout> | null;
    if (timer) clearTimeout(timer);
    (callManager as any).incomingTimer = null;
    void callManager.endCall();
    resetCallState();
    vi.useRealTimers();
  });

  it('marks an active call reconnecting when the transport disconnects', async () => {
    await startConnectedCall();
    expect(useAppStore.getState().activeCall?.status).toBe('connected');

    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:reconnecting') events.push(e);
    });

    useAppStore.setState({ connectionStatus: 'connected' });
    useAppStore.setState({ connectionStatus: 'error' });

    expect(useAppStore.getState().activeCall?.status).toBe('reconnecting');
    unsubscribe();
    expect(events).toHaveLength(1);
  });

  it('does not demote a connected call on a transient connecting status', async () => {
    await startConnectedCall();

    useAppStore.setState({ connectionStatus: 'connecting' });

    expect(useAppStore.getState().activeCall?.status).toBe('connected');
  });

  it('restores a reconnecting call when the transport reconnects', async () => {
    await startConnectedCall();
    useAppStore.setState({ connectionStatus: 'connected' });
    useAppStore.setState({ connectionStatus: 'error' });
    expect(useAppStore.getState().activeCall?.status).toBe('reconnecting');

    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:reconnected') events.push(e);
    });

    useAppStore.setState({ connectionStatus: 'connected' });

    expect(useAppStore.getState().activeCall?.status).toBe('connected');
    unsubscribe();
    expect(events).toHaveLength(1);
  });

  it('marks the call reconnecting on the window offline event', async () => {
    await startConnectedCall();

    window.dispatchEvent(new Event('offline'));

    expect(useAppStore.getState().activeCall?.status).toBe('reconnecting');
  });

  it('restores the call on the window online event', async () => {
    await startConnectedCall();
    window.dispatchEvent(new Event('offline'));
    expect(useAppStore.getState().activeCall?.status).toBe('reconnecting');

    window.dispatchEvent(new Event('online'));

    expect(useAppStore.getState().activeCall?.status).toBe('connected');
  });

  it('ignores offline events when there is no active call', () => {
    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:reconnecting') events.push(e);
    });

    window.dispatchEvent(new Event('offline'));

    unsubscribe();
    expect(events).toHaveLength(0);
    expect(useAppStore.getState().activeCall).toBeNull();
  });

  it('does not demote a connecting call on network drop', async () => {
    await callManager.startPreviewCall('p1', 'Alice Freeman', 'audio');
    expect(useAppStore.getState().activeCall?.status).toBe('connecting');

    window.dispatchEvent(new Event('offline'));

    expect(useAppStore.getState().activeCall?.status).toBe('connecting');
  });

  it('marks a reconnecting call as network error after the timeout', async () => {
    await startConnectedCall();
    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:network-error') events.push(e);
    });

    useAppStore.setState({ connectionStatus: 'connected' });
    useAppStore.setState({ connectionStatus: 'error' });
    expect(useAppStore.getState().activeCall?.status).toBe('reconnecting');

    // CallManager.NETWORK_ERROR_TIMEOUT_MS
    await vi.advanceTimersByTimeAsync(10_000);

    unsubscribe();
    expect(useAppStore.getState().activeCall?.status).toBe('error');
    expect(events).toHaveLength(1);
  });

  it('clears the network error timer when the network recovers', async () => {
    await startConnectedCall();
    window.dispatchEvent(new Event('offline'));
    expect(useAppStore.getState().activeCall?.status).toBe('reconnecting');

    await vi.advanceTimersByTimeAsync(5_000);
    window.dispatchEvent(new Event('online'));
    expect(useAppStore.getState().activeCall?.status).toBe('connected');

    await vi.advanceTimersByTimeAsync(10_000);
    expect(useAppStore.getState().activeCall?.status).toBe('connected');
  });

  it('restores a network-error call on the window online event', async () => {
    await startConnectedCall();
    window.dispatchEvent(new Event('offline'));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(useAppStore.getState().activeCall?.status).toBe('error');

    window.dispatchEvent(new Event('online'));

    expect(useAppStore.getState().activeCall?.status).toBe('connected');
  });

  it('emits call:quality when the in-call network quality degrades', async () => {
    await startConnectedCall();
    useAppStore.setState({ latencyMs: 100 }); // baseline: good
    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:quality') events.push(e.data);
    });

    useAppStore.setState({ latencyMs: 500 }); // poor
    useAppStore.setState({ latencyMs: 300 }); // fair

    unsubscribe();
    expect(events).toEqual([{ level: 1 }, { level: 2 }]);
  });

  it('emits call:quality recovery when the network quality returns to good', async () => {
    await startConnectedCall();
    useAppStore.setState({ latencyMs: 100 }); // baseline: good
    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:quality') events.push(e.data);
    });

    useAppStore.setState({ latencyMs: 500 }); // poor
    useAppStore.setState({ latencyMs: 100 }); // back to good

    unsubscribe();
    expect(events).toEqual([{ level: 1 }, { level: 3 }]);
  });

  it('does not emit call:quality when there is no active call', () => {
    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:quality') events.push(e);
    });

    useAppStore.setState({ latencyMs: 500 });

    unsubscribe();
    expect(events).toHaveLength(0);
  });

  it('does not emit call:quality while reconnecting and re-baselines after recovery', async () => {
    await startConnectedCall();
    useAppStore.setState({ latencyMs: 100 }); // baseline: good
    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:quality') events.push(e);
    });

    window.dispatchEvent(new Event('offline')); // -> reconnecting
    useAppStore.setState({ latencyMs: 500 }); // ignored while reconnecting
    window.dispatchEvent(new Event('online')); // -> connected
    useAppStore.setState({ latencyMs: 500 }); // re-baseline, no event

    unsubscribe();
    expect(events).toHaveLength(0);
  });

  it('does not repeat call:quality when the level stays the same', async () => {
    await startConnectedCall();
    useAppStore.setState({ latencyMs: 100 }); // baseline: good
    const events: any[] = [];
    const unsubscribe = callManager.subscribe((e) => {
      if (e.type === 'call:quality') events.push(e);
    });

    useAppStore.setState({ latencyMs: 140 }); // still good

    unsubscribe();
    expect(events).toHaveLength(0);
  });
});
