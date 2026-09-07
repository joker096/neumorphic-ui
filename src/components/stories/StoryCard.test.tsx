import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryCard } from './StoryCard';

vi.mock('lucide-react', () => {
  const icon = (name: string) => (p: any) => <span data-testid={`icon-${name}`} {...p} />;
  return {
    Globe: icon('Globe'),
    ImageOff: icon('ImageOff'),
    Play: icon('Play'),
    UserCheck: icon('UserCheck'),
    Users: icon('Users'),
    EyeOff: icon('EyeOff'),
    Link2: icon('Link2'),
  };
});
vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string, fallback?: string) => fallback ?? k }) }));

describe('StoryCard', () => {
  it('renders a gradient + caption for a default (non-media) story', () => {
    render(<StoryCard story={{ userId: 1, caption: 'Hello', userName: 'Alice' }} />);
    expect(screen.getByTestId('story-card')).toBeTruthy();
    const bg = screen.getByTestId('story-card-bg');
    expect(bg.className).toContain('bg-gradient-to-br');
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText(/Alice/)).toBeTruthy();
  });

  it('renders photo media when type is photo', () => {
    render(<StoryCard story={{ userId: 1, type: 'photo', image: 'data:image/png;base64,xxx', caption: 'pic' }} />);
    const img = screen.getByAltText('');
    expect(img).toBeTruthy();
    expect((img as HTMLImageElement).src).toContain('data:image/png');
  });

  it('renders video with play overlay when type is video', () => {
    render(<StoryCard story={{ userId: 1, type: 'video', video: 'https://x/v.mp4', caption: 'vid' }} />);
    expect(screen.getByTestId('icon-Play')).toBeTruthy();
  });

  it('falls back to image-off placeholder when media errors', () => {
    const { container } = render(<StoryCard story={{ userId: 1, type: 'photo', image: 'https://x/broken.jpg' }} />);
    expect(screen.getByAltText('')).toBeTruthy();
    fireEvent.error(screen.getByAltText(''));
    expect(screen.getByTestId('icon-ImageOff')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders default Story label when no user name', () => {
    render(<StoryCard story={{ userId: 1, caption: 'X' }} />);
    expect(screen.getByText('Story')).toBeTruthy();
  });
});
