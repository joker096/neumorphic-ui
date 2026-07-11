import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'button' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('lucide-react', () => ({ X: 'div', Globe: 'div', Lock: 'div', Check: 'div', Shield: 'div' }));

const mockSetChannels = vi.fn();
const mockStore = { channels: [], setChannels: mockSetChannels };
vi.mock('../../store', () => ({
  useAppStore: (selector?: any) => selector ? selector(mockStore) : mockStore,
  P2PChannel: {},
}));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import { CreateChannelModal } from './CreateChannelModal';

describe('CreateChannelModal', () => {
  it('renders title and form fields', () => {
    render(<CreateChannelModal onClose={vi.fn()} />);
    expect(screen.getByText('createChannel.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('createChannel.namePlaceholder')).toBeInTheDocument();
  });

  it('renders public/private options', () => {
    render(<CreateChannelModal onClose={vi.fn()} />);
    expect(screen.getByText('createChannel.public')).toBeInTheDocument();
    expect(screen.getByText('createChannel.private')).toBeInTheDocument();
  });

  it('renders create button', () => {
    render(<CreateChannelModal onClose={vi.fn()} />);
    expect(screen.getByText('createChannel.create')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<CreateChannelModal onClose={onClose} />);
    const closeBtn = screen.getByText('createChannel.title').nextElementSibling!;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
