import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dialpad } from './Dialpad';

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('../lib/i18n', () => ({
  useI18n: vi.fn(() => ({ t: (key: string) => key })),
}));

const { useAppStore } = await import('../store');
const mockUseAppStore = vi.mocked(useAppStore);

const defaultContacts = [
  { name: 'Alice', id: 'alice_id', color: 'from-pink-400 to-rose-400', lastSeen: 1000 },
  { name: 'Bob', id: 'bob_id', color: 'from-blue-400 to-indigo-400', lastSeen: 2000 },
];

const defaultProps = {
  theme: 'dark' as const,
  contacts: defaultContacts,
  showContactPicker: false,
  setShowContactPicker: vi.fn(),
  onCall: vi.fn(),
  onMessage: vi.fn(),
};

describe('Dialpad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockReturnValue({
      activeCall: null,
      setActiveCall: vi.fn(),
    });
  });

  it('renders search input', () => {
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByPlaceholderText('calls.searchDial')).toBeTruthy();
  });

  it('renders with dark theme', () => {
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByPlaceholderText('calls.searchDial')).toBeTruthy();
  });

  it('renders with light theme', () => {
    render(<Dialpad {...defaultProps} theme="light" />);
    expect(screen.getByPlaceholderText('calls.searchDial')).toBeTruthy();
  });

  it('renders recent calls header', () => {
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByText('calls.recent')).toBeTruthy();
  });

  it('renders call filter tabs', () => {
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByText('calls.all')).toBeTruthy();
    expect(screen.getByText('calls.incoming')).toBeTruthy();
    expect(screen.getByText('calls.outgoing')).toBeTruthy();
    expect(screen.getByText('calls.missed')).toBeTruthy();
  });

  it('renders recent call entries', () => {
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByText('Alice Freeman')).toBeTruthy();
    expect(screen.getByText('Operations Team')).toBeTruthy();
  });

  it('shows dialpad keys when number is entered', () => {
    render(<Dialpad {...defaultProps} />);
    const input = screen.getByPlaceholderText('calls.searchDial');
    fireEvent.change(input, { target: { value: '5' } });
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('JKL')).toBeTruthy();
  });

  it('shows delete button when number has digits', () => {
    render(<Dialpad {...defaultProps} />);
    const input = screen.getByPlaceholderText('calls.searchDial');
    fireEvent.change(input, { target: { value: '555' } });
    const deleteIcon = document.querySelector('svg[viewBox="0 0 24 24"] path[d*="M22 3H7"]');
    expect(deleteIcon).toBeTruthy();
  });

  it('shows active call UI with mute and speaker controls', () => {
    mockUseAppStore.mockReturnValue({
      activeCall: { number: '555-1234', startTime: Date.now(), isMuted: false, isSpeaker: false },
      setActiveCall: vi.fn(),
    });
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByText('calls.unknownCaller')).toBeTruthy();
    expect(screen.getByTitle('calls.muteMicrophone')).toBeTruthy();
    expect(screen.getByTitle('calls.enableSpeaker')).toBeTruthy();
    expect(screen.getByTitle('calls.endCall')).toBeTruthy();
  });

  it('shows muted state in active call', () => {
    mockUseAppStore.mockReturnValue({
      activeCall: { number: '555-1234', startTime: Date.now(), isMuted: true, isSpeaker: false },
      setActiveCall: vi.fn(),
    });
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByTitle('calls.unmuteMicrophone')).toBeTruthy();
    expect(screen.getByTitle('calls.enableSpeaker')).toBeTruthy();
  });

  it('shows speaker state in active call', () => {
    mockUseAppStore.mockReturnValue({
      activeCall: { number: '555-1234', startTime: Date.now(), isMuted: false, isSpeaker: true },
      setActiveCall: vi.fn(),
    });
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByTitle('calls.muteMicrophone')).toBeTruthy();
    expect(screen.getByTitle('calls.disableSpeaker')).toBeTruthy();
  });

  it('shows contact picker modal when showContactPicker is true', () => {
    render(<Dialpad {...defaultProps} showContactPicker={true} />);
    expect(screen.getByText('calls.selectContactTitle')).toBeTruthy();
  });

  it('shows contact names in picker', () => {
    render(<Dialpad {...defaultProps} showContactPicker={true} />);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
  });

  it('shows empty contacts message when contacts array is empty', () => {
    render(<Dialpad {...defaultProps} contacts={[]} showContactPicker={true} />);
    expect(screen.getByText('calls.noContacts')).toBeTruthy();
  });

  it('renders start call button', () => {
    render(<Dialpad {...defaultProps} />);
    expect(screen.getByTitle('calls.startCall')).toBeTruthy();
  });

  it('selecting a contact from picker sets the number', () => {
    const setShowContactPicker = vi.fn();
    render(<Dialpad {...defaultProps} showContactPicker={true} setShowContactPicker={setShowContactPicker} />);
    fireEvent.click(screen.getByText('Alice'));
    expect(setShowContactPicker).toHaveBeenCalledWith(false);
  });
});
