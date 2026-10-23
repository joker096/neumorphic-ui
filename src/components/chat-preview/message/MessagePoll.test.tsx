import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessagePoll } from './MessagePoll';
import { createPoll, applyVote } from '../../../lib/polls';

vi.mock('../../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, opts?: any) => (opts?.count !== undefined ? `${key}:${opts.count}` : key) }),
}));

const ballot = () => applyVote(createPoll('Lunch?', ['Sushi', 'Pizza'], false), 'opt_1', 'me', 'add');

describe('MessagePoll', () => {
  it('marks the local vote and shows the total', () => {
    render(<MessagePoll poll={ballot()} onVote={vi.fn()} />);
    const [first, second] = screen.getAllByRole('button');
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('chat.pollVotes:1')).toBeInTheDocument();
  });

  it('reports the clicked option id', () => {
    const onVote = vi.fn();
    render(<MessagePoll poll={ballot()} onVote={onVote} />);
    fireEvent.click(screen.getByRole('button', { name: /Pizza/ }));
    expect(onVote).toHaveBeenCalledWith('opt_2');
  });

  it('is read-only when closed or without a handler', () => {
    const closed = { ...createPoll('Q', ['A', 'B'], false), closed: true };
    const { rerender } = render(<MessagePoll poll={closed} onVote={vi.fn()} />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
    expect(screen.getByText(/chat\.pollClosed/)).toBeInTheDocument();
    rerender(<MessagePoll poll={createPoll('Q', ['A', 'B'], false)} />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
  });
});
