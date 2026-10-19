import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AvatarRow } from '../chat-preview/AvatarRow';
import { STORY_USERS, getVisibleStories } from '../stories/storiesData';
import { markStoriesSeen } from '../../lib/stories/storySeen';

beforeEach(() => {
  localStorage.clear();
});

describe('AvatarRow', () => {
  it('renders the my-story tile with translated label', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('header.myStory')).toBeInTheDocument();
  });

  it('does not render the bulky uppercase stories header', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.queryByText('header.stories')).toBeNull();
  });

  it('renders multiple contact avatars', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();
  });

  it('renders a compose badge and routes it to the composer, not the viewer', () => {
    const onComposeStory = vi.fn();
    const onStoryClick = vi.fn();
    const { container } = render(
      <AvatarRow t={(k) => k} theme="dark" onComposeStory={onComposeStory} onStoryClick={onStoryClick} />
    );
    const badge = container.querySelector('[data-story-compose="true"]');
    expect(badge).not.toBeNull();
    fireEvent.click(badge as HTMLElement);
    expect(onComposeStory).toHaveBeenCalledTimes(1);
    expect(onStoryClick).not.toHaveBeenCalled();
  });

  it('calls onStoryClick when a contact avatar is clicked', () => {
    const onStoryClick = vi.fn();
    render(<AvatarRow t={(k) => k} theme="dark" onStoryClick={onStoryClick} />);

    fireEvent.click(screen.getByText('Alice'));
    expect(onStoryClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'Alice' })
    );
  });

  it('renders contact initials inside avatars', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('draws one gradient arc per story for unseen users', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    const avatar = screen.getByText('A').closest('[data-story-ring="unseen"]');
    expect(avatar).not.toBeNull();
    expect(avatar?.querySelectorAll('circle')).toHaveLength(getVisibleStories(STORY_USERS[0]).length);
  });

  it('drops the ring after the user stories are seen', () => {
    const { rerender } = render(<AvatarRow t={(k) => k} theme="dark" />);
    markStoriesSeen(STORY_USERS[0]);
    rerender(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('A').closest('[data-story-ring="unseen"]')).toBeNull();
    expect(screen.getByText('A').closest('[data-story-ring="seen"]')).not.toBeNull();
  });

  it('keeps the accent ring for my own story regardless of seen state', () => {
    markStoriesSeen({ id: 0, name: 'You', color: 'x', avatarColor: 'x', stories: [{ id: 1, type: 'gradient', bg: '', time: Date.now(), views: 0, reactions: 0 }] });
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('Y').closest('[data-story-ring="own"]')).not.toBeNull();
  });
});
