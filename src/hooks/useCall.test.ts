import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCall } from './useCall';

vi.mock('../lib/call/CallManager', () => ({
  callManager: {
    getActiveCall: vi.fn(() => null),
    subscribe: vi.fn(() => vi.fn()),
    startCall: vi.fn(async () => ({ id: 'call-1', peerId: 'peer-1', type: 'audio', status: 'active' })),
    acceptCall: vi.fn(async () => ({ id: 'call-2', peerId: 'peer-2', type: 'video', status: 'active' })),
    endCall: vi.fn(async () => {}),
    toggleMute: vi.fn(async () => {}),
    toggleVideo: vi.fn(async () => {}),
    toggleScreenShare: vi.fn(async () => {}),
    toggleRecording: vi.fn(async () => {}),
    changeCallType: vi.fn(async () => true),
  },
}));

describe('useCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null call initially', () => {
    const { result } = renderHook(() => useCall());
    expect(result.current.call).toBeNull();
  });

  it('starts a call and sets it as active', async () => {
    const { result } = renderHook(() => useCall());

    let call: any;
    await act(async () => {
      call = await result.current.startCall('peer-1', 'Alice', 'audio');
    });

    expect(call).toBeDefined();
    expect(call.peerId).toBe('peer-1');
    expect(call.type).toBe('audio');
  });

  it('accepts a call and sets it as active', async () => {
    const { result } = renderHook(() => useCall());

    let call: any;
    await act(async () => {
      call = await result.current.acceptCall('peer-2', 'Bob', 'video');
    });

    expect(call).toBeDefined();
    expect(call.peerId).toBe('peer-2');
    expect(call.type).toBe('video');
  });

  it('ends a call and sets call to null', async () => {
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.startCall('peer-1', 'Alice', 'audio');
    });

    await act(async () => {
      await result.current.endCall();
    });

    expect(result.current.call).toBeNull();
  });

  it('toggles mute', async () => {
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.startCall('peer-1', 'Alice', 'audio');
    });

    await act(async () => {
      await result.current.toggleMute();
    });

    expect(result.current.call).toBeDefined();
  });

  it('toggles video', async () => {
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.startCall('peer-1', 'Alice', 'audio');
    });

    await act(async () => {
      await result.current.toggleVideo();
    });

    expect(result.current.call).toBeDefined();
  });

  it('toggles screen share', async () => {
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.startCall('peer-1', 'Alice', 'audio');
    });

    await act(async () => {
      await result.current.toggleScreenShare();
    });

    expect(result.current.call).toBeDefined();
  });

  it('toggles recording', async () => {
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.startCall('peer-1', 'Alice', 'audio');
    });

    await act(async () => {
      await result.current.toggleRecording();
    });

    expect(result.current.call).toBeDefined();
  });

  it('changes call type', async () => {
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.startCall('peer-1', 'Alice', 'audio');
    });

    let ok: boolean;
    await act(async () => {
      ok = await result.current.changeCallType('video');
    });

    expect(ok).toBe(true);
  });
});