import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BubbleActions } from './BubbleActions';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, lang: 'en' }),
}));

const renderActions = (overrides: Record<string, unknown> = {}) => {
  render(
    <BubbleActions
      msg={{ id: 7, myReactions: {} }}
      isMe={false}
      chat={{ id: 1 }}
      chatSavedMessages={[]}
      onReply={vi.fn()}
      onToggleSavedMessage={vi.fn()}
      onReactionMessage={vi.fn()}
      {...(overrides as any)}
    />,
  );
};

describe('BubbleActions', () => {
  it('keeps the reaction grid closed until the add-reaction chip is pressed', () => {
    renderActions();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByLabelText('chat.reactions'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('reports the picked emoji and closes the grid', () => {
    const onReactionMessage = vi.fn();
    renderActions({ onReactionMessage });
    fireEvent.click(screen.getByLabelText('chat.reactions'));
    fireEvent.click(screen.getByLabelText('👍'));
    expect(onReactionMessage).toHaveBeenCalledWith(7, '👍');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes the grid when the pointer leaves the toolbar', () => {
    renderActions();
    fireEvent.click(screen.getByLabelText('chat.reactions'));
    fireEvent.mouseLeave(screen.getByRole('menu').parentElement!.parentElement!);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
