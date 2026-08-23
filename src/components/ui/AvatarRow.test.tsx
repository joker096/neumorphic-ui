import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AvatarRow } from '../chat-preview/AvatarRow';

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
});
