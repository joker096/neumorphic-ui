import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CallMediaStage } from './CallMediaStage';

const t = (k: string) => k;

function makeCall(overrides: Record<string, unknown> = {}) {
  return {
    status: 'active',
    t,
    callType: 'audio',
    participants: [],
    remotePeer: null,
    isMuted: false,
    isVideoEnabled: false,
    ...overrides,
  };
}

const baseProps = {
  isVideo: false,
  initial: 'A',
  statusLabel: '',
  t,
  remoteVideoRef: { current: null } as never,
  localVideoRef: { current: null } as never,
};

describe('CallMediaStage - audio group participant grid (UI/UX plan §12)', () => {
  it('renders a grid tile per participant with name', () => {
    const call = makeCall({
      participants: [
        { peerId: 'p1', displayName: 'Alex' },
        { peerId: 'p2', displayName: 'Bob' },
      ],
      remotePeer: { peerId: 'p2' },
    });
    const { container } = render(<CallMediaStage call={call} isGroup {...baseProps} />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    const tiles = container.querySelectorAll('.neo-raised-sm');
    expect(tiles.length).toBe(2);
  });

  it('highlights the active remote participant tile', () => {
    const call = makeCall({
      participants: [{ peerId: 'p1', displayName: 'Alex' }],
      remotePeer: { peerId: 'p1' },
      isMuted: true,
    });
    const { container } = render(<CallMediaStage call={call} isGroup {...baseProps} />);
    const tile = container.querySelectorAll('.neo-raised-sm')[0];
    expect(tile.className).toContain('ring-1');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('hides the grid for 1:1 audio calls', () => {
    const call = makeCall({ participants: [{ peerId: 'p1', displayName: 'Alex' }] });
    const { container } = render(<CallMediaStage call={call} isGroup={false} {...baseProps} />);
    expect(container.querySelectorAll('.neo-raised-sm').length).toBe(0);
  });
});