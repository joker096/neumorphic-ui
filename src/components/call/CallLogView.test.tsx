import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CallLogView } from './CallLogView';

const storeState = vi.hoisted(() => ({
  callHistory: [] as Array<{ id: string; name: string; type: string; time: string; duration?: string }>,
  clearCallHistory: vi.fn(),
}));

const callManagerMock = vi.hoisted(() => ({
  startPreviewCall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../store', () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock('../../lib/call/CallManager', () => ({ callManager: callManagerMock }));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

const subViewRef: { current: { title: string; onBack?: () => void } | null } = { current: null };
vi.mock('../ui/SubView', () => ({
  SubView: ({ title, onBack, children }: { title: string; onBack?: () => void; children?: ReactNode }) => {
    subViewRef.current = { title, onBack };
    return (
      <div>
        <button type="button" aria-label="back" onClick={() => onBack?.()}>
          {title}
        </button>
        {children}
      </div>
    );
  },
}));

vi.mock('../ui/DataState', () => ({
  DataState: ({
    title,
    description,
    action,
  }: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
      {action ? <button type="button" onClick={action.onClick}>{action.label}</button> : null}
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  PhoneIncoming: () => null,
  PhoneOutgoing: () => null,
  PhoneMissed: () => null,
  PhoneOff: () => null,
  Phone: () => null,
  Search: () => null,
  Trash2: () => null,
}));

const alice = { id: '1', name: 'Alice', type: 'incoming', time: '10:00' };
const bob = { id: '2', name: 'Bob', type: 'outgoing', time: '09:30' };

describe('CallLogView', () => {
  beforeEach(() => {
    storeState.callHistory = [];
    storeState.clearCallHistory.mockClear();
    callManagerMock.startPreviewCall.mockClear();
    subViewRef.current = null;
  });

  it('shows empty state with View contacts action', () => {
    const onOpenContacts = vi.fn();
    render(<CallLogView onOpenContacts={onOpenContacts} />);
    expect(screen.getByText('call.noCallsYet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View contacts' }));
    expect(onOpenContacts).toHaveBeenCalledTimes(1);
  });

  it('shows no action when no contacts handler provided', () => {
    render(<CallLogView />);
    expect(screen.getByText('call.noCallsYet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View contacts' })).not.toBeInTheDocument();
  });

  it('renders call entries with time and duration', () => {
    storeState.callHistory = [
      { ...alice, duration: '5 min' },
      bob,
    ];
    render(<CallLogView />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('10:00 · 5 min')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('09:30')).toBeInTheDocument();
  });

  it('filters calls by search query', () => {
    storeState.callHistory = [alice, bob];
    render(<CallLogView />);
    fireEvent.change(screen.getByPlaceholderText('call.searchCalls'), {
      target: { value: 'ali' },
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('shows no-match state and Clear resets the query', () => {
    storeState.callHistory = [alice];
    render(<CallLogView />);
    fireEvent.change(screen.getByPlaceholderText('call.searchCalls'), {
      target: { value: 'zzz' },
    });
    expect(screen.getByText('call.noCallsMatch')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('clears history via clear-all button', () => {
    storeState.callHistory = [alice];
    render(<CallLogView />);
    fireEvent.click(screen.getByTitle('call.clearAll'));
    expect(storeState.clearCallHistory).toHaveBeenCalledTimes(1);
  });

  it('hides clear-all button when history is empty', () => {
    render(<CallLogView />);
    expect(screen.queryByTitle('call.clearAll')).not.toBeInTheDocument();
  });

  it('offers call-back for missed and declined calls', () => {
    storeState.callHistory = [
      { id: '9', name: 'Alice', type: 'missed', time: '10:00' },
      { id: '10', name: 'Bob', type: 'declined', time: '10:05' },
    ];
    render(<CallLogView />);
    const callbacks = screen.getAllByRole('button', { name: 'call.callBack' });
    expect(callbacks).toHaveLength(2);
    fireEvent.click(callbacks[0]);
    expect(callManagerMock.startPreviewCall).toHaveBeenCalledWith('cb_9', 'Alice', 'audio');
  });

  it('does not offer call-back for answered calls', () => {
    storeState.callHistory = [alice];
    render(<CallLogView />);
    expect(screen.queryByRole('button', { name: 'call.callBack' })).not.toBeInTheDocument();
  });

  it('renders SubView title and working back button', () => {
    const onBack = vi.fn();
    render(<CallLogView onBack={onBack} />);
    const back = screen.getByRole('button', { name: 'back' });
    expect(back).toHaveTextContent('call.callHistory');
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
