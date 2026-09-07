import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttachmentMedia } from './AttachmentMedia';

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string, fallback?: string) => fallback ?? k }) }));
vi.mock('../stories/StoryCard', () => ({
  StoryCard: (p: any) => <div data-testid="mock-story-card" data-story={JSON.stringify(p.story)} />,
}));

function baseProps(over: any = {}) {
  return {
    msg: {},
    isMe: true,
    isDark: false,
    stickerSrc: null,
    onSetActivePhotoUrl: vi.fn(),
    onSetPhotoOpen: vi.fn(),
    onSetVideoOpen: vi.fn(),
    ...over,
  };
}

describe('AttachmentMedia story handling', () => {
  it('renders StoryCard for a story message', () => {
    const story = { userId: 1, userName: 'Alice', storyId: 11, caption: 'hi' };
    render(<AttachmentMedia {...baseProps({ msg: { type: 'story', story } })} />);
    expect(screen.getByTestId('mock-story-card')).toBeTruthy();
  });

  it('forwards the story payload to StoryCard', () => {
    const story = { userId: 2, storyId: 22 };
    render(<AttachmentMedia {...baseProps({ msg: { type: 'story', story } })} />);
    const node = screen.getByTestId('mock-story-card');
    expect(JSON.parse(node.getAttribute('data-story')!)).toEqual(story);
  });

  it('does not render story card for a payment message', () => {
    const { container } = render(<AttachmentMedia {...baseProps({ msg: { type: 'payment', paymentToken: 't' } })} />);
    expect(container.querySelector('[data-testid="mock-story-card"]')).toBeNull();
  });
});
