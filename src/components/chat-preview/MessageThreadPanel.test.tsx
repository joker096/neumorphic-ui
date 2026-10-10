import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageThreadPanel } from './MessageThreadPanel';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

const t = (key: string, options?: any) => {
  const map: Record<string, any> = {
    'chat.threadTitle': 'Thread',
    'chat.threadPlaceholder': 'Reply in thread…',
    'chat.threadSend': 'Send',
    'chat.threadOpen': 'Open thread',
    'common.close': 'Close',
  };
  if (key === 'chat.threadReplies') return `${options.count} replies`;
  return map[key] || key;
};

const root = { id: 1, sender: 'me', text: 'root message', time: '10:00' };
const replies = [
  { id: 2, sender: 'Bob', text: 'first reply', time: '10:01' },
  { id: 3, sender: 'me', text: 'second reply', time: '10:02' },
];

const baseProps = {
  open: true,
  isDark: true,
  rootMessage: root,
  replies,
  t,
  onClose: vi.fn(),
  onSend: vi.fn(),
};

describe('MessageThreadPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<MessageThreadPanel {...baseProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the root message and every reply', () => {
    render(<MessageThreadPanel {...baseProps} />);
    expect(screen.getByText('root message')).toBeInTheDocument();
    expect(screen.getByText('first reply')).toBeInTheDocument();
    expect(screen.getByText('second reply')).toBeInTheDocument();
    expect(screen.getByText('2 replies')).toBeInTheDocument();
  });

  it('sends the trimmed draft and clears the composer', () => {
    const onSend = vi.fn();
    render(<MessageThreadPanel {...baseProps} onSend={onSend} />);
    const input = screen.getByPlaceholderText('Reply in thread…') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  new reply  ' } });
    fireEvent.click(screen.getByLabelText('Send'));
    expect(onSend).toHaveBeenCalledWith('new reply');
    expect(input.value).toBe('');
  });

  it('sends on Enter', () => {
    const onSend = vi.fn();
    render(<MessageThreadPanel {...baseProps} onSend={onSend} />);
    const input = screen.getByPlaceholderText('Reply in thread…');
    fireEvent.change(input, { target: { value: 'enter reply' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('enter reply');
  });

  it('does not send an empty draft', () => {
    const onSend = vi.fn();
    render(<MessageThreadPanel {...baseProps} onSend={onSend} />);
    fireEvent.click(screen.getByLabelText('Send'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('closes when the back button is clicked', () => {
    const onClose = vi.fn();
    render(<MessageThreadPanel {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
