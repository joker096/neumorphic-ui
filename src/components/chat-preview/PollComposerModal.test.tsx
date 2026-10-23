import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PollComposerModal } from './PollComposerModal';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, opts?: any) => (opts && opts.n !== undefined ? `${key} ${opts.n}` : key),
  }),
}));

function setup(onSubmit = vi.fn()) {
  const onClose = vi.fn();
  render(<PollComposerModal open onClose={onClose} onSubmit={onSubmit} />);
  return { onSubmit, onClose };
}

function fill(question: string, first: string, second: string) {
  fireEvent.change(screen.getByPlaceholderText('chat.pollQuestionPlaceholder'), {
    target: { value: question },
  });
  fireEvent.change(screen.getByLabelText('chat.pollOption 1'), { target: { value: first } });
  fireEvent.change(screen.getByLabelText('chat.pollOption 2'), { target: { value: second } });
}

describe('PollComposerModal', () => {
  it('keeps submit disabled until there is a question and two options', () => {
    setup();
    const submit = screen.getByRole('button', { name: 'chat.createPoll' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('chat.pollQuestionPlaceholder'), {
      target: { value: 'Lunch?' },
    });
    fireEvent.change(screen.getByLabelText('chat.pollOption 1'), { target: { value: 'Sushi' } });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('chat.pollOption 2'), { target: { value: 'Pizza' } });
    expect(submit).toBeEnabled();
  });

  it('submits the ballot and closes', () => {
    const { onSubmit, onClose } = setup();
    fill('Lunch?', 'Sushi', 'Pizza');
    fireEvent.click(screen.getByRole('switch', { name: 'chat.pollMultiple' }));
    fireEvent.click(screen.getByRole('button', { name: 'chat.createPoll' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toBe('Lunch?');
    expect(onSubmit.mock.calls[0][1]).toEqual(['Sushi', 'Pizza']);
    expect(onSubmit.mock.calls[0][2]).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it('adds and removes an option up to the cap', () => {
    setup();
    const optionInputs = () => screen.getAllByLabelText(/^chat\.pollOption/);
    expect(optionInputs()).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'chat.pollAddOption' }));
    expect(optionInputs()).toHaveLength(3);
    fireEvent.click(screen.getAllByRole('button', { name: 'chat.pollRemoveOption' })[0]);
    expect(optionInputs()).toHaveLength(2);
  });

  it('closes on Escape', () => {
    const { onClose } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
