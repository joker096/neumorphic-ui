import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AvatarRow } from '../chat-preview/AvatarRow';
import { STORY_USERS } from '../stories/storiesData';
import { markStoriesSeen } from '../../lib/stories/storySeen';

beforeEach(() => {
  localStorage.clear();
});

describe('AvatarRow', () => {
  it('renders my story section with translated label', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('header.myStory')).toBeInTheDocument();
  });

  it('renders the stories header label', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('header.stories')).toBeInTheDocument();
  });

  it('renders multiple contact avatars', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();
  });

  it('renders the plus button for new story', () => {
    const { container } = render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onStoryClick when a contact avatar is clicked', () => {
    const onStoryClick = vi.fn();
    render(<AvatarRow t={(k) => k} theme="dark" onStoryClick={onStoryClick} />);

    const alice = screen.getByText('Alice');
    fireEvent.click(alice);
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

  it('shows an accent ring for a user with unseen stories', () => {
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('A').closest('[class*="ring-[var(--accent)]"]')).not.toBeNull();
  });

  it('drops the accent ring after the user stories are seen', () => {
    const { rerender } = render(<AvatarRow t={(k) => k} theme="dark" />);
    markStoriesSeen(STORY_USERS[0]);
    rerender(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('A').closest('[class*="ring-[var(--accent)]"]')).toBeNull();
  });

  it('keeps the accent ring for my own story regardless of seen state', () => {
    markStoriesSeen({ id: 0, name: 'You', color: 'x', avatarColor: 'x', stories: [{ id: 1, type: 'gradient', bg: '', time: Date.now(), views: 0, reactions: 0 }] });
    render(<AvatarRow t={(k) => k} theme="dark" />);
    expect(screen.getByText('Y').closest('[class*="ring-[var(--accent)]"]')).not.toBeNull();
  });
});
