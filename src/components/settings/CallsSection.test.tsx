import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Video: 'div', Phone: 'div', Clock: 'div', Trash2: 'div', Share2: 'div', History: 'div',
  FolderOpen: 'div', PhoneIncoming: 'div', Mic: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

const h = vi.hoisted(() => ({
  premium: false as boolean,
  saveAudio: true as boolean,
  saveVideo: true as boolean,
  retention: 30 as number,
  autoRecord: true as boolean,
  setSaveAudio: vi.fn(),
  setSaveVideo: vi.fn(),
  setRetention: vi.fn(),
  setAutoRecord: vi.fn(),
  startIncomingCall: vi.fn(),
}));

vi.mock('../../store', () => ({
  useAppStore: (selector?: any) =>
    selector ? selector({
      premiumEntitlement: { premium: h.premium },
      saveAudioRecordings: h.saveAudio,
      setSaveAudioRecordings: h.setSaveAudio,
      saveVideoRecordings: h.saveVideo,
      setSaveVideoRecordings: h.setSaveVideo,
      recordingsRetentionDays: h.retention,
      setRecordingsRetentionDays: h.setRetention,
      autoRecordCalls: h.autoRecord,
      setAutoRecordCalls: h.setAutoRecord,
    }) : {},
}));
vi.mock('../../lib/call/CallManager', () => ({ callManager: { startIncomingCall: h.startIncomingCall } }));
vi.mock('../../lib/recordingRetention', () => ({
  runRecordingRetention: vi.fn(),
  startRecordingRetention: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import { CallsSection } from './CallsSection';
import { callManager } from '../../lib/call/CallManager';
import { runRecordingRetention } from '../../lib/recordingRetention';
import { toast } from 'sonner';
import { MOCK_CALLS } from '../../constants/mock/mockCalls';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void; setSubView?: (v: string | null) => void } = {}) =>
  render(<CallsSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} setSubView={props.setSubView} />);

describe('CallsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.premium = false;
    h.saveAudio = true;
    h.saveVideo = true;
    h.retention = 30;
    h.autoRecord = true;
  });

  it('renders header, sections and back button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('call.callsSettings', 'Call settings') })).toBeInTheDocument();
    expect(screen.getByText(t('settings.callNavSection', 'Call tools'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.recordingsSaveSection', 'Save recordings'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.recordingsCleanupSection', 'Automatic cleanup'))).toBeInTheDocument();
  });

  it('renders call tool rows', () => {
    renderSection();
    expect(screen.getByText('call.callHistory')).toBeInTheDocument();
    expect(screen.getByText(t('call.callHistorySubtitle', 'Recent calls and meetings'))).toBeInTheDocument();
    expect(screen.getByText('call.simulateIncoming')).toBeInTheDocument();
    expect(screen.getByText('call.incomingCall')).toBeInTheDocument();
    expect(screen.getByText(t('nav.recordings', 'Call Log'))).toBeInTheDocument();
  });

  it('opens call log via setSubView', () => {
    const setSubView = vi.fn();
    renderSection({ setSubView });
    fireEvent.click(screen.getByText('call.callHistory'));
    expect(setSubView).toHaveBeenCalledWith('callLog');
  });

  it('opens recordings via setSubView', () => {
    const setSubView = vi.fn();
    renderSection({ setSubView });
    fireEvent.click(screen.getByText(t('nav.recordings', 'Call Log')));
    expect(setSubView).toHaveBeenCalledWith('recordings');
  });

  it('simulates incoming call via callManager', () => {
    renderSection();
    fireEvent.click(screen.getByText('call.simulateIncoming'));
    expect(h.startIncomingCall).toHaveBeenCalledWith('incoming_demo', MOCK_CALLS[0].name, 'audio');
  });

  it('toggles save audio recordings', () => {
    renderSection();
    fireEvent.click(screen.getByRole('switch', { name: t('settings.saveAudioCalls', 'Save audio calls') }));
    expect(h.setSaveAudio).toHaveBeenCalledWith(false);
  });

  it('toggles auto record calls', () => {
    renderSection();
    fireEvent.click(screen.getByRole('switch', { name: t('settings.autoRecordCalls', 'Record calls automatically') }));
    expect(h.setAutoRecord).toHaveBeenCalledWith(false);
  });

  it('toggles save video recordings', () => {
    renderSection();
    fireEvent.click(screen.getByRole('switch', { name: t('settings.saveVideoCalls', 'Save video calls') }));
    expect(h.setSaveVideo).toHaveBeenCalledWith(false);
  });

  it('cycles retention days for non-premium (30 -> 90)', () => {
    renderSection();
    expect(screen.getByText(t('settings.saveAudioCalls', 'Save audio calls'))).toBeInTheDocument(); // sanity
    fireEvent.click(screen.getByText(t('settings.recordingsRetention', 'Delete recordings older than')));
    expect(h.setRetention).toHaveBeenCalledWith(90);
  });

  it('shows Forever label when retention is 0 and premium retention options include 0', () => {
    h.premium = true;
    h.retention = 0;
    renderSection();
    expect(screen.getByText('Forever')).toBeInTheDocument();
    fireEvent.click(screen.getByText(t('settings.recordingsRetention', 'Delete recordings older than')));
    expect(h.setRetention).toHaveBeenCalledWith(7);
  });

  it('shows premium gating subtitle for non-premium retention row', () => {
    renderSection();
    expect(screen.getByText(t('premium.gatingRetention', 'Longer retention is available with Premium'))).toBeInTheDocument();
  });

  it('shows premium subtitle when premium active', () => {
    h.premium = true;
    renderSection();
    expect(screen.getByText(t('settings.recordingsRetentionSubtitle', 'Periodically remove old calls and video calls'))).toBeInTheDocument();
  });

  it('cleans recordings now and toasts removed count', async () => {
    (runRecordingRetention as any).mockResolvedValue(3);
    renderSection();
    fireEvent.click(screen.getByText(t('settings.recordingsCleanNow', 'Delete old recordings now')));
    expect(runRecordingRetention).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(t('settings.recordingsCleaned', 'Removed {n} old recordings').replace('{n}', '3')));
  });

  it('toasts nothing to clean when retention removes none', async () => {
    (runRecordingRetention as any).mockResolvedValue(0);
    renderSection();
    fireEvent.click(screen.getByText(t('settings.recordingsCleanNow', 'Delete old recordings now')));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(t('settings.recordingsNothingToClean', 'No recordings to remove')));
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});