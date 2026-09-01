import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CallOverlay } from './CallOverlay';

const storeState = vi.hoisted(() => ({
  callMinimized: false,
  setCallMinimized: vi.fn(),
  setActiveCall: vi.fn(),
  incomingCall: null as null | { displayName: string; callType: string },
}));

const callHook = vi.hoisted(() => ({
  call: null as unknown,
  endCall: vi.fn(),
  toggleMute: vi.fn(),
  toggleVideo: vi.fn(),
  toggleScreenShare: vi.fn(),
  toggleRecording: vi.fn(),
  toggleSpeaker: vi.fn(),
  flipCamera: vi.fn(),
  changeCallType: vi.fn(),
}));

const callManagerMock = vi.hoisted(() => ({
  subscribe: vi.fn(),
  answerIncoming: vi.fn().mockResolvedValue(undefined),
  rejectIncoming: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
}));

const callScreenRef: { current: Record<string, unknown> | null } = { current: null };
const incomingRef: { current: Record<string, unknown> | null } = { current: null };
const subscribeCbRef: { current: ((event: { type: string; data?: unknown }) => void) | null } = { current: null };

vi.mock('../../store', () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock('../../hooks/useCall', () => ({
  useCall: () => callHook,
}));

vi.mock('../../lib/call/CallManager', () => ({ callManager: callManagerMock }));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('../call/CallScreen', () => ({
  CallScreen: (props: Record<string, unknown>) => {
    callScreenRef.current = props;
    return <div>active call screen</div>;
  },
}));

vi.mock('../call/IncomingCallSheet', () => ({
  IncomingCallSheet: (props: {
    callerName: string;
    callType: string;
    onAccept: () => void;
    onReject: () => void;
    onAcceptVideo: () => void;
  }) => {
    incomingRef.current = props;
    return (
      <div>
        <button type="button" onClick={props.onAccept}>accept</button>
        <button type="button" onClick={props.onReject}>reject</button>
        <button type="button" onClick={props.onAcceptVideo}>accept-video</button>
      </div>
    );
  },
}));

describe('CallOverlay', () => {
  beforeEach(() => {
    callScreenRef.current = null;
    incomingRef.current = null;
    subscribeCbRef.current = null;
    storeState.callMinimized = false;
    storeState.incomingCall = null;
    callHook.call = null;
    storeState.setCallMinimized.mockClear();
    callManagerMock.subscribe.mockImplementation((cb: (event: { type: string; data?: unknown }) => void) => {
      subscribeCbRef.current = cb;
      return () => {};
    });
    callManagerMock.answerIncoming.mockClear();
    callManagerMock.rejectIncoming.mockClear();
    toastMock.error.mockClear();
    toastMock.warning.mockClear();
    toastMock.success.mockClear();
  });

  it('renders the active CallScreen when a call is not minimized', () => {
    const call = { callId: 'c1' };
    callHook.call = call;
    render(<CallOverlay />);
    expect(screen.getByText('active call screen')).toBeInTheDocument();
    expect(callScreenRef.current?.call).toBe(call);
  });

  it('wires minimize to the store and ends the call via the hook', () => {
    callHook.call = { callId: 'c1' };
    render(<CallOverlay />);
    (callScreenRef.current?.onMinimize as () => void)();
    expect(storeState.setCallMinimized).toHaveBeenCalledWith(true);
    expect(callScreenRef.current?.onEnd).toBe(callHook.endCall);
  });

  it('hides the CallScreen when the call is minimized', () => {
    callHook.call = { callId: 'c1' };
    storeState.callMinimized = true;
    render(<CallOverlay />);
    expect(callScreenRef.current).toBeNull();
    expect(screen.queryByText('active call screen')).not.toBeInTheDocument();
  });

  it('does not render a CallScreen without an active call', () => {
    render(<CallOverlay />);
    expect(callScreenRef.current).toBeNull();
  });

  it('renders the incoming sheet and wires accept, reject and video accept', () => {
    storeState.incomingCall = { displayName: 'Alice', callType: 'audio' };
    render(<CallOverlay />);
    expect(incomingRef.current?.callerName).toBe('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'reject' }));
    fireEvent.click(screen.getByRole('button', { name: 'accept-video' }));
    expect(callManagerMock.answerIncoming).toHaveBeenCalledTimes(2);
    expect(callManagerMock.answerIncoming.mock.calls[0]).toEqual([]);
    expect(callManagerMock.answerIncoming.mock.calls[1]).toEqual(['video']);
    expect(callManagerMock.rejectIncoming).toHaveBeenCalledTimes(1);
  });

  it('does not render an incoming sheet without an incoming call', () => {
    render(<CallOverlay />);
    expect(incomingRef.current).toBeNull();
  });

  it('surfaces quality and error toasts from call events', () => {
    render(<CallOverlay />);
    const cb = subscribeCbRef.current;
    expect(cb).not.toBeNull();

    cb!({ type: 'call:quality', data: { level: 1 } });
    expect(toastMock.error).toHaveBeenCalledWith('call.networkQualityPoor');
    cb!({ type: 'call:quality', data: { level: 2 } });
    expect(toastMock.warning).toHaveBeenCalledWith('call.networkQualityFair');
    cb!({ type: 'call:quality', data: { level: 3 } });
    expect(toastMock.success).toHaveBeenCalledWith('call.networkQualityGood');

    cb!({ type: 'call:error', data: { reason: 'permission' } });
    expect(toastMock.error).toHaveBeenCalledWith('call.permissionDenied');
    cb!({ type: 'call:error', data: { reason: 'no-device' } });
    expect(toastMock.error).toHaveBeenCalledWith('call.noDevice');
    cb!({ type: 'call:error', data: { reason: 'device-busy' } });
    expect(toastMock.error).toHaveBeenCalledWith('call.deviceBusy');
    cb!({ type: 'call:error', data: {} });
    expect(toastMock.error).toHaveBeenCalledWith('call.startFailed');
  });
});
