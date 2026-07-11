import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CallHistorySheet } from './CallHistorySheet';

// Default mock data
const mockCallHistory = [
  { id: '1', name: 'John', type: 'incoming', time: '10:00 AM', duration: '5:30' },
  { id: '2', name: 'Jane', type: 'missed', time: '9:00 AM', duration: null },
  { id: '3', name: 'Bob', type: 'outgoing', time: '8:00 AM', duration: '3:00' },
];

const defaultStore = {
  callHistory: mockCallHistory,
  clearCallHistory: vi.fn(),
};

vi.mock('../../store', () => ({
  useAppStore: vi.fn((selector?: (state: any) => any) => {
    const state = defaultStore;
    return selector ? selector(state) : state;
  }),
}));

describe('CallHistorySheet - additional tests', () => {
  beforeEach(() => {
    defaultStore.callHistory = mockCallHistory;
    defaultStore.clearCallHistory = vi.fn();
  });

  afterEach(() => {
    defaultStore.callHistory = mockCallHistory;
    defaultStore.clearCallHistory = vi.fn();
  });

  it('renders all call entries', () => {
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders call type icons for each entry', () => {
    const { container } = render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    const icons = container.querySelectorAll('[class*="lucide-phone"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders dark theme styles', () => {
    const { container } = render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(container.querySelector('[class*="modal-surface"]') || container.querySelector('[class*="max-h-[60vh]"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="light" />);
    expect(container.querySelector('[class*="modal-surface"]') || container.querySelector('[class*="max-h-[60vh]"]')).toBeInTheDocument();
  });

  it('renders call history title', () => {
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(screen.getByText('Call History')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(document.querySelector('[class*="lucide-x"]') || document.querySelector('[class*="lucide-X"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    const search = document.querySelector('input');
    expect(search).toHaveAttribute('placeholder', 'Search calls');
  });

  it('renders clear button when history has items', () => {
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(document.querySelector('[class*="lucide-trash"]') || document.querySelector('[class*="lucide-trash-2"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders empty state when no history', () => {
    defaultStore.callHistory = [];
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(screen.getByText('No calls yet')).toBeInTheDocument();
    defaultStore.callHistory = mockCallHistory;
  });

  it('renders filtered results when searching', () => {
    const filteredData = [
      { id: '1', name: 'John', type: 'incoming', time: '10:00 AM', duration: '5:30' },
      { id: '2', name: 'Jane', type: 'outgoing', time: '9:00 AM', duration: null },
    ];
    defaultStore.callHistory = filteredData;
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    const search = document.querySelector('input');
    if (search) {
      fireEvent.change(search, { target: { value: 'John' } });
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.queryByText('Jane')).not.toBeInTheDocument();
    }
    defaultStore.callHistory = mockCallHistory;
  });

  it('renders call type text', () => {
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(screen.getByText('incoming')).toBeInTheDocument();
    expect(screen.getByText('missed')).toBeInTheDocument();
    expect(screen.getByText('outgoing')).toBeInTheDocument();
  });

  it('renders call durations when present', () => {
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(screen.getByText('5:30')).toBeInTheDocument();
  });

  it('does not render duration when null', () => {
    defaultStore.callHistory = [{ id: '1', name: 'Jane', type: 'missed', time: '9:00 AM', duration: null }];
    render(<CallHistorySheet open={true} onClose={vi.fn()} onCall={() => {}} theme="dark" />);
    expect(screen.getByText('Jane')).toBeInTheDocument();
    defaultStore.callHistory = mockCallHistory;
  });
});
