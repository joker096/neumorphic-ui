import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StoryViewer } from './StoryViewer';
import { MY_STORY_USER, STORY_USERS, type StoryItem } from './storiesData';
import { toast } from '../ui/Toast';

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
}));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

const ORIGINAL_STORIES = MY_STORY_USER.stories.map((s) => ({ ...s }));

const ALICE = { id: 1, name: 'Alice', color: 'from-rose-400 to-red-500' };
const ME = { id: 0, name: 'You', color: 'from-[var(--accent)] to-purple-500' };
const EVE = { id: 5, name: 'Eve', color: 'from-teal-400 to-emerald-400' };

const barWidths = () =>
  Array.from(document.querySelectorAll('div[class*="bg-white/30"] > div')).map((el) => (el as HTMLElement).style.width);

const getContent = () =>
  document.body.querySelector('[class*="overflow-hidden"][class*="select-none"]') as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  MY_STORY_USER.stories.splice(0, MY_STORY_USER.stories.length, ...ORIGINAL_STORIES.map((s) => ({ ...s })));
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

describe('StoryViewer', () => {
  it('renders nothing when activeUser is null', () => {
    const { container } = render(<StoryViewer activeUser={null} onClose={vi.fn()} />);
    expect(container).toBeEmpty();
  });

  it('renders active user, name and time label', () => {
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('14m')).toBeInTheDocument();
  });

  it('shows story views label by default', () => {
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    expect(screen.getByText('story.views')).toBeInTheDocument();
  });

  it('shows stealth label in stealth mode', () => {
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} isStealthMode />);
    expect(screen.getByText('Viewed stealthily')).toBeInTheDocument();
  });

  it('advances progress on timer ticks', () => {
    vi.useFakeTimers();
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    act(() => vi.advanceTimersByTime(50 * 5));
    expect(barWidths()[0]).toBe('5%');
    vi.useRealTimers();
    container.remove();
  });

  it('auto-advances to the next story after full progress', () => {
    vi.useFakeTimers();
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    act(() => vi.advanceTimersByTime(50 * 101));
    expect(barWidths()).toEqual(['100%', '0%']);
    vi.useRealTimers();
    container.remove();
  });

  it('auto-advances to the next user after the last story', () => {
    vi.useFakeTimers();
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    act(() => vi.advanceTimersByTime(50 * 101));
    act(() => vi.advanceTimersByTime(50 * 101));
    expect(screen.getByText('Bob')).toBeInTheDocument();
    vi.useRealTimers();
    container.remove();
  });

  it('back button returns to previous user last story', () => {
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('common.back'));
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('back button at first user resets progress', () => {
    vi.useFakeTimers();
    const { container } = render(<StoryViewer activeUser={ME} onClose={vi.fn()} />);
    act(() => vi.advanceTimersByTime(50 * 25));
    expect(barWidths()[0]).toBe('25%');
    fireEvent.click(screen.getByLabelText('common.back'));
    expect(barWidths()[0]).toBe('0%');
    vi.useRealTimers();
    container.remove();
  });

  it('left zone tap goes to previous story', () => {
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    const content = getContent();
    content.getBoundingClientRect = () =>
      ({ width: 300, left: 0, top: 0, right: 300, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.click(content, { clientX: 50 });
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('right zone tap on last story of last user closes viewer', () => {
    const onClose = vi.fn();
    const { container } = render(<StoryViewer activeUser={EVE} onClose={onClose} />);
    const content = getContent();
    content.getBoundingClientRect = () =>
      ({ width: 300, left: 0, top: 0, right: 300, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.click(content, { clientX: 250 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pauses progress while pointer is held down', () => {
    vi.useFakeTimers();
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    act(() => vi.advanceTimersByTime(50 * 2));
    expect(barWidths()[0]).toBe('2%');
    const content = getContent();
    fireEvent.mouseDown(content);
    act(() => vi.advanceTimersByTime(50 * 10));
    expect(barWidths()[0]).toBe('2%');
    fireEvent.mouseUp(content);
    act(() => vi.advanceTimersByTime(50 * 3));
    expect(barWidths()[0]).toBe('5%');
    vi.useRealTimers();
    container.remove();
  });

  it('opens in-app share sheet even when navigator.share is available (never native share)', async () => {
    const share = vi.fn().mockResolvedValue({});
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true });
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByText('Share story')).toBeInTheDocument();
    expect(share).not.toHaveBeenCalled();
  });

  it('opens share sheet when navigator.share is missing, and copies link from it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByText('Share story')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('nexus://story/1/11'));
    expect(toast).toHaveBeenCalledWith('Link copied', 'success');
  });

  it('sends reply on Enter and clears input', () => {
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Send a reply…');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(toast).toHaveBeenCalledWith('Reply sent', 'success');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('does nothing on empty reply', () => {
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    fireEvent.keyDown(screen.getByLabelText('Send a reply…'), { key: 'Enter' });
    expect(toast).not.toHaveBeenCalled();
  });

  it('toggles like with reaction toasts', () => {
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    const like = screen.getByLabelText('story.react');
    fireEvent.click(like);
    expect(toast).toHaveBeenLastCalledWith('Reacted ❤', 'success');
    expect(like).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(like);
    expect(toast).toHaveBeenLastCalledWith('Removed reaction', 'success');
    expect(like).toHaveAttribute('aria-pressed', 'false');
  });

  it('hides reply input and like for own story', () => {
    render(<StoryViewer activeUser={ME} onClose={vi.fn()} />);
    expect(screen.queryByLabelText('Send a reply…')).toBeNull();
    expect(screen.queryByLabelText('story.react')).toBeNull();
    expect(screen.getByText('Your story')).toBeInTheDocument();
  });

  it('opens options menu and copies link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.more' }));
    expect(screen.getByRole('dialog', { name: 'Story options' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('nexus://story/1/11'));
    expect(screen.queryByRole('dialog', { name: 'Story options' })).toBeNull();
  });

  it('deletes last own story and advances to next user with stories', () => {
    const onClose = vi.fn();
    render(<StoryViewer activeUser={ME} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.more' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete story' }));
    expect(toast).toHaveBeenCalledWith('Story deleted', 'success');
    expect(MY_STORY_USER.stories).toHaveLength(0);
    expect(screen.getByRole('dialog', { name: 'Alice' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes viewer when no user has stories after delete', () => {
    const onClose = vi.fn();
    const saved: StoryItem[][] = [MY_STORY_USER, ...STORY_USERS].map((u) => u.stories.map((s) => ({ ...s })));
    [MY_STORY_USER, ...STORY_USERS].forEach((u) => (u.stories = []));
    MY_STORY_USER.stories = [{ id: 999, type: 'gradient' as const, bg: '', time: Date.now(), views: 0, reactions: 0 }];
    render(<StoryViewer activeUser={ME} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.more' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete story' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    [MY_STORY_USER, ...STORY_USERS].forEach((u, i) => (u.stories = saved[i]));
  });

  it('close button in header calls onClose', () => {
    const onClose = vi.fn();
    render(<StoryViewer activeUser={ALICE} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('swipe left advances to the next story', () => {
    vi.useFakeTimers();
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    expect(screen.getByText('Sunset hike with the team 🌄')).toBeInTheDocument();
    const content = getContent();
    content.getBoundingClientRect = () =>
      ({ width: 300, left: 0, top: 0, right: 300, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.touchStart(content, { touches: [{ clientX: 250, clientY: 200 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 120, clientY: 200 }] });
    fireEvent.touchEnd(content, { changedTouches: [{ clientX: 120, clientY: 200 }] });
    expect(screen.getByText('Coffee break ☕')).toBeInTheDocument();
    vi.useRealTimers();
    container.remove();
  });

  it('swipe right backs to the previous user last story', () => {
    vi.useFakeTimers();
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    const content = getContent();
    content.getBoundingClientRect = () =>
      ({ width: 300, left: 0, top: 0, right: 300, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.touchStart(content, { touches: [{ clientX: 80, clientY: 200 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 240, clientY: 200 }] });
    fireEvent.touchEnd(content, { changedTouches: [{ clientX: 240, clientY: 200 }] });
    expect(screen.getByText('You')).toBeInTheDocument();
    vi.useRealTimers();
    container.remove();
  });

  it('swipe down closes the viewer', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={onClose} />);
    const content = getContent();
    content.getBoundingClientRect = () =>
      ({ width: 300, left: 0, top: 0, right: 300, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.touchStart(content, { touches: [{ clientX: 200, clientY: 80 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 205, clientY: 260 }] });
    fireEvent.touchEnd(content, { changedTouches: [{ clientX: 205, clientY: 260 }] });
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
    container.remove();
  });

  it('suppresses synthesized tap-nav after a swipe', () => {
    vi.useFakeTimers();
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    const content = getContent();
    content.getBoundingClientRect = () =>
      ({ width: 300, left: 0, top: 0, right: 300, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.touchStart(content, { touches: [{ clientX: 250, clientY: 200 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 120, clientY: 200 }] });
    fireEvent.touchEnd(content, { changedTouches: [{ clientX: 120, clientY: 200 }] });
    expect(screen.getByText('Coffee break ☕')).toBeInTheDocument();
    fireEvent.click(content, { clientX: 250 });
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    vi.useRealTimers();
    container.remove();
  });

  it('renders into the document body portal so a transformed ancestor cannot trap it (z-index fix)', () => {
    const { container } = render(<StoryViewer activeUser={ALICE} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Alice' });
    expect(container).not.toContainElement(dialog);
    expect(document.body).toContainElement(dialog);
  });
});
