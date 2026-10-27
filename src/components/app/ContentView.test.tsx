import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

const mockOpenViewer = vi.fn();
const mockInit = vi.fn();
const storeAuthors = [
  { id: 'a2', name: 'Алиса', avatarUrl: '', stories: [] },
];

vi.mock('../../features/stories/storiesStore', () => ({
  useStoriesStore: Object.assign(
    (selector?: any) => (selector ? mockOpenViewer : {}),
    { getState: () => ({ authors: storeAuthors, init: mockInit, openViewer: mockOpenViewer }) }
  ),
}));

vi.mock('../stories/StoryComposer', () => ({
  StoryComposer: () => <div>StoryComposer</div>,
}));

import { ContentView } from './ContentView';

describe('ContentView', () => {
  beforeEach(() => {
    mockOpenViewer.mockClear();
    mockInit.mockClear();
  });

  it('renders children', () => {
    render(
      <ContentView onCloseStory={vi.fn()} activeStory={null} isStealthMode={false}>
        <div>Content</div>
      </ContentView>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('opens the store viewer when activeStory matches an author by name', () => {
    render(
      <ContentView onCloseStory={vi.fn()} activeStory={{ id: 1, name: 'Алиса', color: '' }} isStealthMode={false}>
        <div>Content</div>
      </ContentView>
    );
    expect(mockOpenViewer).toHaveBeenCalledWith('a2');
  });

  it('does nothing when activeStory is null', () => {
    render(
      <ContentView onCloseStory={vi.fn()} activeStory={null} isStealthMode={false}>
        <div>Content</div>
      </ContentView>
    );
    expect(mockOpenViewer).not.toHaveBeenCalled();
  });

  it('renders the story composer when showStoryComposer is set', () => {
    render(
      <ContentView onCloseStory={vi.fn()} activeStory={null} showStoryComposer onCloseComposer={vi.fn()} isStealthMode={false}>
        <div>Content</div>
      </ContentView>
    );
    expect(screen.getByText('StoryComposer')).toBeInTheDocument();
  });
});
