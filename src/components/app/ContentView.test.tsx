import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('../AppChrome', () => ({
  StoryViewerOverlay: () => <div>StoryViewerOverlay</div>,
}));

import { ContentView } from './ContentView';

describe('ContentView', () => {
  it('renders children', () => {
    render(
      <ContentView onCloseStory={vi.fn()} activeStory={null} isStealthMode={false}>
        <div>Content</div>
      </ContentView>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders StoryViewerOverlay', () => {
    render(
      <ContentView onCloseStory={vi.fn()} activeStory={null} isStealthMode={false}>
        <div>Content</div>
      </ContentView>
    );
    expect(screen.getByText('StoryViewerOverlay')).toBeInTheDocument();
  });
});
