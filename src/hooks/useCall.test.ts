import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockActiveCall = {
  id: 'call-1',
  peerId: 'peer-1',
  type: 'audio' as const,
  isMuted: false,
  isVideoEnabled: false,
  isScreenSharing: false,
  isRecording: false,
};

const mockCallManager = {
  getActiveCall: vi.fn().mockReturnValue(null),
  subscribe: vi.fn(() => vi.fn()),
  startCall: vi.fn().mockResolvedValue(mockActiveCall),
  acceptCall: vi.fn().mockResolvedValue(mockActiveCall),
  endCall: vi.fn().mockResolvedValue(undefined),
  toggleMute: vi.fn().mockResolvedValue(undefined),
  toggleVideo: vi.fn().mockResolvedValue(undefined),
  toggleScreenShare: vi.fn().mockResolvedValue(undefined),
  toggleRecording: vi.fn().mockResolvedValue(undefined),
  changeCallType: vi.fn().mockResolvedValue(true),
};

vi.mock('../lib/call/CallManager', () => ({
  callManager: mockCallManager,
}));

describe('useCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallManager.getActiveCall.mockReturnValue(null);
  });

  it('should start with no active call', async () => {
    const { useCall } = await import('./useCall');
    const { result } = renderHook(() => useCall());
    expect(result.current.call).toBeNull();
  });

  it('should start a call', async () => {
    const { useCall } = await import('./useCall');
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.startCall('peer-1', 'Alice', 'audio');
    });

    expect(mockCallManager.startCall).toHaveBeenCalledWith('peer-1', 'Alice', 'audio');
    expect(result.current.call).toEqual(mockActiveCall);
  });

  it('should end a call', async () => {
    mockCallManager.getActiveCall.mockReturnValue(mockActiveCall);
    const { useCall } = await import('./useCall');
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.endCall();
    });

    expect(mockCallManager.endCall).toHaveBeenCalled();
    expect(result.current.call).toBeNull();
  });

  it('should toggle mute', async () => {
    const { useCall } = await import('./useCall');
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.toggleMute();
    });

    expect(mockCallManager.toggleMute).toHaveBeenCalled();
  });

  it('should toggle video', async () => {
    const { useCall } = await import('./useCall');
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.toggleVideo();
    });

    expect(mockCallManager.toggleVideo).toHaveBeenCalled();
  });

  it('should accept an incoming call', async () => {
    const { useCall } = await import('./useCall');
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.acceptCall('peer-2', 'Bob', 'video');
    });

    expect(mockCallManager.acceptCall).toHaveBeenCalledWith('peer-2', 'Bob', 'video');
    expect(result.current.call).toEqual(mockActiveCall);
  });

  it('should toggle screen share', async () => {
    const { useCall } = await import('./useCall');
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.toggleScreenShare();
    });

    expect(mockCallManager.toggleScreenShare).toHaveBeenCalled();
  });

  it('should change call type', async () => {
    const { useCall } = await import('./useCall');
    const { result } = renderHook(() => useCall());

    await act(async () => {
      await result.current.changeCallType('video');
    });

    expect(mockCallManager.changeCallType).toHaveBeenCalledWith('video');
  });

  it('should subscribe to call events on mount', async () => {
    const { useCall } = await import('./useCall');
    renderHook(() => useCall());
    expect(mockCallManager.subscribe).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', async () => {
    const unsub = vi.fn();
    mockCallManager.subscribe.mockReturnValue(unsub);
    const { useCall } = await import('./useCall');
    const { unmount } = renderHook(() => useCall());
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});
