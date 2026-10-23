import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatAttachLayer } from './ChatAttachLayer';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, opts?: any) => (opts?.n !== undefined ? `${key} ${opts.n}` : key) }),
}));

const t = (k: string) => k;

const props = () => ({
  open: true,
  onClose: vi.fn(),
  onOpenVideoRecorder: vi.fn(),
  mediaInputRef: { current: null },
  docInputRef: { current: null },
  audioInputRef: { current: null },
  t,
});

describe('ChatAttachLayer — poll tile', () => {
  it('opens the poll composer instead of sending on the tile click', () => {
    const sendPoll = vi.fn();
    render(<ChatAttachLayer {...props()} sendPoll={sendPoll} />);
    fireEvent.click(screen.getByText('chat.createPoll'));
    expect(sendPoll).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sends the ballot through sendPoll', () => {
    const sendPoll = vi.fn();
    render(<ChatAttachLayer {...props()} sendPoll={sendPoll} />);
    fireEvent.click(screen.getByText('chat.createPoll'));
    fireEvent.change(screen.getByPlaceholderText('chat.pollQuestionPlaceholder'), {
      target: { value: 'Lunch?' },
    });
    fireEvent.change(screen.getByLabelText('chat.pollOption 1'), { target: { value: 'Sushi' } });
    fireEvent.change(screen.getByLabelText('chat.pollOption 2'), { target: { value: 'Pizza' } });
    fireEvent.click(screen.getByRole('button', { name: 'chat.createPoll' }));
    expect(sendPoll).toHaveBeenCalledWith('Lunch?', ['Sushi', 'Pizza'], false);
  });
});
