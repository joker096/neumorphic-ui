import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChannelCommentsView } from './ChannelCommentsView';
import { get, set } from '../lib/idb';
import { CURRENT_USER_SENDER, type ChannelComment } from '../constants/channelConstants';

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
}));
vi.mock('../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../lib/idb', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const getMock = vi.mocked(get);
const setMock = vi.mocked(set);

const renderView = (isOpen = true) =>
  render(<ChannelCommentsView isOpen={isOpen} onClose={vi.fn()} postId={42} />);

/** Flush the async `get()` hydration promise before asserting. */
const flush = async () => {
  await act(async () => {});
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ChannelCommentsView', () => {
  it('renders nothing when closed', () => {
    getMock.mockResolvedValue([]);
    const { container } = renderView(false);
    expect(container).toBeEmpty();
  });

  it('shows the empty state when no comments are stored', async () => {
    getMock.mockResolvedValue(undefined);
    renderView();
    await flush();
    expect(screen.getByText('channelComments.leaveAComment')).toBeInTheDocument();
  });

  it('renders stored comments, hiding the sender name for own comments', async () => {
    const stored: ChannelComment[] = [
      { id: 1, sender: 'Alice', text: 'Hello world', time: '10:00', postId: 42 },
      { id: 2, sender: CURRENT_USER_SENDER, text: 'My reply', time: '10:05', postId: 42 },
    ];
    getMock.mockResolvedValue(stored);
    renderView();
    await flush();

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('My reply')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText(CURRENT_USER_SENDER, { exact: true })).toBeNull();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('sends a comment: appends to the list, persists via idb, clears the input', async () => {
    getMock.mockResolvedValue([]);
    renderView();
    await flush();

    const input = screen.getByPlaceholderText('channelComments.placeholder');
    fireEvent.change(input, { target: { value: 'Nice post' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith(
      'channel_comments_42',
      expect.arrayContaining([
        expect.objectContaining({ sender: CURRENT_USER_SENDER, text: 'Nice post', postId: 42 }),
      ]),
    );
    expect(input).toHaveValue('');
    expect(screen.getByText('Nice post')).toBeInTheDocument();
  });

  it('does not persist an empty comment', async () => {
    getMock.mockResolvedValue([]);
    renderView();
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(setMock).not.toHaveBeenCalled();
  });
});
