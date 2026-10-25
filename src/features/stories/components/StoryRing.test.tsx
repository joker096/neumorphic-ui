import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StoryRing } from './StoryRing';
import type { Story } from '../types';

function story(id: string, seen: boolean): Story {
  return {
    id,
    authorId: 'a',
    media: { kind: 'image', src: 'https://example.com/s.png' },
    createdAt: new Date().toISOString(),
    viewsCount: 0,
    likesCount: 0,
    likedByMe: false,
    viewedByMe: seen,
  };
}

describe('StoryRing', () => {
  it('renders a solid ring for a single story', () => {
    const { container } = render(<StoryRing stories={[story('1', false)]} size={56} />);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });

  it('renders segmented arcs for multiple stories', () => {
    const { container } = render(<StoryRing stories={[story('1', false), story('2', true)]} size={56} />);
    // base track circle + 2 arcs
    expect(container.querySelectorAll('circle')).toHaveLength(1);
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  it('exposes a readable label', () => {
    const { getByRole } = render(<StoryRing stories={[story('1', false), story('2', true)]} size={56} />);
    expect(getByRole('img').getAttribute('aria-label')).toContain('2 stories');
  });
});
