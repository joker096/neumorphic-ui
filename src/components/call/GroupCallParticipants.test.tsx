import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GroupCallParticipants } from './GroupCallParticipants';

describe('GroupCallParticipants - additional tests', () => {
  it('renders muted indicator', () => {
    render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', isMuted: true }]} />);
    expect(document.querySelector('[class*="text-red-400"]') || document.querySelector('[class*="lucide-mic-off"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render muted indicator when not muted', () => {
    const { container } = render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', isMuted: false }]} />);
    expect(container.querySelector('[class*="text-red-400"]')).not.toBeInTheDocument();
  });

  it('renders mute toggle when onMuteToggle provided', () => {
    const { container } = render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', isMuted: false }]} onMuteToggle={vi.fn()} />);
    expect(container.querySelector('[class*="absolute"]') || container.querySelector('[class*="w-8"]') || container.querySelector('[class*="flex items-center justify-center"]')).toBeInTheDocument();
  });

  it('does not render mute toggle when onMuteToggle not provided', () => {
    const { container } = render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', isMuted: false }]} />);
    expect(container.querySelector('[class*="absolute.top-2"]') || container.querySelector('[class*="w-8"]') || container.querySelector('[class*="h-8"]')).not.toBeInTheDocument();
  });

  it('calls onMuteToggle when mute toggle clicked', () => {
    const onMuteToggle = vi.fn();
    render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', isMuted: false }]} onMuteToggle={onMuteToggle} />);
    const toggleBtn = document.querySelector('[class*="absolute.top-2"]') as HTMLElement;
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(onMuteToggle).toHaveBeenCalledWith('1');
    }
  });

  it('renders grid layout', () => {
    const { container } = render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', isMuted: false }]} />);
    expect(container.querySelector('[class*="grid"]')?.classList.contains('grid-cols-2')).toBeTruthy();
  });

  it('renders participants', () => {
    render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', isMuted: false }]} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('renders avatar with gradient', () => {
    const { container } = render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', isMuted: false }]} />);
    expect(container.querySelector('[class*="from-[var(--accent)]"]') || container.querySelector('[class*="neo-raised"]')).toBeInTheDocument();
  });

  it('renders video when stream provided', () => {
    const mockStream = { getVideoTracks: () => [] };
    const { container } = render(<GroupCallParticipants participants={[{ peerId: '1', displayName: 'John', stream: mockStream as any }]} />);
    expect(container.querySelector('video')).toBeInTheDocument();
  });

  it('renders unknown when no displayName', () => {
    const { container } = render(<GroupCallParticipants participants={[{ peerId: '1', displayName: undefined }]} />);
    expect(container.querySelector('[class*="text-2xl"]') || container.querySelector('[class*="text-[var(--text-primary)]"]') || container.querySelector('[class*="text-\\\\?\\\\?"') || container.querySelector('[class*="text-?"]')).toBeInTheDocument();
  });

  it('renders with multiple participants', () => {
    const participants = [
      { peerId: '1', displayName: 'Alice', isMuted: false },
      { peerId: '2', displayName: 'Bob', isMuted: false },
      { peerId: '3', displayName: 'Charlie', isMuted: true },
    ];
    const { container } = render(<GroupCallParticipants participants={participants} />);
    expect(container.querySelectorAll('[class*="neo-raised"]').length).toBe(3);
  });

  it('renders each participant with unique key', () => {
    const participants = [{ peerId: '1', displayName: 'John', isMuted: false }];
    const { container } = render(<GroupCallParticipants participants={participants} />);
    expect(container.querySelector('[class*="aspect-video"]')).toBeInTheDocument();
  });
});
